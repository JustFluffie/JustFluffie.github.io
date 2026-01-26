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
1.  **帖子类型定义**:
    - **A. 路人帖 (无关内容)**: 由路人发布，内容与我和角色完全无关，仅讨论小组的通用主题。
    - **B. 路人帖 (旁观视角)**: 由路人发布，从旁观者视角讨论他们看到的、实际上是关于“我”和角色“${character.name}”的趣事或互动，但发帖者并不知道主角是谁。
    - **C. 当事人帖**: 由“我”或角色“${character.name}”发布，直接分享我们之间的故事或心情。

2.  **生成组合规则 (必须遵守)**:
    - 在返回的3个帖子中，**类型C (当事人帖) 的数量为0或1篇**。
    - 剩下的帖子必须是 **类型A (无关内容)** 和 **类型B (旁观视角)** 的混合。
    - 确保3篇帖子的主题和讨论的事情各不相同。

3.  **创作素材 (用于B类和C类帖子)**:
    - **角色:** ${character.name} (昵称: ${character.nickname || '无'})。
    ${personaDesc}
    ${messagesDesc}

4.  **内容要求**:
    - 所有帖子内容必须紧扣小组主题“${themeDescription}”。
    - 语气要口语化、自然，像一个真实用户在分享。
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
      if (response && response.content) {
        const content = response.content;
        
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
          author: '路人' + (Math.floor(Math.random() * 900) + 100),
          avatarColor: ['#A8DBFA', '#FFDD8C', '#f36b6b', '#EEA2A4', '#ccc', '#bada55'][Math.floor(Math.random() * 6)],
          timestamp: `${Math.floor(Math.random() * 59) + 1}分钟前`,
          comments: Math.floor(Math.random() * 6) + 10, // 生成 10-15 条评论
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

  async function fetchCommentsForPost(post) {
    if (!post || !post.title) return [];

    const prompt = `
严格按照JSON格式返回一个包含10到15个中文评论对象的数组，不要包含任何其他文字。
JSON格式: [{"user": "用户名", "text": "评论内容"}, ...]

评论背景:
你是一个社交用户，正在为一个豆瓣帖子写评论。
- 帖子标题: "${post.title}"
- 帖子内容: "${post.summary}"

写作指令:
1.  **生成10到15条评论**。
2.  评论内容需要与帖子主题紧密相关，可以是提问、赞同、反驳、抖机灵或分享相关经历。
3.  模拟真实的网络对话氛围，评论之间可以有简单的互动。
4.  **用户名应该是随机、多样化的中文昵称，也可以是“匿名用户”**。
5.  语气要口语化、自然，符合豆瓣用户的风格。
`;

    try {
      const messages = [{ role: 'user', content: prompt.trim() }];
      const response = await apiStore.getGenericCompletion(messages, {});
      if (response && response.content) {
        let jsonString = response.content;
        const jsonStartIndex = jsonString.indexOf('[');
        const jsonEndIndex = jsonString.lastIndexOf(']');
        if (jsonStartIndex !== -1 && jsonEndIndex > jsonStartIndex) {
          jsonString = jsonString.substring(jsonStartIndex, jsonEndIndex + 1);
        }
        
        const parsedComments = JSON.parse(jsonString);
        if (!Array.isArray(parsedComments)) return [];

        return parsedComments.map((comment, index) => ({
          ...comment,
          id: Date.now() + index,
          time: `${Math.floor(Math.random() * 50) + 1}分钟前`,
          likes: Math.floor(Math.random() * 500),
        }));
      }
      return [];
    } catch (error) {
      console.error("Failed to fetch or parse AI-generated comments:", error);
      return [];
    }
  }

  return { posts, isLoading, setPosts, fetchAndSetPosts, getPostById, fetchCommentsForPost };
});
