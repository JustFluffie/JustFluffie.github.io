import{ci as I,r as g,X as M,u as w}from"./index-Bv46giou.js";const x={校园热线:"关于课程、考试、社团、老师同学的校园生活趣事。",职场茶水间:"关于办公室日常、吐槽老板同事、加班摸鱼的职场八卦。",自由吃瓜基地:"关于明星、网红、热门事件的最新娱乐八卦。",情感树洞:"关于恋爱烦恼、失恋心情、暗恋故事的个人情感困扰。",深夜食堂:"关于深入、坦诚地探讨两性关系、性幻想、个人欲望、情感禁区，以及其他在日常生活中不便公开的成熟话题。"};function C(t,o,e,n){const c=x[t]||"通用生活",l=e?`
- **我的用户人设:** 姓名: ${e.name}, 核心设定: ${e.description}`:"",d=n&&n.length>0?`
- **最近聊天参考:**
${n.map(s=>`${s.role==="user"?(e==null?void 0:e.name)||"我":o.name}: ${s.content}`).join(`
`)}`:"";return`
严格按照JSON格式返回一个包含3个中文帖子对象的数组，不要包含任何其他文字。
JSON格式: [{"title": "帖子标题", "summary": "帖子摘要(1-2句话)"}, ...]

写作背景:
你是一个社交用户，正在为“${t}”小组写帖子。这个小组的主题是关于“${c}”。

写作指令:
1.  **必须**结合以下背景信息进行创作，让帖子内容更真实、更贴近生活：
    - **与我互动的角色:** ${o.name} (昵称: ${o.nickname||"无"})。
    ${l}
    ${d}
2.  帖子内容必须紧扣小组主题。
3.  **必须包含至少一个**关于“我”和角色“${o.name}”之间的故事或心情。
4.  语气要口语化，像一个真实用户在分享。
`.trim()}const O=I("douban",()=>{const t=g([]),o=g(!1),e=M(),n=w();function c(r){t.value=r}async function l(r,s,S){o.value=!0,t.value=[];try{const i=n.getCharacter(s);if(!i){console.error("No character found for the given ID.");return}const $=n.userPersonas.find(p=>p.id===S),A=n.getFormattedRecentMessages(s,10),D=[{role:"user",content:C(r,i,$,A)}],m=await e.getGenericCompletion(D,{});if(m&&m.choices&&m.choices[0]){let a=m.choices[0].message.content;const f=a.indexOf("["),u=a.lastIndexOf("]");f!==-1&&u>f&&(a=a.substring(f,u+1));const h=JSON.parse(a);if(!Array.isArray(h))throw new Error("Parsed content is not an array.");const b=h.map((v,y)=>({...v,id:Date.now()+y,avatarColor:["#A8DBFA","#FFDD8C","#f36b6b","#EEA2A4","#ccc","#bada55"][Math.floor(Math.random()*6)],timestamp:`${Math.floor(Math.random()*59)+1}分钟前`,comments:Math.floor(Math.random()*500),likes:Math.floor(Math.random()*2e3)}));c(b)}else throw new Error("Invalid AI response structure.")}catch(i){console.error("Failed to fetch or parse AI-generated posts:",i),t.value=[{id:"error",title:"加载失败",summary:"无法从AI获取小组帖子，请检查API设置或重试。",avatarColor:"#f36b6b",timestamp:"刚刚",comments:0,likes:0}]}finally{o.value=!1}}function d(r){return t.value.find(s=>s.id===r)}return{posts:t,isLoading:o,setPosts:c,fetchAndSetPosts:l,getPostById:d}});export{O as u};
