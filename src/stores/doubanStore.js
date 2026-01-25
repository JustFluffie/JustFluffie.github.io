import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useApiStore } from '@/stores/apiStore';
import { useSingleStore } from '@/stores/chat/singleStore';

const groupThemeDescriptions = {
  '校园热线': '关于课程、考试、社团、老师同学的校园生活趣事。',
  '职场茶水间': '关于办公室日常、吐槽老板同事、加班摸鱼的职场八卦。',
  '自由吃瓜基地': '关于明星、网红、热门事件的最新娱乐八卦。',
  '情感树洞': '关于恋爱烦恼、失恋心情、暗恋故事的个人情感困扰。',
  '深夜食堂': '关于深入、坦诚地探讨两性关系、性幻想、个人欲望、情感禁区，以及其他在日常生活中不便公开的成熟话题。',
};

function buildDoubanPostPrompt(groupName, character, userPersona, recentMessages) {
  const themeDescription = groupThemeDescriptions[groupName] || '通用生活';
  
  const personaDesc = userPersona ? `
- **我的用户人设:** 姓名: ${userPersona.name}, 核心设定: ${userPersona.description}` : '';

  const messagesDesc = recentMessages && recentMessages.length > 0 ? `
- **最近聊天参考:**
${recentMessages.map(m => `${m.role === 'user' ? userPersona?.name || '我' : character.name}: ${m.content}`).join('\n')}` : '';

  const prompt = `
严格按照JSON格式返回一个包含3个中文帖子对象的数组，不要包含任何其他文字。
JSON格式: [{"title": "帖子标题", "summary": "帖子摘要(1-2句话)"}, ...]

写作背景:
你是一个社交用户，正在为“${groupName}”小组写帖子。这个小组的主题是关于“${themeDescription}”。

写作指令:
1.  **必须**结合以下背景信息进行创作，让帖子内容更真实、更贴近生活：
    - **与我互动的角色:** ${character.name} (昵称: ${character.nickname || '无'})。
    ${personaDesc}
    ${messagesDesc}
2.  帖子内容必须紧扣小组主题。
3.  **必须包含至少一个**关于“我”和角色“${character.name}”之间的故事或心情。
4.  语气要口语化，像一个真实用户在分享。
`;
  return prompt.trim();
}

export const useDoubanStore = defineStore('douban', () => {
  const posts = ref([]);
  const isLoading = ref(false);
  const apiStore = useApiStore();
  const singleStore = useSingleStore();

  function setPosts(newPosts) {
    posts.value = newPosts;
  }

  async function fetchAndSetPosts(groupName, characterId, userPersonaId) {
    isLoading.value = true;
    posts.value = [];
    try {
      const character = singleStore.getCharacter(characterId);
      if (!character) {
        console.error("No character found for the given ID.");
        return;
      }

      const userPersona = singleStore.userPersonas.find(p => p.id === userPersonaId);
      const recentMessages = singleStore.getFormattedRecentMessages(characterId, 10);

      const prompt = buildDoubanPostPrompt(groupName, character, userPersona, recentMessages);
      const messages = [{ role: 'user', content: prompt }];

      const response = await apiStore.getGenericCompletion(messages, {});
      if (response && response.choices && response.choices[0]) {
        const content = response.choices[0].message.content;
        
        let jsonString = content;
        const jsonStartIndex = jsonString.indexOf('[');
        const jsonEndIndex = jsonString.lastIndexOf(']');

        if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          jsonString = jsonString.substring(jsonStartIndex, jsonEndIndex + 1);
        }
        
        const parsedPosts = JSON.parse(jsonString);

        if (!Array.isArray(parsedPosts)) {
          throw new Error("Parsed content is not an array.");
        }
        
        const formattedPosts = parsedPosts.map((post, index) => ({
          ...post,
          id: Date.now() + index,
          avatarColor: ['#A8DBFA', '#FFDD8C', '#f36b6b', '#EEA2A4', '#ccc', '#bada55'][Math.floor(Math.random() * 6)],
          timestamp: `${Math.floor(Math.random() * 59) + 1}分钟前`,
          comments: Math.floor(Math.random() * 500),
          likes: Math.floor(Math.random() * 2000),
        }));
        setPosts(formattedPosts);
      } else {
        throw new Error("Invalid AI response structure.");
      }
    } catch (error) {
      console.error("Failed to fetch or parse AI-generated posts:", error);
      posts.value = [{
        id: 'error',
        title: '加载失败',
        summary: '无法从AI获取小组帖子，请检查API设置或重试。',
        avatarColor: '#f36b6b',
        timestamp: '刚刚',
        comments: 0,
        likes: 0,
      }];
    } finally {
      isLoading.value = false;
    }
  }

  function getPostById(postId) {
    return posts.value.find(p => p.id === postId);
  }

  return { posts, isLoading, setPosts, fetchAndSetPosts, getPostById };
});
