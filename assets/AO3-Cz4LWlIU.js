import{_ as L,A as R,Z as H,B as Y,r as h,c as T,C as q,b as z,w as I,e as X,o as l,i as s,f as N,g as r,h as c,p as S,G as $,H as x,t as i,c5 as P,Y as m,I as Z,M as Q,F as C,S as ee}from"./index-BPODIDtX.js";const se={class:"ao3-page"},te={class:"selection-bar"},oe={class:"selection-group"},ae=["value"],ne={class:"selection-group"},le=["value"],re={key:0,class:"work-meta-card"},ie={class:"work-meta"},ue={class:"preface-group"},de={href:"#",class:"tag"},ce={class:"preface-group"},me={href:"#",class:"tag"},ve={class:"preface-group"},pe={class:"preface-group"},fe={class:"preface-group"},ge={class:"stats-row"},ke={class:"stat-item"},he={class:"stat-item"},we={class:"stat-item"},ye={class:"stat-item"},be={class:"stat-item"},_e={class:"stat-item"},Se={key:1,class:"work-title"},$e={class:"byline"},xe={key:2,class:"summary"},Te={class:"summary-text"},Ie={key:3,class:"userstuff"},We={key:4,class:"placeholder"},Ce={key:5,class:"loading-state"},Ae={key:6,class:"chapter-navigation"},Oe={class:"generate-modal"},Ee={class:"form-group"},Me={class:"form-group"},Ne={class:"word-count-range"},Pe={class:"modal-actions"},Ue=["disabled"],A="ao3_generated_work",De=72*60*60*1e3,Ge={__name:"AO3",setup(Ve){const W=R(),U=H(),v=Y(),p=h(""),f=h(""),w=h(!1),d=h({keywords:"",minWords:500,maxWords:600}),g=h(!1),a=h(null),D=o=>{const e={work:o,charId:p.value,userId:f.value,timestamp:Date.now()};localStorage.setItem(A,JSON.stringify(e))},G=()=>{const o=localStorage.getItem(A);if(!o)return null;try{const e=JSON.parse(o);return Date.now()-e.timestamp>De?(localStorage.removeItem(A),null):e}catch(e){return console.error("Failed to load AO3 work from storage",e),null}},O=T(()=>W.characters),E=T(()=>W.userPersonas),V=T(()=>O.value.find(o=>o.id===p.value)),j=T(()=>E.value.find(o=>o.id===f.value)),M=()=>{},B=async()=>{if(!p.value||!f.value){v.showToast("请先选择角色和用户","error");return}if(!d.value.minWords||!d.value.maxWords){v.showToast("请输入字数区间","error");return}if(d.value.minWords>d.value.maxWords){v.showToast("最小字数不能大于最大字数","error");return}g.value=!0,w.value=!1;try{const o=V.value,e=j.value,t=F(o,e,d.value);let n=null,u=null;const k=[{name:"unlimited",maxTokens:void 0},{name:"large",maxTokens:4e3},{name:"safe",maxTokens:2e3}];for(const y of k)try{console.log(`尝试生成策略: ${y.name}`);const b={silent:!0};y.maxTokens&&(b.max_tokens=y.maxTokens);const _=await U.getGenericCompletion([{role:"user",content:t}],b);if(_&&_.content){n=_;break}else throw _.error?_.error:new Error("API returned empty response")}catch(b){console.warn(`策略 ${y.name} 失败:`,b),u=b}if(n&&n.content)J(n.content,o,e)&&v.showToast("同人文创作成功！","success");else throw u||new Error("创作失败，请重试")}catch(o){console.error("同人文失败:",o);let e=o.message;e.includes("405")?e="API 请求被拒绝 (405)。请检查 API URL 设置是否正确，或尝试更换模型。":e.includes("400")&&(e="API 请求参数错误 (400)。可能是上下文过长或参数不支持。"),v.showToast("创作失败："+e,"error")}finally{g.value=!1}},F=(o,e,t)=>{const n=t.keywords?`
用户想看的类型/关键词：${t.keywords}`:"";return`你是一位专业的同人文作者，请为以下角色和用户创作一篇AO3风格的同人文。

# 角色信息
- 角色名：${o.name}
- 角色设定：${o.card||"无特殊设定"}

# 用户信息
- 用户名：${e.name}
- 用户设定：${e.card||"无特殊设定"}
${n}

# 创作要求
1. **字数严格控制**：正文必须在${t.minWords}-${t.maxWords}字之间。
2. **元数据要求**：
   - 评级：从以下选择一个：General Audiences（全年龄）、Explicit（限制级）。
   - 关系：格式必须为"${o.name}×${e.name}"。
   - 人物：列出主要人物（包括${o.name}和${e.name}）。
   - 其他标签：必须基于生成的文章内容提取3-6个标签（例如具体的play、情感基调、核心梗等）。**严禁直接复制用户输入的关键词**，除非该关键词在文中得到了具体体现。标签应反映文章的实际内容。
   - 统计数据：随机生成合理的数据。
3. **摘要**：必须用一句话概括全文，风格不限。
4. **正文**：
   - 必须分段，每段之间用换行符分隔。
   - **不要**在段首手动添加空格，前端会自动处理缩进。
   - 内容要符合角色设定和用户提供的关键词。

# 输出格式（严格按照以下JSON格式输出）
\`\`\`json
{
  "title": "作品标题",
  "author": "作者笔名",
  "rating": "评级",
  "relationship": "${o.name}×${e.name}",
  "characters": ["${o.name}", "${e.name}"],
  "tags": ["标签1", "标签2", "标签3"],
  "summary": "一句话摘要",
  "content": ["第一段正文", "第二段正文", "第三段正文"],
  "wordCount": 实际字数,
  "publishDate": "2026-01-27",
  "chapters": "1/1",
  "kudos": 随机数字,
  "bookmarks": 随机数字,
  "hits": 随机数字
}
\`\`\`

请直接输出JSON，不要有任何其他文字。`},J=(o,e,t)=>{try{let n=o.trim();n=n.replace(/^```(?:json)?\s*/,""),n=n.replace(/\s*```$/,"");const u=JSON.parse(n),k=u.content.join("").length;return(k<d.value.minWords||k>d.value.maxWords)&&console.warn(`生成的字数(${k})不在指定范围内，但仍然使用`),u.relationship=`${e.name}×${t.name}`,u.characters.includes(e.name)||u.characters.unshift(e.name),!u.characters.includes(t.name)&&t.name!==e.name&&u.characters.push(t.name),u.wordCount=k.toLocaleString(),a.value=u,D(u),!0}catch(n){console.error("解析生成内容失败:",n),console.log("原始内容:",o);let u="解析生成内容失败：内容可能被截断或格式错误";return o.trim().slice(-1)!=="}"&&(u+="。这通常是因为模型上下文窗口不足，请尝试减少角色设定长度或更换支持更长上下文的模型。"),v.showToast(u,"error"),!1}},K=()=>{const o=document.querySelector(".ao3-page");o&&o.scrollTo({top:0,behavior:"smooth"})};return q(()=>{W.initData();const o=G();o&&(a.value=o.work,o.charId&&(p.value=o.charId),o.userId&&(f.value=o.userId))}),(o,e)=>(l(),z(X,{title:"Archive of Our Own","no-padding":"",class:"ao3-layout"},{"back-btn":I(()=>[...e[8]||(e[8]=[s("div",{class:"ao3-logo-btn"},[s("img",{src:"https://i.ibb.co/Kj4DKhHd/ao3-Photo-Grid-1-1-1.png",alt:"AO3"})],-1)])]),action:I(()=>[N(ee,{name:"refresh",onClick:e[0]||(e[0]=t=>w.value=!0),class:"icon-refresh"})]),default:I(()=>[s("div",se,[s("div",te,[s("div",oe,[S(s("select",{"onUpdate:modelValue":e[1]||(e[1]=t=>p.value=t),onChange:M},[e[9]||(e[9]=s("option",{value:"",disabled:""},"角色",-1)),(l(!0),r($,null,x(O.value,t=>(l(),r("option",{key:t.id,value:t.id},i(t.name),9,ae))),128))],544),[[P,p.value]])]),s("div",ne,[S(s("select",{"onUpdate:modelValue":e[2]||(e[2]=t=>f.value=t),onChange:M},[e[10]||(e[10]=s("option",{value:"",disabled:""},"用户",-1)),(l(!0),r($,null,x(E.value,t=>(l(),r("option",{key:t.id,value:t.id},i(t.name),9,le))),128))],544),[[P,f.value]])])]),a.value?(l(),r("div",re,[s("div",ie,[s("div",ue,[e[11]||(e[11]=s("span",{class:"meta-label"},"评级：",-1)),s("a",de,i(a.value.rating),1)]),s("div",ce,[e[12]||(e[12]=s("span",{class:"meta-label"},"关系：",-1)),s("a",me,i(a.value.relationship),1)]),s("div",ve,[e[13]||(e[13]=s("span",{class:"meta-label"},"人物：",-1)),(l(!0),r($,null,x(a.value.characters,(t,n)=>(l(),r("a",{href:"#",class:"tag",key:n},i(t),1))),128))]),s("div",pe,[e[14]||(e[14]=s("span",{class:"meta-label"},"其他标签：",-1)),(l(!0),r($,null,x(a.value.tags,(t,n)=>(l(),r("a",{href:"#",class:"tag",key:n},i(t),1))),128))]),s("div",fe,[e[21]||(e[21]=s("span",{class:"meta-label"},"统计数据：",-1)),s("div",ge,[s("span",ke,[e[15]||(e[15]=m("发布: ",-1)),s("strong",null,i(a.value.publishDate),1)]),s("span",he,[e[16]||(e[16]=m("字数: ",-1)),s("strong",null,i(a.value.wordCount),1)]),s("span",we,[e[17]||(e[17]=m("章节: ",-1)),s("strong",null,i(a.value.chapters),1)]),s("span",ye,[e[18]||(e[18]=m("Kudos: ",-1)),s("strong",null,i(a.value.kudos),1)]),s("span",be,[e[19]||(e[19]=m("书签: ",-1)),s("strong",null,i(a.value.bookmarks),1)]),s("span",_e,[e[20]||(e[20]=m("点击: ",-1)),s("strong",null,i(a.value.hits),1)])])])])])):c("",!0),a.value?(l(),r("div",Se,[s("h2",null,i(a.value.title),1),s("div",$e,i(a.value.author),1)])):c("",!0),a.value?(l(),r("div",xe,[e[22]||(e[22]=s("h3",null,"Summary：",-1)),s("div",Te,[s("p",null,i(a.value.summary),1)])])):c("",!0),a.value?(l(),r("div",Ie,[(l(!0),r($,null,x(a.value.content,(t,n)=>(l(),r("p",{key:n,class:"content-paragraph"},i(t),1))),128))])):c("",!0),!a.value&&!g.value?(l(),r("div",We,[...e[23]||(e[23]=[s("p",null,"请选择角色和用户，然后点击右上角刷新按钮等待同人文创作",-1)])])):c("",!0),g.value?(l(),r("div",Ce,[...e[24]||(e[24]=[s("div",{class:"loading-spinner"},null,-1),s("p",null,"正在创作同人文，请稍候...",-1),s("p",{class:"sub-hint"},"这可能需要一分钟左右的时间",-1)])])):c("",!0),a.value?(l(),r("div",Ae,[s("a",{href:"#",onClick:Z(K,["prevent"])},"返回顶部 ↑")])):c("",!0),e[25]||(e[25]=s("div",{class:"footer"},[s("p",null,[m("Archive of Our Own, a project of the "),s("a",{href:"#"},"Organization for Transformative Works")])],-1))]),N(Q,{visible:w.value,"onUpdate:visible":e[7]||(e[7]=t=>w.value=t)},{default:I(()=>[s("div",Oe,[e[31]||(e[31]=s("h3",null,"创作同人文",-1)),s("div",Ee,[e[26]||(e[26]=s("label",null,"关键词/标签（可选）：",-1)),S(s("input",{"onUpdate:modelValue":e[3]||(e[3]=t=>d.value.keywords=t),type:"text",placeholder:"例如：甜文、校园、现代AU等，用逗号分隔",class:"input-field"},null,512),[[C,d.value.keywords]]),e[27]||(e[27]=s("p",{class:"hint"},"这些关键词将作为创作提示，不会显示在标签栏中",-1))]),s("div",Me,[e[29]||(e[29]=s("label",null,"字数区间：",-1)),s("div",Ne,[S(s("input",{"onUpdate:modelValue":e[4]||(e[4]=t=>d.value.minWords=t),type:"number",placeholder:"最小字数",class:"input-field",min:"100"},null,512),[[C,d.value.minWords,void 0,{number:!0}]]),e[28]||(e[28]=s("span",{class:"separator"},"-",-1)),S(s("input",{"onUpdate:modelValue":e[5]||(e[5]=t=>d.value.maxWords=t),type:"number",placeholder:"最大字数",class:"input-field",min:"100"},null,512),[[C,d.value.maxWords,void 0,{number:!0}]])]),e[30]||(e[30]=s("p",{class:"hint"},"建议范围：500-3000字",-1))]),s("div",Pe,[s("button",{onClick:e[6]||(e[6]=t=>w.value=!1),class:"btn-cancel"},"取消"),s("button",{onClick:B,class:"btn-confirm",disabled:g.value},i(g.value?"创作中...":"创作"),9,Ue)])])]),_:1},8,["visible"])]),_:1}))}},Be=L(Ge,[["__scopeId","data-v-1a291fce"]]);export{Be as default};
