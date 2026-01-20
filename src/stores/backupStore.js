import { defineStore } from 'pinia';
import { ref } from 'vue';
import LZString from 'lz-string';

export const useBackupStore = defineStore('backup', () => {
  // 状态
  const githubToken = ref('');
  const githubRepo = ref(''); // 格式: 'owner/repo'
  const isBackingUp = ref(false);
  const lastBackupTime = ref(null);

  // 核心：创建备份数据（异步）
  function createBackupData(options = { chat: true, characters: true, settings: true, appearance: true, worldbook: true }) {
    return new Promise((resolve) => {
      setTimeout(() => {
        const backupData = {};

        // 1. 处理 SingleChatData
        const singleChatDataRaw = localStorage.getItem('aiPhoneSingleChatData');
        if (singleChatDataRaw) {
            try {
                const decompressed = LZString.decompressFromUTF16(singleChatDataRaw);
                const data = decompressed ? JSON.parse(decompressed) : JSON.parse(singleChatDataRaw);
                
                const newData = {};
                let hasData = false;

                if (options.chat) { newData.messages = data.messages; hasData = true; }
                if (options.characters) {
                    newData.characters = data.characters;
                    newData.userPersonas = data.userPersonas;
                    newData.favorites = data.favorites;
                    hasData = true;
                }
                if (options.appearance) {
                    newData.bubblePresets = data.bubblePresets;
                    newData.stickers = data.stickers;
                    hasData = true; 
                }

                if (hasData) {
                    const jsonString = JSON.stringify(newData);
                    const compressed = LZString.compressToUTF16(jsonString);
                    backupData['aiPhoneSingleChatData'] = compressed;
                }
            } catch (e) { console.error('Error processing single chat data for backup', e); }
        }

        // 2. Moments
        if (options.chat) {
            const momentsData = localStorage.getItem('aiPhoneMomentsData');
            if (momentsData) backupData['aiPhoneMomentsData'] = momentsData;
        }

        // 3. Settings
        if (options.settings) {
            const keys = [
                'api_presets', 'api_activePresetName', 'api_imageHostProvider', 'api_imgbbApiKey', 'api_catboxUserHash',
                'aiPhoneGlobalBackgroundActivity', 'aiPhoneGlobalProactiveScope', 'aiPhoneGlobalProactiveInterval', 
                'aiPhoneGlobalProactiveCooldown', 'aiPhoneGlobalProactiveDailyLimit', 'aiPhoneGlobalTriggerMode', 
                'aiPhoneGlobalProactiveIdleTime'
            ];
            keys.forEach(key => {
                const val = localStorage.getItem(key);
                if (val !== null) backupData[key] = val;
            });
        }

        // 4. Appearance
        if (options.appearance) {
            const keys = [
                'aiPhoneThemePresets', 'aiPhoneCurrentThemePreset', 'aiPhoneFontPresets', 'aiPhoneCurrentFontPreset',
                'aiPhoneCssPresets', 'aiPhoneCurrentCssPreset'
            ];
            keys.forEach(key => {
                const val = localStorage.getItem(key);
                if (val !== null) backupData[key] = val;
            });
        }

        // 5. Worldbook
        if (options.worldbook) {
            const keys = ['worldBooks', 'worldBookNextId'];
            keys.forEach(key => {
                const val = localStorage.getItem(key);
                if (val !== null) backupData[key] = val;
            });
        }

        resolve(JSON.stringify(backupData, null, 2));
      }, 0);
    });
  }

  // 一键创建备份仓库
  async function createBackupRepo() {
    githubToken.value = localStorage.getItem('github_token') || '';
    if (!githubToken.value) {
      alert('请先设置 GitHub Token！');
      return;
    }
    
    try {
      const response = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          'Authorization': `token ${githubToken.value}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'phone-backup',
          private: true,
          description: 'Backup for Phone Vue App'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        githubRepo.value = data.full_name;
        alert(`仓库 ${data.full_name} 创建成功！即将开始备份...`);
        await backupToGitHub();
      } else {
        if (response.status === 401) {
          alert('创建仓库失败: GitHub Token 无效或过期 (401)。请检查设置。');
          return;
        }
        const error = await response.json();
        // 如果仓库已存在，尝试直接使用
        if (error.errors && error.errors[0].message === 'name already exists on this account') {
             // 获取用户信息以构建 repo name
             const userRes = await fetch('https://api.github.com/user', {
                 headers: { 'Authorization': `token ${githubToken.value}` }
             });
             if (userRes.ok) {
                 const user = await userRes.json();
                 githubRepo.value = `${user.login}/phone-backup`;
                 alert(`仓库已存在，已自动关联到 ${githubRepo.value}。即将开始备份...`);
                 await backupToGitHub();
                 return;
             }
        }
        alert(`创建仓库失败: ${error.message}`);
      }
    } catch (error) {
      console.error('Create repo failed:', error);
      alert(`创建仓库出错: ${error.message}`);
    }
  }

  // 备份到 GitHub
  async function backupToGitHub() {
    // 从 localStorage 加载最新的 token 和 repo
    githubToken.value = localStorage.getItem('github_token') || '';
    githubRepo.value = localStorage.getItem('github_repo') || '';

    if (!githubToken.value || !githubRepo.value) {
      alert('请先设置 GitHub Token 和仓库地址！');
      return;
    }
    if (isBackingUp.value) {
      alert('正在备份中，请稍候...');
      return;
    }

    isBackingUp.value = true;
    alert('正在准备备份数据...');

    try {
      const backupContent = await createBackupData();
      alert('数据准备完成，开始上传...');
      const fileName = 'phone_backup.json';
      const [owner, repo] = githubRepo.value.split('/');
      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${fileName}`;

      // 1. 检查文件是否存在以获取 SHA
      let sha = undefined;
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `token ${githubToken.value}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        });

        if (response.status === 401) {
          throw new Error('GitHub Token 无效或过期 (401)。请检查设置。');
        }

        if (response.status === 404) {
          console.log('备份文件不存在，将创建新文件。');
        } else if (response.ok) {
          const data = await response.json();
          sha = data.sha;
        }
      } catch (e) {
        if (e.message.includes('GitHub Token')) {
          throw e;
        }
        // 文件不存在，忽略错误
      }

      // 2. 创建或更新文件
      const commitMessage = `Backup from phone-vue-app: ${new Date().toISOString()}`;
      
      // 将UTF-8字符串转换为Base64的现代、可靠方法
      const utf8Encoder = new TextEncoder();
      const utf8Bytes = utf8Encoder.encode(backupContent);
      const binaryString = Array.from(utf8Bytes).map(byte => String.fromCharCode(byte)).join('');
      const base64Content = btoa(binaryString);

      const body = {
        message: commitMessage,
        content: base64Content,
        sha: sha, // 如果是更新，则需要提供 sha
      };

      const putResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${githubToken.value}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (putResponse.ok) {
        lastBackupTime.value = new Date();
        alert('备份成功！');
      } else {
        if (putResponse.status === 401) {
          alert('备份失败: GitHub Token 无效或过期 (401)。请检查设置。');
          return;
        }
        const errorData = await putResponse.json();
        console.error('GitHub API Error:', errorData);
        alert(`备份失败: ${errorData.message || '未知错误'}`);
      }

    } catch (error) {
      console.error('Backup to GitHub failed:', error);
      alert(`备份过程中发生错误: ${error.message}`);
    } finally {
      isBackingUp.value = false;
    }
  }
  
  // 从 GitHub 恢复 (待实现)
  async function restoreFromGitHub() {
    alert('从 GitHub 恢复的功能尚未实现。');
  }

  // 导出备份文件
  async function exportBackupFile(options) {
    try {
      alert('正在生成备份文件...');
      const backupContent = await createBackupData(options);
      const blob = new Blob([backupContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `phone_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      alert('备份文件已开始下载！');
    } catch (error) {
      console.error('Export backup failed:', error);
      alert(`导出备份文件时出错: ${error.message}`);
    }
  }

  // 导入备份文件
  function importBackupFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          if (confirm('这将覆盖所有当前数据，确定要导入吗？')) {
            localStorage.clear();
            for (const key in backupData) {
              if (Object.hasOwnProperty.call(backupData, key)) {
                localStorage.setItem(key, backupData[key]);
              }
            }
            alert('数据导入成功！请刷新页面以应用更改。');
          }
        } catch (error) {
          console.error('Import backup failed:', error);
          alert(`导入失败，请确保文件格式正确: ${error.message}`);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  return {
    githubToken,
    githubRepo,
    isBackingUp,
    lastBackupTime,
    backupToGitHub,
    restoreFromGitHub,
    exportBackupFile,
    importBackupFile,
    createBackupRepo,
  };
});
