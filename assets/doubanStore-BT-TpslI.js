import{ci as v,r as I,Z as x,k as O}from"./index-DNoHf4Bg.js";const w={校园热线:"关于课程、考试、社团、老师同学的校园生活趣事。",职场茶水间:"关于办公室日常、吐槽老板同事、加班摸鱼的职场八卦。",自由吃瓜基地:"关于明星、网红、热门事件的最新娱乐八卦。",情感树洞:"关于恋爱烦恼、失恋心情、暗恋故事的个人情感困扰。",深夜食堂:"关于深入、坦诚地探讨两性关系、性幻想、个人欲望、情感禁区，以及其他在日常生活中不便公开的成熟话题。"};function j(n,e,o,s){const c=w[n]||"通用生活",h=o?`
- **我的用户人设:** 姓名: ${o.name}, 核心设定: ${o.description}`:"",g=s&&s.length>0?`
- **最近聊天参考:**
${s.map(t=>`${t.role==="user"?(o==null?void 0:o.name)||"我":e.name}: ${t.content}`).join(`
`)}`:"";return`
严格按照JSON格式返回一个包含3个中文帖子对象的数组，不要包含任何其他文字。
JSON格式: [{"title": "帖子标题", "summary": "帖子摘要(1-2句话)"}, ...]

写作背景:
你是一个社交用户，正在为“${n}”小组写帖子。这个小组的主题是关于“${c}”。

写作指令:
1.  **帖子类型定义**:
    - **A. 路人帖 (无关内容)**: 由路人发布，内容与我和角色完全无关，仅讨论小组的通用主题。
    - **B. 路人帖 (旁观视角)**: 由路人发布，从旁观者视角讨论他们看到的、实际上是关于“我”和角色“${e.name}”的趣事或互动，但发帖者并不知道主角是谁。
    - **C. 当事人帖**: 由“我”或角色“${e.name}”发布，直接分享我们之间的故事或心情。

2.  **生成组合规则 (必须遵守)**:
    - 在返回的3个帖子中，**类型C (当事人帖) 的数量为0或1篇**。
    - 剩下的帖子必须是 **类型A (无关内容)** 和 **类型B (旁观视角)** 的混合。
    - 确保3篇帖子的主题和讨论的事情各不相同。

3.  **创作素材 (用于B类和C类帖子)**:
    - **角色:** ${e.name} (昵称: ${e.nickname||"无"})。
    ${h}
    ${g}

4.  **内容要求**:
    - 所有帖子内容必须紧扣小组主题“${c}”。
    - 语气要口语化、自然，像一个真实用户在分享。
`.trim()}const E=v("douban",()=>{const n=I([]),e=I(!1),o=x(),s=O();function c(t){n.value=t}async function h(t,i,m){e.value=!0,n.value=[];try{const r=s.getCharacter(i);if(!r){console.error("No character found for the given ID.");return}const a=s.userPersonas.find(p=>p.id===m),l=s.getFormattedRecentMessages(i,10),u=[{role:"user",content:j(t,r,a,l)}],d=await o.getGenericCompletion(u,{});if(d&&d.content){let f=d.content;const $=f.indexOf("["),y=f.lastIndexOf("]");$!==-1&&y>$&&(f=f.substring($,y+1));const M=JSON.parse(f);if(!Array.isArray(M))throw new Error("Parsed content is not an array.");const D=M.map((b,C)=>({...b,id:Date.now()+C,author:"路人"+(Math.floor(Math.random()*900)+100),avatarColor:["#A8DBFA","#FFDD8C","#f36b6b","#EEA2A4","#ccc","#bada55"][Math.floor(Math.random()*6)],timestamp:`${Math.floor(Math.random()*59)+1}分钟前`,comments:Math.floor(Math.random()*6)+10,likes:Math.floor(Math.random()*2e3)}));c(D)}else throw new Error("Invalid AI response structure.")}catch(r){console.error("Failed to fetch or parse AI-generated posts:",r),n.value=[{id:"error",title:"加载失败",summary:"无法从AI获取小组帖子，请检查API设置或重试。",avatarColor:"#f36b6b",timestamp:"刚刚",comments:0,likes:0}]}finally{e.value=!1}}function g(t){return n.value.find(i=>i.id===t)}async function A(t){if(!t||!t.title)return[];const i=`
严格按照JSON格式返回一个包含10到15个中文评论对象的数组，不要包含任何其他文字。
JSON格式: [{"user": "用户名", "text": "评论内容"}, ...]

评论背景:
你是一个社交用户，正在为一个豆瓣帖子写评论。
- 帖子标题: "${t.title}"
- 帖子内容: "${t.summary}"

写作指令:
1.  **生成10到15条评论**。
2.  评论内容需要与帖子主题紧密相关，可以是提问、赞同、反驳、抖机灵或分享相关经历。
3.  模拟真实的网络对话氛围，评论之间可以有简单的互动。
4.  **用户名应该是随机、多样化的中文昵称，也可以是“匿名用户”**。
5.  语气要口语化、自然，符合豆瓣用户的风格。
`;try{const m=[{role:"user",content:i.trim()}],r=await o.getGenericCompletion(m,{});if(r&&r.content){let a=r.content;const l=a.indexOf("["),S=a.lastIndexOf("]");l!==-1&&S>l&&(a=a.substring(l,S+1));const u=JSON.parse(a);return Array.isArray(u)?u.map((d,p)=>({...d,id:Date.now()+p,time:`${Math.floor(Math.random()*50)+1}分钟前`,likes:Math.floor(Math.random()*500)})):[]}return[]}catch(m){return console.error("Failed to fetch or parse AI-generated comments:",m),[]}}return{posts:n,isLoading:e,setPosts:c,fetchAndSetPosts:h,getPostById:g,fetchCommentsForPost:A}});export{E as u};
