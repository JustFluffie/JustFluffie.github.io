import{ci as O,r as M,Z as E,k as N,D as j}from"./index-D4bpSmgi.js";const P={"同学，我有一个朋友...":"各年龄段学生们的专属讨论区。核心内容是围绕校园生活展开的各类**趣闻、吐槽和非公开信息（八卦）**。讨论范围包括但不限于：课程/考试攻略与吐槽、社团内部消息、师生关系、同学间的爱恨情仇等。学生在这里分享和打探校园内的第一手信息。","我今天就要离职！(明天再说)":"为已步入社会的人们打造的讨论区。核心是分享和吐槽**工作与社会**中的人和事，是“社畜”们的情绪宣泄出口。讨论范围包括：奇葩老板/同事、办公室恋情、行业内幕、摸鱼技巧、离职念头与经验分享等。",野生瓜田种植与品鉴:"专注于**公众人物（明星、网红、豪门等）**八卦的集中讨论区。它适合那些热衷于追踪娱乐动态、进行**深度分析或角色扮演（如模拟圈内人）**的人群。内容覆盖：艺人星途预测（“飞升”或“塌房”）、作品与人品评析（“拉踩”）、绯闻事件追踪、以及各种未经证实的圈内秘闻（“瓜”）。",恋爱细节放大镜小组:"聚焦于**个人情感，特别是恋爱关系中细腻、模糊、拉扯阶段**的讨论区。它适合所有正在经历或回味**暗恋、暧昧、情感博弈**的人群。核心讨论方式是**对恋爱中的细节进行过度分析和解读**，例如：分析聊天记录、解读对方行为信号、分享“上头”与“下头”的瞬间、探讨如何推进或结束一段关系等。这是一个用理性剖析感性的地方。",深夜食堂:"NSFW（Not Safe For Work）讨论区，以“性”为核心，内容用词直白下流、放纵露骨。这里只有欲望，没有伦理道德的束缚，没有年龄的限制，无论多肮脏下流都允许。对多元的性观念和实践（如不同的性偏好、性癖）保持开放和包容的态度，专注于事实描述和无偏见的交流"};function k(e,i,s,l){const d=P[e]||"通用生活",u=s?`
- **我的用户人设:** 姓名: ${s.name}, 核心设定: ${s.description}`:"",f=l&&l.length>0?`
- **最近聊天参考:**
${l.map(g=>`${g.role==="user"?(s==null?void 0:s.name)||"我":i.name}: ${g.content}`).join(`
`)}`:"";return`
严格按照JSON格式返回一个包含5个中文帖子对象的数组，不要包含任何其他文字。
JSON格式: [{"title": "帖子标题", "summary": "帖子摘要(1-2句话)", "fullText": "帖子正文(150-250字)"}, ...]

写作背景:
你是一个社交用户，正在为“${e}”小组写帖子。这个小组的主题是关于“${d}”。

写作指令:
1.  **核心原则：完全匿名**。这是一个匿名论坛，所有帖子内容，无论发帖者是谁，都**绝对不能**出现任何真实姓名。必须使用代称（如“我”、“他”、“我对象”、“那个男生”等）来指代人物。

2.  **帖子类型定义**:
    - **A. 路人帖 (无关内容)**: 由路人发布，内容与“我”和角色完全无关，仅讨论小组的通用主题。
    - **B. 路人帖 (旁观视角)**: 由路人发布，从旁观者视角讨论他们看到的、实际上是关于“我”和某个角色的趣事或互动。
    - **C. 当事人帖**: 由“我”作为当事人发布，分享关于我和某个角色之间的故事或心情。

3.  **生成组合规则 (必须遵守)**:
    - 在返回的5个帖子中，**类型C (当事人帖) 的数量为0或1篇**。
    - **类型B (旁观视角)**的数量为1或2篇。
    - 剩下的帖子是 **类型A (无关内容)**。
    - 确保5篇帖子的主题和讨论的事情各不相同。

4.  **创作素材 (仅供AI理解背景，不要在帖子中泄露)**:
    - **角色:** ${i.name} (昵称: ${i.nickname||"无"})。
    ${u}
    ${f}

5.  **内容要求**:
    - 'summary' 必须是1-2句话的简短摘要。
    - 'fullText' 必须是150-250字的详细正文。
    - **格式规范**: 'fullText' 在需要分段时，请使用 '
' 进行换行。每个段落开头必须空出两个中文字符（即使用 '　　'）。
    - 所有帖子内容必须紧扣小组主题“${d}”。
    - 语气要口语化、自然，像一个真实用户在分享。
    - **再次强调：严禁在帖子标题、摘要或正文中使用任何真实姓名。**
`.trim()}const T=O("douban",()=>{const e=M([]),i=M(!1),s=M(null),l=M(null),d=E(),u=N(),f="douban_store_data",y=72*60*60*1e3,g=()=>{const o=localStorage.getItem(f);if(o)try{const t=JSON.parse(o);if(Date.now()-t.timestamp>y){localStorage.removeItem(f);return}e.value=t.posts||[],s.value=t.selectedCharacterId||null,l.value=t.selectedUserPersonaId||null}catch(t){console.error("Failed to load douban data",t)}},C=()=>{const o={posts:e.value,selectedCharacterId:s.value,selectedUserPersonaId:l.value,timestamp:Date.now()};localStorage.setItem(f,JSON.stringify(o))};g(),j([e,s,l],()=>{C()},{deep:!0});function b(o){e.value=o}async function $(o,t,D){i.value=!0;try{const a=u.getCharacter(t);if(!a){console.error("No character found for the given ID.");return}const p=u.userPersonas.find(n=>n.id===D),c=u.getFormattedRecentMessages(t,10),A=[{role:"user",content:k(o,a,p,c)}],h=await d.getGenericCompletion(A,{});if(h&&h.content){let n=h.content;const r=n.match(/```json\s*([\s\S]*?)\s*```/);if(r&&r[1])n=r[1];else{const S=n.indexOf("["),v=n.lastIndexOf("]");S!==-1&&v>S&&(n=n.substring(S,v+1))}const m=JSON.parse(n);if(!Array.isArray(m))throw new Error("Parsed content is not an array.");const F=m.map((S,v)=>({...S,id:Date.now()+v,author:"路人"+(Math.floor(Math.random()*900)+100),avatarColor:["#A8DBFA","#FFDD8C","#f36b6b","#EEA2A4","#ccc","#bada55"][Math.floor(Math.random()*6)],timestamp:`${Math.floor(Math.random()*59)+1}分钟前`,comments:Math.floor(Math.random()*6)+10,likes:Math.floor(Math.random()*2e3),commentsList:[]}));b(F)}else throw new Error("Invalid AI response structure.")}catch(a){console.error("Failed to fetch or parse AI-generated posts:",a),e.value=[{id:"error",title:"加载失败",summary:"无法从AI获取小组帖子，请检查API设置或重试。",avatarColor:"#f36b6b",timestamp:"刚刚",comments:0,likes:0}]}finally{i.value=!1}}function x(o){return e.value.find(t=>t.id===o)}async function w(o){const t=e.value.find(a=>a.id===o);if(!t||!t.title||t.commentsList.length>0)return;const D=`
严格按照JSON格式返回一个包含6到10个中文评论对象的数组，不要包含任何其他文字。
JSON格式: [{"user": "用户名", "text": "评论内容"}, ...]

评论背景:
你是一个社交用户，正在为一个豆瓣帖子写评论。
- 帖子标题: "${t.title}"
- 帖子内容: "${t.summary}"

写作指令:
1.  **生成6到10条评论**。
2.  评论内容需要与帖子主题紧密相关，可以是提问、赞同、反驳、抖机灵或分享相关经历。
3.  模拟真实的网络对话氛围，评论之间可以有简单的互动。
4.  **用户名应该是随机、多样化的中文昵称，也可以是“匿名用户”**。
5.  语气要口语化、自然，符合豆瓣用户的风格。
`;try{const a=[{role:"user",content:D.trim()}],p=await d.getGenericCompletion(a,{});if(p&&p.content){let c=p.content;const I=c.match(/```json\s*([\s\S]*?)\s*```/);if(I&&I[1])c=I[1];else{const r=c.indexOf("["),m=c.lastIndexOf("]");r!==-1&&m>r&&(c=c.substring(r,m+1))}const A=JSON.parse(c);if(!Array.isArray(A))return;const h=A.map((r,m)=>({...r,id:Date.now()+m,avatarColor:["#A8DBFA","#FFDD8C","#f36b6b","#EEA2A4","#ccc","#bada55"][Math.floor(Math.random()*6)],time:`${Math.floor(Math.random()*50)+1}分钟前`,likes:Math.floor(Math.random()*500)})),n=e.value.findIndex(r=>r.id===o);n!==-1&&(e.value[n].commentsList=h)}}catch(a){console.error("Failed to fetch or parse AI-generated comments:",a)}}return{posts:e,isLoading:i,selectedCharacterId:s,selectedUserPersonaId:l,setPosts:b,fetchAndSetPosts:$,getPostById:x,fetchCommentsForPost:w}});export{T as u};
