import { defineStore } from 'pinia';
import { useApiStore } from '../apiStore';
import { useSingleStore } from './singleStore';
import LZString from 'lz-string';

export const useMomentsStore = defineStore('moments', {
  state: () => ({
    moments: [], // 朋友圈动态
    userMomentsProfile: {
      name: '我',
      avatar: '', // 默认为空，显示灰色
      cover: '', // 默认为空，显示灰色
      signature: '点击设置个性签名'
    },
    unread: false, // 新增：未读消息角标
  }),

  actions: {
    initData() {
      const savedMoments = localStorage.getItem('aiPhoneMomentsData');
      // 兼容旧数据
      const oldChat = localStorage.getItem('aiPhoneChatData');
      
      if (savedMoments) {
        try {
          const decompressed = LZString.decompressFromUTF16(savedMoments);
          const data = decompressed ? JSON.parse(decompressed) : JSON.parse(savedMoments);
          
          this.moments = data.moments || [];
          this.userMomentsProfile = data.userMomentsProfile || {
            name: '我',
            avatar: '',
            cover: '',
            signature: '点击设置个性签名'
          };
          this.unread = data.unread || false;
        } catch (e) {
          console.error("Failed to parse moments data", e);
          this.moments = [];
          this.userMomentsProfile = {
            name: '我',
            avatar: '',
            cover: '',
            signature: '点击设置个性签名'
          };
          this.unread = false;
        }
      } else if (oldChat) {
        // 尝试从旧的 chatStore 数据中恢复朋友圈数据
        try {
          const decompressed = LZString.decompressFromUTF16(oldChat);
          const data = decompressed ? JSON.parse(decompressed) : JSON.parse(oldChat);
          
          if (data.moments || data.userMomentsProfile) {
              this.moments = data.moments || [];
              this.userMomentsProfile = data.userMomentsProfile || {
                name: '我',
                avatar: '',
                cover: '',
                signature: '点击设置个性签名'
              };
              // 保存到新位置
              this.saveData();
          }
        } catch (e) {
          console.error("Failed to migrate moments data from old chat store", e);
        }
      }
    },

    saveData() {
      const data = {
        moments: this.moments,
        userMomentsProfile: this.userMomentsProfile,
        unread: this.unread
      };
      try {
        const jsonString = JSON.stringify(data);
        const compressed = LZString.compressToUTF16(jsonString);
        localStorage.setItem('aiPhoneMomentsData', compressed);
      } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.error('LocalStorage quota exceeded!', e);
            alert('存储空间已满！无法保存朋友圈数据。请尝试删除一些包含大量图片的内容。');
        } else {
            console.error('Error saving moments data', e);
        }
      }
    },

    // 新增：设置朋友圈为已读
    setMomentsRead() {
      if (this.unread) {
        this.unread = false;
        this.saveData();
      }
    },

    // --- 朋友圈 Actions ---
    addMoment(moment) {
        // 允许角色发布纯图片动态（只要是文字生图）
        const newMoment = {
            id: Date.now().toString(),
            likes: [],
            comments: [],
            ...moment
        };
        this.moments.unshift(newMoment);

        // 处理用户发布动态后的角色反应
        if (newMoment.userId === 'user') {
            this.processUserMomentReactions(newMoment);
        }

        this.saveData();
        return newMoment.id;
    },

    // 新增：统一处理用户动态的角色反应逻辑
    processUserMomentReactions(moment) {
        const singleStore = useSingleStore();
        const allCharacters = singleStore.characters.filter(c => c.id !== 'user');
        const userName = this.userMomentsProfile.name || '我';

        allCharacters.forEach(character => {
            const charId = character.id;
            let shouldReact = false;
            let reactionType = 'public'; // 'mentioned' | 'exclusive' | 'public'
            let delay = Math.random() * 10000 + 2000; // 基础延迟 2-12秒

            // 1. 提醒谁看 (最高优先级)
            if (moment.remind && moment.remind.includes(charId)) {
                shouldReact = true;
                reactionType = 'mentioned';
                delay = Math.random() * 5000 + 1000; // 提到了，反应快一点
                
                // 发送系统通知
                if (singleStore.sendSystemNotification) {
                    singleStore.sendSystemNotification(charId, `${userName}发布了一条朋友圈提到了你`);
                }
            } 
            // 2. 部分可见 (中等优先级)
            else if (moment.visibility && moment.visibility.type === 'private') {
                if (moment.visibility.allowed && moment.visibility.allowed.includes(charId)) {
                    // 在可见列表中
                    shouldReact = Math.random() < 0.8; // 80% 概率互动
                    // 用户反馈：部分可见时，提示词和公开一样，不让AI知道是部分可见
                    reactionType = 'public'; 
                } else {
                    // 不在可见列表中，看不见，不互动
                    shouldReact = false;
                }
            }
            // 3. 公开/未选择 (低优先级/随缘)
            else {
                // 随缘互动
                shouldReact = Math.random() < 0.6; // 60% 概率互动
                reactionType = 'public';
            }

            if (shouldReact) {
                setTimeout(() => {
                    this.triggerMomentReaction(charId, moment, reactionType);
                }, delay);
            }
        });
    },

    async triggerMomentReaction(charId, moment, reactionType = 'public') {
        const apiStore = useApiStore();
        const singleStore = useSingleStore();
        
        // 获取角色信息
        const character = singleStore.getCharacter ? singleStore.getCharacter(charId) : null;
        if (!character) return;

        const userName = this.userMomentsProfile.name || '我';
        let contextDesc = "";
        
        switch (reactionType) {
            case 'mentioned':
                contextDesc = `你的好友“${userName}”刚刚发布了一条朋友圈并**特别提到了你**`;
                break;
            case 'public':
            default:
                contextDesc = `你的好友“${userName}”刚刚发布了一条朋友圈`;
                break;
        }

        const contentDisplay = moment.content || (moment.images && moment.images.length > 0 ? "[分享了图片]" : "[分享了内容]");

        const prompt = `你正在扮演角色“${character.name}”。${contextDesc}，内容如下：\n“${contentDisplay}”\n\n现在请你根据你的角色性格，从以下三个选项中选择一个进行回应：\n1. 在聊天中私下回复他/她。\n2. 只给这条动态点赞。\n3. 点赞并评论这条动态。\n\n你的任务是返回一个JSON对象来指明你的选择。请严格遵循以下格式，不要添加任何额外的解释：\n- 如果选择聊天，返回: {"action": "chat", "response": "你想在聊天里说的话"}\n- 如果选择只点赞，返回: {"action": "like"}\n- 如果选择点赞并评论，返回: {"action": "comment", "response": "你的评论内容"}`;

        const messages = [
            { role: 'system', content: `你正在进行角色扮演。你的身份是“${character.name}”。请根据你的人设和当前情境，以指定的JSON格式做出回应。你的性格设定是：${character.charPersona || '友好、乐于助人'}` },
            { role: 'user', content: prompt }
        ];

        try {
            const result = await apiStore.getGenericCompletion(messages);
            if (!result) return;

            // 提取被 ```json ... ``` 包裹的内容
            const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/);
            const jsonString = jsonMatch ? jsonMatch[1] : result;

            const reaction = JSON.parse(jsonString);

            // 如果是用户发的动态被响应，则标记为未读
            if (moment.userId === 'user') {
                this.unread = true;
            }
            
            switch (reaction.action) {
                case 'chat':
                    if (singleStore.receiveMessage) {
                        singleStore.receiveMessage(charId, reaction.response);
                    }
                    break;
                case 'like':
                    this.likeMoment(moment.id, charId);
                    break;
                case 'comment':
                    this.likeMoment(moment.id, charId); // 评论时自动点赞
                    this.addComment(moment.id, {
                        userId: charId,
                        content: reaction.response,
                        time: Date.now(),
                    });
                    break;
            }
            this.saveData();
        } catch (error) {
            console.error(`为 ${character.name} 生成动态回应失败:`, error);
        }
    },

    addComment(momentId, comment) {
        const moment = this.moments.find(m => m.id === momentId);
        if (moment) {
            const newComment = {
                id: Date.now().toString(),
                replyTo: null, // 回复给谁 {id, name}
                ...comment
            };
            moment.comments.push(newComment);

            // 如果是别人评论/回复我的动态/评论，则标记为未读
            if (comment.userId !== 'user') {
                // 评论我的动态，或者回复我的评论
                if (moment.userId === 'user' || (newComment.replyTo && newComment.replyTo.id === 'user')) {
                    this.unread = true;
                }
            }

            this.saveData();

            // 触发 AI 反应
            if (comment.userId === 'user') {
                this.handleCommentReaction(moment, newComment);
            }
        }
    },

    deleteComment(momentId, commentId) {
        const moment = this.moments.find(m => m.id === momentId);
        if (moment) {
            const index = moment.comments.findIndex(c => c.id === commentId);
            if (index !== -1) {
                moment.comments.splice(index, 1);
                this.saveData();
            }
        }
    },

    async handleCommentReaction(moment, userComment) {
        let targetCharId = null;
        let context = '';

        // 情况 1: 回复了某个角色的评论
        if (userComment.replyTo && userComment.replyTo.id !== 'user') {
            targetCharId = userComment.replyTo.id;
            context = `用户在你的动态（或你参与评论的动态）下回复了你。动态内容是：“${moment.content}”。用户的回复是：“${userComment.content}”。`;
        } 
        // 情况 2: 直接评论了角色的动态
        else if (!userComment.replyTo && moment.userId !== 'user') {
            targetCharId = moment.userId;
            context = `用户评论了你的动态：“${moment.content}”。用户的评论是：“${userComment.content}”。`;
        }

        if (targetCharId) {
            this.triggerCommentReply(targetCharId, moment.id, userComment, context);
        }
    },

    async triggerCommentReply(charId, momentId, userComment, context) {
        const apiStore = useApiStore();
        const singleStore = useSingleStore();
        const character = singleStore.getCharacter ? singleStore.getCharacter(charId) : null;
        if (!character) return;

        // 延迟回复
        setTimeout(async () => {
            const prompt = `你正在扮演角色“${character.name}”。${context}\n\n请根据你的角色性格进行简短的回复（朋友圈评论风格）。\n请直接返回回复内容，不要包含任何解释或JSON格式。`;

            const messages = [
                { role: 'system', content: `你正在进行角色扮演。你的身份是“${character.name}”。你的性格设定是：${character.charPersona || '友好'}。请以角色口吻回复评论。` },
                { role: 'user', content: prompt }
            ];

            try {
                const replyContent = await apiStore.getGenericCompletion(messages);
                if (replyContent) {
                    const aiComment = {
                        userId: charId,
                        content: replyContent.replace(/^["']|["']$/g, '').trim(),
                        time: Date.now(),
                        replyTo: {
                            id: userComment.userId,
                            name: this.userMomentsProfile.name || '我' 
                        }
                    };
                    this.addComment(momentId, aiComment);
                }
            } catch (error) {
                console.error(`AI ${character.name} 回复评论失败:`, error);
            }
        }, 3000 + Math.random() * 2000);
    },

    likeMoment(momentId, userId) {
        const moment = this.moments.find(m => m.id === momentId);
        if (moment) {
            const index = moment.likes.indexOf(userId);
            if (index === -1) {
                moment.likes.push(userId);
                // 如果是别人点赞我的动态，则标记为未读
                if (userId !== 'user' && moment.userId === 'user') {
                    this.unread = true;
                }
            } else {
                moment.likes.splice(index, 1);
            }
            this.saveData();
        }
    },

    deleteMoment(momentId) {
        const index = this.moments.findIndex(m => m.id === momentId);
        if (index !== -1) {
            this.moments.splice(index, 1);
            this.saveData();
        }
    },

    updateMoment(momentId, updates) {
        const moment = this.moments.find(m => m.id === momentId);
        if (moment) {
            Object.assign(moment, updates);
            this.saveData();
        }
    },

    async retryMoment(momentId) {
        const momentIndex = this.moments.findIndex(m => m.id === momentId);
        if (momentIndex === -1) return false;

        const momentToRetry = this.moments[momentIndex];
        if (momentToRetry.userId === 'user') return false;

        const singleStore = useSingleStore();
        const apiStore = useApiStore();
        const character = singleStore.getCharacter ? singleStore.getCharacter(momentToRetry.userId) : null;
        
        if (!character) return false;

        const prompt = `请你扮演 ${character.name}，根据你的角色设定，重新发布一条朋友圈动态。之前的动态是：“${momentToRetry.content}”。请围绕相似的主题或心情，但用不同的方式来表达。请直接返回新的动态内容。`;
        const messages = [
            { role: 'system', content: character.charPersona || `你正在扮演 ${character.name}。` },
            { role: 'user', content: prompt }
        ];

        try {
            const newContent = await apiStore.getGenericCompletion(messages);
            if (newContent) {
                this.updateMoment(momentId, { 
                    content: newContent, 
                    time: Date.now() 
                });
                return true;
            }
        } catch (error) {
            console.error('重试动态失败:', error);
        }
        return false;
    },

    updateUserMomentsProfile(profile) {
        this.userMomentsProfile = { ...this.userMomentsProfile, ...profile };
        this.saveData();
    },

    async triggerRandomCharacterMoment() {
        const singleStore = useSingleStore();
        const characters = singleStore.characters.filter(c => c.id !== 'user' && !c.isAssistant);
        if (characters.length > 0) {
            const randomChar = characters[Math.floor(Math.random() * characters.length)];
            await this.triggerCharacterMoment(randomChar.id);
        }
    },

    // 主动发布朋友圈
    async triggerCharacterMoment(charId) {
        const apiStore = useApiStore();
        const singleStore = useSingleStore();
        const character = singleStore.getCharacter(charId);
        
        if (!character) return;

        const prompt = `你正在扮演角色“${character.name}”。现在，请你根据自己的角色设定，构思一条朋友圈动态，内容可以是你最近的经历、心情或一些有趣的想法。
        
        你可以选择以下三种形式之一：
        1. 纯文字动态。
        2. 文字 + 图片动态（图片必须是“文字生图”的形式，即提供一段画面描述）。
        3. 纯图片动态（仅提供画面描述）。

        请返回一个 JSON 对象，格式如下：
        {
            "text": "动态的文字内容（如果是纯图片动态，此项留空）",
            "imageDescription": "图片的详细画面描述（例如：'清晨的阳光洒在咖啡杯上，旁边放着一本书'。注意：这段文字将被直接用于生成图片，请描写具体的视觉画面，而不要写抽象的感觉。如果没有图片，此项留空）"
        }
        
        请严格返回 JSON 格式，不要包含其他解释。`;
        
        const messages = [
            { role: 'system', content: `你正在进行角色扮演。你的身份是“${character.name}”。请根据你的人设和生活状态，构思一条朋友圈动态，并返回 JSON 格式的结果。你的性格设定是：${character.charPersona || '友好、乐于助人'}` },
            { role: 'user', content: prompt }
        ];

        try {
            const result = await apiStore.getGenericCompletion(messages);
            if (result) {
                let momentData = { text: result, imageDescription: "" };
                try {
                    const jsonMatch = result.match(/```json\s*([\s\S]*?)\s*```/) || result.match(/\{[\s\S]*\}/);
                    const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : result;
                    momentData = JSON.parse(jsonString);
                } catch (e) {
                    console.warn("Failed to parse moment JSON, using raw text", e);
                    momentData = { text: result, imageDescription: "" };
                }

                const images = [];
                if (momentData.imageDescription) {
                    images.push({
                        content: momentData.imageDescription,
                        isTextGenerated: true
                    });
                }

                const content = momentData.text || "";
                
                if (!content && images.length === 0) return;

                this.addMoment({
                    userId: charId,
                    content: content,
                    images: images,
                    time: Date.now(),
                });

                // 更新发布状态
                singleStore.updateMomentStatus(charId);
            }
        } catch (error) {
            console.error(`为 ${character.name} 生成动态失败:`, error);
        }
    },

    // 检查并互动朋友圈 (点赞/评论/回复)
    async checkAndInteractWithMoments(charId) {
        const singleStore = useSingleStore();
        const character = singleStore.getCharacter(charId);
        if (!character) return;

        const now = Date.now();
        const threeDays = 3 * 24 * 60 * 60 * 1000;

        // 1. 遍历朋友圈，寻找互动机会
        for (const moment of this.moments) {
            // 跳过自己发的
            if (moment.userId === charId) {
                // 检查是否有人回复了我，且我还没回复
                // 逻辑：找到最后一条评论，如果是别人回复我，且我还没回复他 -> 回复
                // 简化逻辑：遍历评论，找到 replyTo.id === charId 的评论
                // 且该评论之后没有 charId 回复该用户的评论
                // 这是一个复杂的链条，简化为：
                // 找到所有回复给我的评论
                const repliesToMe = moment.comments.filter(c => c.replyTo && c.replyTo.id === charId);
                for (const reply of repliesToMe) {
                    // 检查我是否已经回复了这个评论（即是否存在一条评论，userId是我，replyTo是这个人，且时间在reply之后）
                    const myReply = moment.comments.find(c => 
                        c.userId === charId && 
                        c.replyTo && c.replyTo.id === reply.userId && 
                        c.time > reply.time
                    );
                    
                    if (!myReply) {
                        // 还没回复，检查是否需要回复
                        // 规则：NPC/角色互动一轮结束。
                        // 如果 reply.userId 是用户 -> 可以回复
                        // 如果 reply.userId 是 NPC/角色 -> 检查是否已经是第二轮
                        // 这里我们假设 reply 是第一轮互动（别人评论我），那么我回复就是第二轮。
                        // 如果 reply 本身就是回复（比如我评论他，他回复我），那么 replyTo.id === charId。
                        // 此时我再回复，就是第三轮了。
                        // 所以：如果 reply 是对我的动态的直接评论（replyTo 为空或 replyTo 是动态作者），那我回复是第一轮回应。
                        // 但这里 replyTo.id === charId，说明 reply 是回复我的。
                        // 如果我是动态作者，那 reply 可能是直接评论。
                        // 如果我不是动态作者（我在别人动态下评论，别人回复我），那 reply 是回复。
                        
                        // 简化规则：
                        // 如果对方是用户 -> 总是回复。
                        // 如果对方是 NPC/角色 -> 
                        //    如果这是他对我的动态的直接评论 -> 回复。
                        //    如果这是他对我的评论的回复 -> 不回复（一轮结束）。
                        
                        const isUser = reply.userId === 'user';
                        const isDirectComment = !reply.replyTo || (reply.replyTo.id === moment.userId && moment.userId === charId);
                        
                        // 注意：repliesToMe 筛选出了 replyTo.id === charId，所以肯定是回复我的（或者是直接评论我的动态）
                        // 在 addComment 中，直接评论动态时 replyTo 是 null。
                        // 所以 repliesToMe 里的都是显式回复。
                        // 等等，addComment 中：
                        // if (userComment.replyTo) ...
                        // 只有显式点击回复按钮才会有 replyTo。
                        // 直接评论动态没有 replyTo。
                        
                        // 修正逻辑：
                        // 1. 检查直接评论（没有 replyTo，且 moment.userId === charId）
                        // 2. 检查显式回复（replyTo.id === charId）
                        
                        // 这里我们只处理显式回复。直接评论在下面处理。
                        if (isUser || isDirectComment) { // 这里的逻辑有点绕，暂且只处理用户无限制，NPC限制
                             // 如果是 NPC 回复了我（显式回复），说明我已经评论过他了，或者他评论过我然后我回复了他？
                             // 不，如果他回复我，说明上一条是我发的。
                             // A(我) -> B(他) -> A(我) ...
                             // 如果 B 回复 A，A 再回复 B，就是多轮了。
                             // 规则：NPC互动一轮。即 A评论B，B回复A，结束。
                             // 所以如果 B(他) 回复了 A(我)，A 就不应该再回复了。
                             if (isUser) {
                                 await this.triggerCommentReply(charId, moment.id, reply, `用户回复了你：“${reply.content}”`);
                             }
                        }
                    }
                }
                
                // 检查直接评论（没有 replyTo）
                const directComments = moment.comments.filter(c => !c.replyTo && c.userId !== charId);
                for (const comment of directComments) {
                    // 检查我是否回复了这个评论
                    const myReply = moment.comments.find(c => 
                        c.userId === charId && 
                        c.replyTo && c.replyTo.id === comment.userId && 
                        c.time > comment.time
                    );
                    
                    if (!myReply) {
                        // 还没回复
                        // 规则：如果是用户 -> 回复。
                        // 如果是 NPC -> 回复（这是第一轮：他评论，我回复）。
                        // 时间限制：如果是 NPC，且动态超过3天 -> 不回复？
                        // 用户说“无论是角色还是NPC只会对三天以内的朋友圈互动”。
                        // 如果动态超过3天，NPC 应该不会评论。如果评论了，说明是新评论（或者旧评论我没回）。
                        // 假设我们只处理新评论。
                        
                        const isUser = comment.userId === 'user';
                        const isRecent = (now - moment.time) < threeDays;
                        
                        if (isUser || isRecent) {
                             await this.triggerCommentReply(charId, moment.id, comment, `${comment.userId === 'user' ? '用户' : '朋友'}评论了你的动态：“${comment.content}”`);
                        }
                    }
                }
                
                continue; // 处理完自己的动态，继续下一个
            }

            // --- 处理别人的动态 ---
            
            // 1. 时间限制检查
            const isUserMoment = moment.userId === 'user';
            if (!isUserMoment && (now - moment.time > threeDays)) {
                continue; // NPC 动态超过 3 天，忽略
            }

            // 2. 互动检查 (点赞/评论)
            const hasLiked = moment.likes.includes(charId);
            const hasCommented = moment.comments.some(c => c.userId === charId);

            if (!hasLiked && !hasCommented) {
                // 还没互动过，随机决定
                if (Math.random() < 0.3) { // 30% 概率互动
                    await this.triggerMomentReaction(charId, moment, 'public');
                    return; // 每次检查只互动一次，避免刷屏
                }
            }
        }
    },
  }
});
