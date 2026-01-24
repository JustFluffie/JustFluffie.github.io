import { defineStore } from 'pinia';
import { useApiStore } from '@/stores/apiStore';
import { useSingleStore } from '@/stores/chat/singleStore';

// Helper function to extract JSON from AI response
function extractJson(text) {
  const match = text.match(/```json\n([\s\S]*?)\n```/);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      console.error('Failed to parse JSON from AI response:', e);
      return null;
    }
  }
  console.error('No JSON block found in AI response.');
  return null;
}

export const useMemoStore = defineStore('memo', {
  state: () => ({
    memos: {}, // { charId: [memo] }
    isLoading: false,
  }),
  
  actions: {
    // --- Private Helper for API calls ---
    async _updateMemosViaApi(charId, instruction) {
      this.isLoading = true;
      const apiStore = useApiStore();
      const singleStore = useSingleStore();
      const character = singleStore.getCharacter(charId);

      if (!character) {
        console.error("Character not found for memo operation");
        this.isLoading = false;
        return;
      }

      const currentMemos = this.memos[charId] || [];
      const prompt = `
你是角色 ${character.name} 的备忘录管理助手。
你的任务是管理一个备忘录列表。当前的备忘录列表如下:
${JSON.stringify(currentMemos, null, 2)}

用户希望执行以下操作: "${instruction}"。

请在一个JSON代码块中，返回**完整的、更新后的**备忘录列表。
JSON应该是一个对象数组，每个对象包含 "id"、"content" 和 "timestamp" 字段。
返回示例格式:
\`\`\`json
[
  { "id": "1678886400000", "content": "买牛奶", "timestamp": 1678886400000 },
  { "id": "1678886400001", "content": "打电话给妈妈", "timestamp": 1678886400001 }
]
\`\`\`
`;

      try {
        const response = await apiStore.getGenericCompletion([{ role: 'system', content: prompt.trim() }]);
        if (response && response.content) {
          const updatedMemos = extractJson(response.content);
          if (updatedMemos) {
            this.memos[charId] = updatedMemos;
          } else {
            // Handle cases where JSON extraction fails
            console.error("Could not update memos due to invalid API response.");
          }
        }
      } catch (error) {
        console.error('Error updating memos via API:', error);
      } finally {
        this.isLoading = false;
      }
    },

    // --- Public Actions ---
    async fetchMemos(charId) {
      await this._updateMemosViaApi(charId, "列出所有当前的备忘录。");
    },

    async addMemo(charId, content) {
      const newMemo = {
        id: Date.now().toString(),
        content: content,
        timestamp: Date.now()
      };
      await this._updateMemosViaApi(charId, `添加以下新备忘录: ${JSON.stringify(newMemo)}`);
    },

    async deleteMemo(charId, memoId) {
      await this._updateMemosViaApi(charId, `删除ID为 "${memoId}" 的备忘录。`);
    },

    async updateMemo(charId, memoId, newContent) {
      await this._updateMemosViaApi(charId, `将ID为 "${memoId}" 的备忘录内容更新为: "${newContent}"。`);
    },

    async clearMemos(charId) {
      await this._updateMemosViaApi(charId, "删除所有备忘录并返回一个空列表。");
    },

    // --- Getters (Sync) ---
    getMemos(charId) {
      return this.memos[charId] || [];
    },
  }
});
