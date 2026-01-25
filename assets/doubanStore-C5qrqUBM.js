import{ch as b,r as I,W as v,u as y}from"./index-Dj1Fr4-t.js";const M={校园热线:"关于课程、考试、社团、老师同学的校园生活趣事。",职场茶水间:"关于办公室日常、吐槽老板同事、加班摸鱼的职场八卦。",自由吃瓜基地:"关于明星、网红、热门事件的最新娱乐八卦。",情感树洞:"关于恋爱烦恼、失恋心情、暗恋故事的个人情感困扰。",深夜食堂:"关于深入、坦诚地探讨两性关系、性幻想、个人欲望、情感禁区，以及其他在日常生活中不便公开的成熟话题。"};function w(o,s,t,r){const m=M[o]||"通用生活",d=t?`
- **我的用户人设:** 姓名: ${t.name}, 核心设定: ${t.description}`:"",n=r&&r.length>0?`
- **最近聊天参考:**
${r.map(i=>`${i.role==="user"?(t==null?void 0:t.name)||"我":s.name}: ${i.content}`).join(`
`)}`:"";return`
严格按照JSON格式返回一个包含3个中文帖子对象的数组，不要包含任何其他文字。
JSON格式: [{"title": "帖子标题", "summary": "帖子摘要(1-2句话)"}, ...]

写作背景:
你是一个社交用户，正在为“${o}”小组写帖子。这个小组的主题是关于“${m}”。

写作指令:
1.  **必须**结合以下背景信息进行创作，让帖子内容更真实、更贴近生活：
    - **与我互动的角色:** ${s.name} (昵称: ${s.nickname||"无"})。
    ${d}
    ${n}
2.  帖子内容必须紧扣小组主题。
3.  **必须包含至少一个**关于“我”和角色“${s.name}”之间的故事或心情。
4.  语气要口语化，像一个真实用户在分享。
`.trim()}const F=b("douban",()=>{const o=I([]),s=v(),t=y();function r(n){o.value=n}async function m(n,a,i){const l=t.getCharacter(a);if(!l){console.error("No character found for the given ID."),o.value=[];return}const h=t.userPersonas.find(e=>e.id===i),g=t.getFormattedRecentMessages(a,10),S=[{role:"user",content:w(n,l,h,g)}];try{const e=await s.getGenericCompletion(S,{max_tokens:800});if(e&&e.choices&&e.choices[0]){let c=e.choices[0].message.content;const p=c.indexOf("["),f=c.lastIndexOf("]");p!==-1&&f>p&&(c=c.substring(p,f+1));const u=JSON.parse(c);if(!Array.isArray(u))throw new Error("Parsed content is not an array.");const $=u.map((A,D)=>({...A,id:Date.now()+D,avatarColor:["#A8DBFA","#FFDD8C","#f36b6b","#EEA2A4","#ccc","#bada55"][Math.floor(Math.random()*6)],timestamp:`${Math.floor(Math.random()*59)+1}分钟前`,comments:Math.floor(Math.random()*500),likes:Math.floor(Math.random()*2e3)}));r($)}else throw new Error("Invalid AI response structure.")}catch(e){console.error("Failed to fetch or parse AI-generated posts:",e),o.value=[{id:"error",title:"加载失败",summary:"无法从AI获取小组帖子，请检查API设置或重试。",avatarColor:"#f36b6b",timestamp:"刚刚",comments:0,likes:0}]}}function d(n){return o.value.find(a=>a.id===n)}return{posts:o,setPosts:r,fetchAndSetPosts:m,getPostById:d}});export{F as u};
