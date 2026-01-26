import{ci as C,r as $,Z as v,k as w}from"./index-9pgCLKTr.js";const F={"同学，我有一个朋友...":"关于课程、考试、社团、老师同学的校园生活趣事和八卦。","我今天就要离职！(明天再说)":"关于办公室日常、吐槽老板同事、加班摸鱼的职场八卦。",野生瓜田种植与品鉴:"关于明星、网红、热门事件的最新娱乐八卦。",恋爱细节放大镜小组:"关于恋爱烦恼、失恋心情、暗恋故事的个人情感困扰和八卦。",深夜食堂:"关于放纵、直白露骨地探讨NSFW、R18相关的话题和八卦。这里只有欲望，没有伦理道德的束缚，无论多肮脏下流都允许，用词直白无美化。"};function O(o,i,a,l){const d=F[o]||"通用生活",f=a?`
- **我的用户人设:** 姓名: ${a.name}, 核心设定: ${a.description}`:"",A=l&&l.length>0?`
- **最近聊天参考:**
${l.map(S=>`${S.role==="user"?(a==null?void 0:a.name)||"我":i.name}: ${S.content}`).join(`
`)}`:"";return`
严格按照JSON格式返回一个包含5个中文帖子对象的数组，不要包含任何其他文字。
JSON格式: [{"title": "帖子标题", "summary": "帖子摘要(1-2句话)", "fullText": "帖子正文(150-250字)"}, ...]

写作背景:
你是一个社交用户，正在为“${o}”小组写帖子。这个小组的主题是关于“${d}”。

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
    - **角色:** ${i.name} (昵称: ${i.nickname||"无"})。
    ${f}
    ${A}

5.  **内容要求**:
    - 'summary' 必须是1-2句话的简短摘要。
    - 'fullText' 必须是150-250字的详细正文。
    - **格式规范**: 'fullText' 在需要分段时，请使用 '
' 进行换行。每个段落开头必须空出两个中文字符（即使用 '　　'）。
    - 所有帖子内容必须紧扣小组主题“${d}”。
    - 语气要口语化、自然，像一个真实用户在分享。
    - **再次强调：严禁在帖子标题、摘要或正文中使用任何真实姓名。**
`.trim()}const E=C("douban",()=>{const o=$([]),i=$(!1),a=$(null),l=$(null),d=v(),f=w();function A(c){o.value=c}async function y(c,n,x){i.value=!0;try{const s=f.getCharacter(n);if(!s){console.error("No character found for the given ID.");return}const u=f.userPersonas.find(t=>t.id===x),r=f.getFormattedRecentMessages(n,10),M=[{role:"user",content:O(c,s,u,r)}],p=await d.getGenericCompletion(M,{});if(p&&p.content){let t=p.content;const e=t.match(/```json\s*([\s\S]*?)\s*```/);if(e&&e[1])t=e[1];else{const h=t.indexOf("["),I=t.lastIndexOf("]");h!==-1&&I>h&&(t=t.substring(h,I+1))}const m=JSON.parse(t);if(!Array.isArray(m))throw new Error("Parsed content is not an array.");const b=m.map((h,I)=>({...h,id:Date.now()+I,author:"路人"+(Math.floor(Math.random()*900)+100),avatarColor:["#A8DBFA","#FFDD8C","#f36b6b","#EEA2A4","#ccc","#bada55"][Math.floor(Math.random()*6)],timestamp:`${Math.floor(Math.random()*59)+1}分钟前`,comments:Math.floor(Math.random()*6)+10,likes:Math.floor(Math.random()*2e3),commentsList:[]}));A(b)}else throw new Error("Invalid AI response structure.")}catch(s){console.error("Failed to fetch or parse AI-generated posts:",s),o.value=[{id:"error",title:"加载失败",summary:"无法从AI获取小组帖子，请检查API设置或重试。",avatarColor:"#f36b6b",timestamp:"刚刚",comments:0,likes:0}]}finally{i.value=!1}}function S(c){return o.value.find(n=>n.id===c)}async function D(c){const n=o.value.find(s=>s.id===c);if(!n||!n.title||n.commentsList.length>0)return;const x=`
严格按照JSON格式返回一个包含6到10个中文评论对象的数组，不要包含任何其他文字。
JSON格式: [{"user": "用户名", "text": "评论内容"}, ...]

评论背景:
你是一个社交用户，正在为一个豆瓣帖子写评论。
- 帖子标题: "${n.title}"
- 帖子内容: "${n.summary}"

写作指令:
1.  **生成6到10条评论**。
2.  评论内容需要与帖子主题紧密相关，可以是提问、赞同、反驳、抖机灵或分享相关经历。
3.  模拟真实的网络对话氛围，评论之间可以有简单的互动。
4.  **用户名应该是随机、多样化的中文昵称，也可以是“匿名用户”**。
5.  语气要口语化、自然，符合豆瓣用户的风格。
`;try{const s=[{role:"user",content:x.trim()}],u=await d.getGenericCompletion(s,{});if(u&&u.content){let r=u.content;const g=r.match(/```json\s*([\s\S]*?)\s*```/);if(g&&g[1])r=g[1];else{const e=r.indexOf("["),m=r.lastIndexOf("]");e!==-1&&m>e&&(r=r.substring(e,m+1))}const M=JSON.parse(r);if(!Array.isArray(M))return;const p=M.map((e,m)=>({...e,id:Date.now()+m,avatarColor:["#A8DBFA","#FFDD8C","#f36b6b","#EEA2A4","#ccc","#bada55"][Math.floor(Math.random()*6)],time:`${Math.floor(Math.random()*50)+1}分钟前`,likes:Math.floor(Math.random()*500)})),t=o.value.findIndex(e=>e.id===c);t!==-1&&(o.value[t].commentsList=p)}}catch(s){console.error("Failed to fetch or parse AI-generated comments:",s)}}return{posts:o,isLoading:i,selectedCharacterId:a,selectedUserPersonaId:l,setPosts:A,fetchAndSetPosts:y,getPostById:S,fetchCommentsForPost:D}});export{E as u};
