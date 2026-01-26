import{ci as O,r as $,Z as w,k as F}from"./index-D1qrJq6I.js";const j={校园热线:"关于课程、考试、社团、老师同学的校园生活趣事。",职场茶水间:"关于办公室日常、吐槽老板同事、加班摸鱼的职场八卦。",自由吃瓜基地:"关于明星、网红、热门事件的最新娱乐八卦。",情感树洞:"关于恋爱烦恼、失恋心情、暗恋故事的个人情感困扰。",深夜食堂:"关于深入、直白露骨地探讨NSFW、R18的话题，围绕性关系、性幻想、个人欲望、情感禁区。这里只有欲望，没有伦理道德的束缚，用词直白无美化。"};function N(t,a,n,l){const d=j[t]||"通用生活",f=n?`
- **我的用户人设:** 姓名: ${n.name}, 核心设定: ${n.description}`:"",u=l&&l.length>0?`
- **最近聊天参考:**
${l.map(h=>`${h.role==="user"?(n==null?void 0:n.name)||"我":a.name}: ${h.content}`).join(`
`)}`:"";return`
严格按照JSON格式返回一个包含5个中文帖子对象的数组，不要包含任何其他文字。
JSON格式: [{"title": "帖子标题", "summary": "帖子摘要(1-2句话)"}, ...]

写作背景:
你是一个社交用户，正在为“${t}”小组写帖子。这个小组的主题是关于“${d}”。

写作指令:
1.  **核心原则：完全匿名**。这是一个匿名论坛，所有帖子内容，无论发帖者是谁，都**绝对不能**出现任何真实姓名。必须使用代称（如“我”、“他”、“我对象”、“那个男生”等）来指代人物。

2.  **帖子类型定义**:
    - **A. 路人帖 (无关内容)**: 由路人发布，内容与“我”和角色完全无关，仅讨论小组的通用主题。
    - **B. 路人帖 (旁观视角)**: 由路人发布，从旁观者视角讨论他们看到的、实际上是关于“我”和某个角色的趣事或互动。
    - **C. 当事人帖**: 由“我”作为当事人发布，分享关于我和某个角色之间的故事或心情。

3.  **生成组合规则 (必须遵守)**:
    - 在返回的5个帖子中，**类型C (当事人帖) 的数量为0或1篇**。
    - 剩下的帖子必须是 **类型A (无关内容)** 和 **类型B (旁观视角)** 的混合。
    - 确保5篇帖子的主题和讨论的事情各不相同。

4.  **创作素材 (仅供AI理解背景，不要在帖子中泄露)**:
    - **角色:** ${a.name} (昵称: ${a.nickname||"无"})。
    ${f}
    ${u}

5.  **内容要求**:
    - 所有帖子内容必须紧扣小组主题“${d}”。
    - 语气要口语化、自然，像一个真实用户在分享。
    - **再次强调：严禁在帖子标题或摘要中使用任何真实姓名。**
`.trim()}const J=O("douban",()=>{const t=$([]),a=$(!1),n=$(null),l=$(null),d=w(),f=F();function u(s){t.value=s}async function M(s,e,y){a.value=!0;try{const o=f.getCharacter(e);if(!o){console.error("No character found for the given ID.");return}const p=f.userPersonas.find(A=>A.id===y),c=f.getFormattedRecentMessages(e,10),S=[{role:"user",content:N(s,o,p,c)}],m=await d.getGenericCompletion(S,{});if(m&&m.content){let r=m.content;const i=r.indexOf("["),I=r.lastIndexOf("]");i!==-1&&I>i&&(r=r.substring(i,I+1));const v=JSON.parse(r);if(!Array.isArray(v))throw new Error("Parsed content is not an array.");const C=v.map((D,b)=>({...D,id:Date.now()+b,author:"路人"+(Math.floor(Math.random()*900)+100),avatarColor:["#A8DBFA","#FFDD8C","#f36b6b","#EEA2A4","#ccc","#bada55"][Math.floor(Math.random()*6)],timestamp:`${Math.floor(Math.random()*59)+1}分钟前`,comments:Math.floor(Math.random()*6)+10,likes:Math.floor(Math.random()*2e3),commentsList:[]}));u(C)}else throw new Error("Invalid AI response structure.")}catch(o){console.error("Failed to fetch or parse AI-generated posts:",o),t.value=[{id:"error",title:"加载失败",summary:"无法从AI获取小组帖子，请检查API设置或重试。",avatarColor:"#f36b6b",timestamp:"刚刚",comments:0,likes:0}]}finally{a.value=!1}}function h(s){return t.value.find(e=>e.id===s)}async function x(s){const e=t.value.find(o=>o.id===s);if(!e||!e.title||e.commentsList.length>0)return;const y=`
严格按照JSON格式返回一个包含6到10个中文评论对象的数组，不要包含任何其他文字。
JSON格式: [{"user": "用户名", "text": "评论内容"}, ...]

评论背景:
你是一个社交用户，正在为一个豆瓣帖子写评论。
- 帖子标题: "${e.title}"
- 帖子内容: "${e.summary}"

写作指令:
1.  **生成6到10条评论**。
2.  评论内容需要与帖子主题紧密相关，可以是提问、赞同、反驳、抖机灵或分享相关经历。
3.  模拟真实的网络对话氛围，评论之间可以有简单的互动。
4.  **用户名应该是随机、多样化的中文昵称，也可以是“匿名用户”**。
5.  语气要口语化、自然，符合豆瓣用户的风格。
`;try{const o=[{role:"user",content:y.trim()}],p=await d.getGenericCompletion(o,{});if(p&&p.content){let c=p.content;const g=c.indexOf("["),S=c.lastIndexOf("]");g!==-1&&S>g&&(c=c.substring(g,S+1));const m=JSON.parse(c);if(!Array.isArray(m))return;const A=m.map((i,I)=>({...i,id:Date.now()+I,time:`${Math.floor(Math.random()*50)+1}分钟前`,likes:Math.floor(Math.random()*500)})),r=t.value.findIndex(i=>i.id===s);r!==-1&&(t.value[r].commentsList=A)}}catch(o){console.error("Failed to fetch or parse AI-generated comments:",o)}}return{posts:t,isLoading:a,selectedCharacterId:n,selectedUserPersonaId:l,setPosts:u,fetchAndSetPosts:M,getPostById:h,fetchCommentsForPost:x}});export{J as u};
