(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))t(r);new MutationObserver(r=>{for(const s of r)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&t(i)}).observe(document,{childList:!0,subtree:!0});function n(r){const s={};return r.integrity&&(s.integrity=r.integrity),r.referrerPolicy&&(s.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?s.credentials="include":r.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function t(r){if(r.ep)return;r.ep=!0;const s=n(r);fetch(r.href,s)}})();const $={NUM_ABSOLUTE:"ATNumAbs",NUM_SIG_FIGS:"ATNumSigFigs",ALG_EQUIV:"AlgEquiv",UNITS:"ATUnits",STRING:"String",STRING_SLOPPY:"StringSloppy"},p={NUMERICAL:"numerical",ALGEBRAIC:"algebraic",UNITS:"units",RADIO:"radio",MATRIX:"matrix",STRING:"string",JSXGRAPH:"jsxgraph"},h={SET:"=",ADD:"+",SUBTRACT:"-"},ye={engineering:{label:"Engineering (Standard)",description:"Industry-standard tolerances, 3 significant figures, power-of-10 check",tightTol:.05,wideTol:.2,checkSigFigs:!0,sigFigs:3,penalty:.1,checkPowerOf10:!0,powerOf10Penalty:.5},physicsLab:{label:"Physics Lab (Strict)",description:"Tight tolerances for experimental work, 4 significant figures",tightTol:.01,wideTol:.05,checkSigFigs:!0,sigFigs:4,penalty:.1,checkPowerOf10:!0,powerOf10Penalty:.5},conceptual:{label:"Conceptual (Wide)",description:"Wide margins for estimation and conceptual understanding",tightTol:.15,wideTol:.5,checkSigFigs:!1,sigFigs:2,penalty:0,checkPowerOf10:!1,powerOf10Penalty:0},exact:{label:"Exact Match",description:"No tolerance, answer must be exactly correct",tightTol:0,wideTol:0,checkSigFigs:!1,sigFigs:3,penalty:0,checkPowerOf10:!1,powerOf10Penalty:0}},U={tightTol:.05,wideTol:.2,checkSigFigs:!0,sigFigs:3,penalty:.1,checkPowerOf10:!0,powerOf10Penalty:.5},f={correct:"Correct! Well done.",incorrect:"Incorrect. Please try again.",closeButInaccurate:"Close, but check your accuracy. Review your calculation steps.",wrongSigFigs:"Your answer has the wrong number of significant figures. Check the precision required.",powerOf10Error:"Your answer appears to be off by a power of 10. Check your unit conversions or decimal placement.",wrongUnits:"Check the units of your answer."},$e={random:[{syntax:"rand(10)",description:"Random integer 0-9",example:"→ 7"},{syntax:"rand(10)+1",description:"Random integer 1-10",example:"→ 4"},{syntax:"rand([2, 3, 5, 7])",description:"Random from list",example:"→ 5"},{syntax:"rand_with_step(1, 10, 0.5)",description:"Random with step",example:"→ 3.5"},{syntax:"rand(5)+1 + rand(3)/10",description:"Mixed random",example:"→ 4.2"}],arithmetic:[{syntax:"a + b",description:"Addition",example:"3 + 4 → 7"},{syntax:"a * b",description:"Multiplication",example:"3 * 4 → 12"},{syntax:"a / b",description:"Division",example:"10 / 3 → 10/3"},{syntax:"a ^ b",description:"Power / Exponent",example:"2 ^ 3 → 8"},{syntax:"sqrt(x)",description:"Square root",example:"sqrt(16) → 4"},{syntax:"abs(x)",description:"Absolute value",example:"abs(-5) → 5"}],trigonometry:[{syntax:"sin(x)",description:"Sine (radians)",example:"sin(%pi/2) → 1"},{syntax:"cos(x)",description:"Cosine (radians)",example:"cos(0) → 1"},{syntax:"tan(x)",description:"Tangent (radians)",example:"tan(%pi/4) → 1"},{syntax:"atan2(y, x)",description:"Angle from coordinates",example:"atan2(1,1) → %pi/4"}],calculus:[{syntax:"diff(expr, x)",description:"Derivative",example:"diff(x^3, x) → 3*x^2"},{syntax:"integrate(expr, x)",description:"Indefinite integral",example:"integrate(x^2, x) → x^3/3"},{syntax:"integrate(expr, x, a, b)",description:"Definite integral",example:"integrate(x, x, 0, 1) → 1/2"}],linearAlgebra:[{syntax:"matrix([1,2],[3,4])",description:"Create matrix",example:"[[1,2],[3,4]]"},{syntax:"A . B",description:"Matrix multiply",example:"A . B"},{syntax:"invert(A)",description:"Matrix inverse",example:"invert(matrix([1,2],[3,4]))"},{syntax:"determinant(A)",description:"Determinant",example:"determinant(matrix([1,2],[3,4])) → -2"},{syntax:"transpose(A)",description:"Transpose",example:"transpose(matrix([1,2],[3,4]))"}],formatting:[{syntax:"decimalplaces(x, n)",description:"Round to n decimals",example:"decimalplaces(3.14159, 2) → 3.14"},{syntax:"significantfigures(x, n)",description:"Round to n sig figs",example:"significantfigures(0.00456, 2) → 0.0046"},{syntax:"scientific_notation(x)",description:"Scientific notation",example:"0.005 → 5*10^-3"}],units:[{syntax:"stackunits(5, m/s)",description:"Value with units",example:"5 m/s"},{syntax:"stackunits(val, kg*m/s^2)",description:"Compound units",example:"Force in N"},{syntax:"stackunits(val, V)",description:"Electrical units",example:"Voltage"}]};function Se(a){if(!a)return"calc";const e=a.trim();if(e.includes("rand(")||e.includes("rand_with_step"))return"rand";const n=e.replace(/(sin|cos|tan|exp|sqrt|log|abs|pi|%pi|%e|decimalplaces|significantfigures|integrate|diff|expand|matrix|invert|determinant|transpose|stackunits)/g,"");return/[a-zA-Z_]/.test(n),"calc"}function Ee(a,e,n){if(!e)return 0;let t=e.trim();for(;t.endsWith(";");)t=t.slice(0,-1).trim();if(a==="rand")return Te(t,n);if(a==="algebraic"){let r=t;for(const[s,i]of Object.entries(n))r=r.replace(new RegExp(`\\b${s}\\b`,"g"),`(${i})`);return r}return Ce(t,n)}function Te(a,e){let t=xe(a,e);return t=t.replace(/rand_with_step\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g,(r,s,i,o)=>{const g=parseFloat(s),w=parseFloat(i),c=parseFloat(o);if(isNaN(g)||isNaN(w)||isNaN(c)||c<=0)return"0";const y=Math.floor((w-g)/c),d=Math.floor(Math.random()*(y+1));return String(g+d*c)}),t=t.replace(/rand\(\s*\[([^\]]+)\]\s*\)/g,(r,s)=>{const i=s.split(",").map(w=>w.trim()),o=i[Math.floor(Math.random()*i.length)],g=parseFloat(o);return isNaN(g)?o:String(g)}),t=t.replace(/rand\((\d+)\)/g,(r,s)=>String(Math.floor(Math.random()*parseInt(s)))),we(t)}function Ce(a,e){let n=xe(a,e);return we(n)}function xe(a,e){let n=a;const t=Object.keys(e).sort((r,s)=>s.length-r.length);for(const r of t)n=n.replace(new RegExp(`\\b${r}\\b`,"g"),`(${e[r]})`);return n}function we(a){try{let e=a;e=e.replace(/\bsin\s*\(/g,"Math.sin("),e=e.replace(/\bcos\s*\(/g,"Math.cos("),e=e.replace(/\btan\s*\(/g,"Math.tan("),e=e.replace(/\bexp\s*\(/g,"Math.exp("),e=e.replace(/\bsqrt\s*\(/g,"Math.sqrt("),e=e.replace(/\blog\s*\(/g,"Math.log("),e=e.replace(/\babs\s*\(/g,"Math.abs("),e=e.replace(/\bpi\b/g,"Math.PI"),e=e.replace(/%pi/g,"Math.PI"),e=e.replace(/%e/g,"Math.E"),e=e.replace(/\^/g,"**");const n=/^[0-9+\-*/().,%\s]*$|Math\.|(\*\*)/,t=e.replace(/Math\.\w+/g,"").replace(/\*\*/g,"");if(/[a-zA-Z_]/.test(t))return"[Preview N/A]";const r=Function('"use strict"; return ('+e+")")();return typeof r=="number"?Number.isInteger(r)?r:parseFloat(r.toPrecision(6)):r}catch{return"[Calc Error]"}}function Ae(a){const e=a.match(/^([^:]+):(.*)$/);return e?{name:e[1].trim(),value:e[2].trim().replace(/;+$/,"")}:null}function Ie(a){var P,K,ee;const n=new DOMParser().parseFromString(a,"text/xml"),t=n.querySelector("parsererror");if(t)throw new Error("Invalid XML: "+t.textContent.substring(0,100));const r=n.querySelector("question");if(!r||r.getAttribute("type")!=="stack")throw new Error("Invalid file format: Not a STACK question XML.");const s={name:"",questionText:"",variables:[],parts:[],images:[],generalFeedback:"",hints:[]};s.name=((P=n.querySelector("name text"))==null?void 0:P.textContent)||"Imported Question",s.generalFeedback=((K=n.querySelector("generalfeedback text"))==null?void 0:K.textContent)||"",n.querySelectorAll("hint text").forEach(v=>{var x;const u=(x=v.textContent)==null?void 0:x.trim();u&&s.hints.push(u)});const o=(((ee=n.querySelector("questionvariables text"))==null?void 0:ee.textContent)||"").split(";").map(v=>v.trim()).filter(v=>v),g={};o.forEach(v=>{const u=Ae(v);if(!u)return;if(u.name.startsWith("ta_ans")){const l=u.name.replace("ta_","");g[l]=Pe(u.value);return}if(u.name.startsWith("opt_ans")||u.name.startsWith("tans_"))return;const x=Se(u.value);s.variables.push({name:u.name,type:x,value:u.value})}),n.querySelectorAll("questiontext file").forEach(v=>{var E;const u=v.getAttribute("name"),x=v.textContent,l=((E=u==null?void 0:u.split(".").pop())==null?void 0:E.toLowerCase())||"png",C={png:"image/png",jpg:"image/jpeg",jpeg:"image/jpeg",gif:"image/gif",svg:"image/svg+xml"}[l]||"image/png";s.images.push({name:u,data:`data:${C};base64,${x}`})});const c=n.querySelector("questiontext text");let y=(c==null?void 0:c.textContent)||"";const d=document.createElement("div");d.innerHTML=y;const m=d.querySelector(".stack-images");m&&m.remove();const b={};return d.querySelectorAll(".stack-part").forEach(v=>{const u=v.querySelector("p");if(u){const l=u.cloneNode(!0),R=l.querySelector("strong");R&&R.remove();let C=l.innerHTML.trim();const E=v.innerHTML.match(/\[\[input:(ans\d+)\]\]/);E&&(b[E[1]]=C)}const x=v.innerHTML.match(/\[\[jsxgraph[^\]]*\]\]([\s\S]*?)\[\[\/jsxgraph\]\]/);if(x){const l=v.innerHTML.match(/\[\[input:(ans\d+)\]\]/);l&&(b[l[1]+"_graphCode"]=x[1].trim())}v.remove()}),s.questionText=d.innerHTML.trim(),n.querySelectorAll("input").forEach(v=>{var E,te,ae,ne;const u=(E=v.querySelector("name"))==null?void 0:E.textContent,x=(te=v.querySelector("type"))==null?void 0:te.textContent;if((ae=v.querySelector("tans"))==null||ae.textContent,!u)return;const l={id:parseInt(u.replace("ans",""))||s.parts.length+1,type:p.NUMERICAL,text:b[u]||"",answer:u,options:[],grading:{...U},graphCode:b[u+"_graphCode"]||"",gradingCode:"",feedback:{}};x==="algebraic"?l.type=l.graphCode?p.JSXGRAPH:p.ALGEBRAIC:x==="numerical"?l.type=p.NUMERICAL:x==="units"?l.type=p.UNITS:x==="string"?l.type=p.STRING:x==="matrix"?l.type=p.MATRIX:(x==="radio"||x==="dropdown")&&(l.type=p.RADIO,g[u]&&(l.options=g[u]));const R=u.replace("ans","prt"),C=Array.from(n.querySelectorAll("prt")).find(A=>{var V;return((V=A.querySelector("name"))==null?void 0:V.textContent)===R});if(C){const A=((ne=C.querySelector("feedbackvariables text"))==null?void 0:ne.textContent)||"";(A.includes("all_correct")||A.includes("pt_checks"))&&(l.type=p.JSXGRAPH,l.gradingCode=A.trim()),(A.includes("is_p10")||A.includes("p10_ratio"))&&(l.grading.checkPowerOf10=!0),C.querySelectorAll("node").forEach(_=>{var se,ie,oe,ce,le,de,ue,pe;const D=(se=_.querySelector("name"))==null?void 0:se.textContent,j=(ie=_.querySelector("answertest"))==null?void 0:ie.textContent,X=(oe=_.querySelector("testoptions"))==null?void 0:oe.textContent,re=(le=(ce=_.querySelector("truefeedback text"))==null?void 0:ce.textContent)==null?void 0:le.trim(),F=(ue=(de=_.querySelector("falsefeedback text"))==null?void 0:de.textContent)==null?void 0:ue.trim();if((l.type===p.NUMERICAL||l.type===p.UNITS)&&((j==="ATNumAbs"||j==="ATUnits")&&(D==="0"&&(l.grading.wideTol=parseFloat(X)||.2,F&&(l.feedback.incorrect=F)),D==="1"&&(l.grading.tightTol=parseFloat(X)||.05,re&&(l.feedback.correct=re),F&&(l.feedback.closeButInaccurate=F))),j==="ATNumSigFigs"&&(l.grading.checkSigFigs=!0,l.grading.sigFigs=parseInt(X)||3,F&&(l.feedback.wrongSigFigs=F))),l.type===p.RADIO&&D==="0"){const ge=(pe=_.querySelector("tans"))==null?void 0:pe.textContent;if(ge&&l.options.length>0){const H=parseInt(ge)-1;H>=0&&H<l.options.length&&(l.options[H].correct=!0)}}})}s.parts.push(l)}),s.parts.sort((v,u)=>v.id-u.id),s}function Pe(a){try{const e=a.trim();if(!e.startsWith("["))return[];const n=[];if(!e.match(/\[([^\[\]]*(?:\[[^\]]*\][^\[\]]*)*)\]/))return[];const r=e.match(/\["([^"]*)",\s*(true|false)\]/g);return r?(r.forEach(s=>{const i=s.match(/\["([^"]*)",\s*(true|false)\]/);i&&n.push({value:i[1].replace(/\\"/g,'"'),correct:i[2]==="true"})}),n):[]}catch{return[]}}class _e{constructor(){this.listeners=[],this.data={name:"New STACK Question",questionText:"",variables:[],parts:[],images:[],generalFeedback:"",hints:[]},this.previewValues={}}subscribe(e){this.listeners.push(e)}notify(){this.listeners.forEach(e=>e(this.data,this.previewValues))}setState(e){this.data={...this.data,...e},this._ensureDefaults(),this.notify()}addVariable(e=null){const n=e||"v"+(this.data.variables.length+1);this.data.variables.push({name:n,type:"rand",value:"rand(10)"}),this.notify()}scanVariables(){const e=[this.data.questionText];this.data.parts.forEach(i=>{e.push(i.text||""),e.push(i.answer||"")});const t=e.join(" ").match(/\{@([a-zA-Z_][a-zA-Z0-9_]*)@\}/g)||[],r=[...new Set(t.map(i=>i.replace(/\{@|@\}/g,"")))];let s=0;return r.forEach(i=>{this.data.variables.find(o=>o.name===i)||(this.data.variables.push({name:i,type:"rand",value:"rand(10)"}),s++)}),s>0&&(this.generateSampleValues(),this.notify()),s}updateVariable(e,n,t){e>=0&&e<this.data.variables.length&&(this.data.variables[e][n]=t,this.notify())}removeVariable(e){e>=0&&e<this.data.variables.length&&(this.data.variables.splice(e,1),this.notify())}moveVariable(e,n){const t=parseInt(e)+n;if(t<0||t>=this.data.variables.length)return;const r=this.data.variables.splice(e,1)[0];this.data.variables.splice(t,0,r),this.generateSampleValues(),this.notify()}updateGeneral(e,n){this.data.name=e,this.data.questionText=n,this.notify()}updateGeneralFeedback(e){this.data.generalFeedback=e,this.notify()}addHint(e=""){this.data.hints||(this.data.hints=[]),this.data.hints.push(e||"Consider reviewing the relevant formula."),this.notify()}updateHint(e,n){this.data.hints&&e>=0&&e<this.data.hints.length&&(this.data.hints[e]=n,this.notify())}removeHint(e){this.data.hints&&e>=0&&e<this.data.hints.length&&(this.data.hints.splice(e,1),this.notify())}addImage(e){const n=this.data.images.findIndex(t=>t.name===e.name);n>=0?this.data.images[n]=e:this.data.images.push(e),this.notify()}removeImage(e){this.data.images.splice(e,1),this.notify()}addPart(){const e=this.data.parts.length+1;this.data.parts.push({id:e,type:"numerical",text:`Part ${String.fromCharCode(96+e)}:`,answer:"ans"+e,grading:{...U},options:[],graphCode:"",gradingCode:"",feedback:{}}),this.notify()}updatePart(e,n,t){e>=0&&e<this.data.parts.length&&(this.data.parts[e][n]=t,this.notify())}updatePartGrading(e,n,t){e>=0&&e<this.data.parts.length&&(this.data.parts[e].grading[n]=t,this.notify())}updatePartGradingBatch(e,n){e>=0&&e<this.data.parts.length&&(this.data.parts[e].grading={...this.data.parts[e].grading,...n},this.notify())}updatePartFeedback(e,n,t){e>=0&&e<this.data.parts.length&&(this.data.parts[e].feedback||(this.data.parts[e].feedback={}),this.data.parts[e].feedback[n]=t,this.notify())}addPartOption(e){this.data.parts[e].options||(this.data.parts[e].options=[]),this.data.parts[e].options.push({value:`Option ${this.data.parts[e].options.length+1}`,correct:!1}),this.notify()}updatePartOption(e,n,t){this.data.parts[e].options[n].value=t,this.notify()}setPartOptionCorrect(e,n){this.data.parts[e].options.forEach((t,r)=>t.correct=r===n),this.notify()}removePartOption(e,n){this.data.parts[e].options.splice(n,1),this.notify()}removePart(e){this.data.parts.splice(e,1),this._renumberParts(),this.notify()}loadFromJson(e){try{let n=JSON.parse(e);n=this._normalize(n),this.data=n,this.generateSampleValues(),this.notify()}catch(n){throw console.error(n),new Error("Failed to load JSON: "+n.message)}}loadFromXml(e){try{let n=Ie(e);n=this._normalize(n),this.data=n,this.generateSampleValues(),this.notify()}catch(n){throw console.error(n),new Error("Failed to load XML: "+n.message)}}loadTemplate(e){let n=JSON.parse(JSON.stringify(e));n=this._normalize(n),this.data=n;try{this.generateSampleValues()}catch(t){console.warn("Error generating samples during template load:",t)}this.notify()}generateSampleValues(){this.previewValues={},this.data.variables&&(this.data.variables.forEach(e=>{try{const n=Ee(e.type,e.value,this.previewValues);this.previewValues[e.name]=n}catch{this.previewValues[e.name]="[Error]"}}),this.notify())}_renumberParts(){this.data.parts.forEach((e,n)=>{const t=n+1;e.answer===`ans${e.id}`&&(e.answer=`ans${t}`),e.id=t})}_ensureDefaults(){this.data.images||(this.data.images=[]),this.data.variables||(this.data.variables=[]),this.data.parts||(this.data.parts=[]),this.data.hints||(this.data.hints=[]),this.data.generalFeedback===void 0&&(this.data.generalFeedback="")}_normalize(e){return e.images||(e.images=[]),e.variables||(e.variables=[]),e.parts||(e.parts=[]),e.hints||(e.hints=[]),e.generalFeedback===void 0&&(e.generalFeedback=""),e.variables.forEach(n=>{n.value&&(n.value=n.value.replace(/;+$/,"").trim(),n.value=n.value.replace(/(rand\s*\(\s*\[[^\]]+\]\s*\))\s*\[1\]/g,"$1"))}),e.parts=e.parts.map((n,t)=>{if(!n.grading)n.grading={...U};else for(const[r,s]of Object.entries(U))n.grading[r]===void 0&&(n.grading[r]=s);return n.options||(n.options=[]),n.graphCode||(n.graphCode=""),n.gradingCode||(n.gradingCode=""),n.feedback||(n.feedback={}),n.text||(n.text=`Part ${String.fromCharCode(97+t)}:`),n.id||(n.id=t+1),n.answer||(n.answer=`ans${n.id}`),n}),e}}function Fe(a,e,n){if(a){if(!e||e.length===0){a.innerHTML='<span style="font-size:0.8rem; color:#999;">No variables defined yet</span>';return}a.innerHTML=e.map(t=>`<button class="var-chip" data-insert="{@${t.name}@}" title="Insert {@${t.name}@}">
            {@${t.name}@}
        </button>`).join(""),a.querySelectorAll(".var-chip").forEach(t=>{t.addEventListener("click",()=>{n(t.dataset.insert)})})}}function qe(a,e,n,t){if(!a)return;let r="";e.forEach((s,i)=>{const o=n[s.name],g=o!==void 0?o:"—";r+=`
        <div class="var-item" data-index="${i}">
            <div class="var-row">
                <div class="var-controls">
                    <button class="move-btn move-up" data-idx="${i}" title="Move up">&uarr;</button>
                    <button class="move-btn move-down" data-idx="${i}" title="Move down">&darr;</button>
                </div>
                <input type="text" class="var-name" value="${J(s.name)}" placeholder="name" data-idx="${i}">
                <select class="var-type" data-idx="${i}">
                    <option value="rand" ${s.type==="rand"?"selected":""}>Random</option>
                    <option value="calc" ${s.type==="calc"?"selected":""}>Calculated</option>
                    <option value="algebraic" ${s.type==="algebraic"?"selected":""}>Algebraic</option>
                </select>
                <input type="text" class="var-val" value="${J(s.value)}" placeholder="expression" data-idx="${i}">
                <span class="var-preview" title="Preview value">${B(String(g))}</span>
                <button class="del-var danger-btn" data-idx="${i}" title="Delete variable">&times;</button>
            </div>
            ${s.type==="rand"?Le():""}
        </div>`}),r+=Re(),a.innerHTML=r,Me(a,t)}function Le(){return`<div class="var-hint">
        <small>Examples: <code>rand(10)+1</code> (1-10), <code>rand([2,3,5,7])</code> (from list), <code>rand_with_step(0,10,0.5)</code></small>
    </div>`}function Re(){const a=[{key:"random",label:"Random Values"},{key:"arithmetic",label:"Arithmetic"},{key:"trigonometry",label:"Trigonometry"},{key:"calculus",label:"Calculus"},{key:"linearAlgebra",label:"Linear Algebra"},{key:"units",label:"Units"},{key:"formatting",label:"Formatting"}];let e=`<div class="syntax-panel">
        <details>
            <summary>Maxima Syntax Reference & Examples</summary>
            <div class="syntax-categories">`;return a.forEach(n=>{const t=$e[n.key];t&&(e+=`<div class="syntax-category">
            <h4>${n.label}</h4>
            <table class="syntax-table">
                <tr><th>Syntax</th><th>Description</th><th>Example</th></tr>`,t.forEach(r=>{e+=`<tr>
                <td><code class="syntax-insert" data-value="${J(r.syntax)}">${B(r.syntax)}</code></td>
                <td>${B(r.description)}</td>
                <td><code>${B(r.example)}</code></td>
            </tr>`}),e+="</table></div>")}),e+="</div></details></div>",e}function Me(a,e){a.querySelectorAll(".var-name").forEach(n=>{n.addEventListener("change",()=>e.onUpdate(parseInt(n.dataset.idx),"name",n.value))}),a.querySelectorAll(".var-type").forEach(n=>{n.addEventListener("change",()=>e.onUpdate(parseInt(n.dataset.idx),"type",n.value))}),a.querySelectorAll(".var-val").forEach(n=>{n.addEventListener("change",()=>e.onUpdate(parseInt(n.dataset.idx),"value",n.value)),n.addEventListener("focus",()=>{e.onFocus&&e.onFocus(n)})}),a.querySelectorAll(".move-up").forEach(n=>{n.addEventListener("click",()=>e.onMove(parseInt(n.dataset.idx),-1))}),a.querySelectorAll(".move-down").forEach(n=>{n.addEventListener("click",()=>e.onMove(parseInt(n.dataset.idx),1))}),a.querySelectorAll(".del-var").forEach(n=>{n.addEventListener("click",()=>e.onDelete(parseInt(n.dataset.idx)))}),a.querySelectorAll(".syntax-insert").forEach(n=>{n.addEventListener("click",()=>{e.onSyntaxInsert&&e.onSyntaxInsert(n.dataset.value)}),n.style.cursor="pointer",n.title="Click to insert into last focused variable"})}function B(a){return a?a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function J(a){return a?a.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function W(a){return a?String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"):""}function ke(a){return!a&&a!==0?"":`<![CDATA[${String(a).replace(/\]\]>/g,"]]]]><![CDATA[>")}]]>`}function N(a){if(!a)return"";let e=a.replace(/\$\$([^$]+)\$\$/g,"\\[$1\\]");return e=e.replace(/\$([^$]+)\$/g,"\\($1\\)"),e}function k(a,e){return`<${a} format="html"><text>${W(e)}</text></${a}>`}function Oe(a,e){const n=a.feedback||{},t=a.gradingCode||"all_correct: true;";return`
      <feedbackvariables>
        <text>${ke(t)}</text>
      </feedbackvariables>
      <node>
        <name>0</name>
        <answertest>${$.ALG_EQUIV}</answertest>
        <sans>all_correct</sans>
        <tans>true</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>${h.SET}</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${e}-0-T</trueanswernote>
        ${k("truefeedback",n.correct||f.correct)}
        <falsescoremode>${h.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${e}-0-F</falseanswernote>
        ${k("falsefeedback",n.incorrect||"Incorrect. Please check your graph.")}
      </node>`}const z={pointPlacement:(a,e,n)=>`
/* Point Placement Grading — Auto-generated */
/* Check that student placed the correct number of points */
correct_count: is(length(${a}) = ${e});

/* Check each point is within tolerance of the expected position */
tolerance: ${n||5};
pt_checks: makelist(
    if is(abs(${a}[i][1] - correct_points[i][1]) < tolerance) and
       is(abs(${a}[i][2] - correct_points[i][2]) < tolerance) then 1 else 0,
    i, 1, ${e}
);

/* All points must be correct */
num_correct: apply("+", pt_checks);
all_correct: correct_count and is(num_correct = ${e});
`,functionSketch:(a,e)=>`
/* Function Sketch Grading — Auto-generated */
/* Student draws a function; check key points match expected curve */
tolerance: ${e||3};

/* Compare student points to expected function values */
pt_checks: makelist(
    is(abs(${a}[i][2] - expected_y[i]) < tolerance),
    i, 1, length(${a})
);

num_correct: apply("+", makelist(if pt_checks[i] then 1 else 0, i, 1, length(pt_checks)));
all_correct: is(num_correct >= floor(0.8 * length(pt_checks)));
`,vectorDraw:(a,e)=>`
/* Vector Drawing Grading — Auto-generated */
tolerance: ${e||2};

/* Check vector components (stored as [startX, startY, endX, endY]) */
dx_student: ${a}[3] - ${a}[1];
dy_student: ${a}[4] - ${a}[2];

dx_correct: expected_vector[1];
dy_correct: expected_vector[2];

all_correct: is(abs(dx_student - dx_correct) < tolerance) and
             is(abs(dy_student - dy_correct) < tolerance);
`};function Ne(a,e,n,t){if(a){if(e.length===0){a.innerHTML='<p class="empty-state">No parts yet. Click "+ Add Part" to create an answer input.</p>';return}a.innerHTML=e.map((r,s)=>Ge(r,s,n)).join(""),He(a,e,t)}}function Ge(a,e,n){const t=String.fromCharCode(97+e);return n.filter(r=>r.name.startsWith("ans")).map(r=>r.name),`
    <div class="part-card" data-part-idx="${e}">
        <div class="part-header">
            <span class="part-label">Part (${t})</span>
            <div class="part-header-controls">
                <select class="part-type" data-idx="${e}">
                    <option value="numerical" ${a.type==="numerical"?"selected":""}>Numerical</option>
                    <option value="algebraic" ${a.type==="algebraic"?"selected":""}>Algebraic</option>
                    <option value="units" ${a.type==="units"?"selected":""}>Units</option>
                    <option value="radio" ${a.type==="radio"?"selected":""}>Multiple Choice</option>
                    <option value="matrix" ${a.type==="matrix"?"selected":""}>Matrix</option>
                    <option value="string" ${a.type==="string"?"selected":""}>Text/String</option>
                    <option value="jsxgraph" ${a.type==="jsxgraph"?"selected":""}>Interactive Graph</option>
                </select>
                <button class="del-part danger-btn" data-idx="${e}" title="Delete part">&times;</button>
            </div>
        </div>
        <div class="part-body">
            <div class="form-group">
                <label>Part Text / Instruction</label>
                <textarea class="part-text" rows="2" data-idx="${e}" placeholder="What should the student calculate?">${Q(a.text||"")}</textarea>
            </div>
            <div class="form-group">
                <label>Answer Variable <span class="tooltip" title="The variable holding the correct answer (must be defined in Variables section)">?</span></label>
                <input type="text" class="part-ans" value="${I(a.answer||"")}" data-idx="${e}" placeholder="e.g., ans1">
            </div>

            ${Ue(a,e)}
            ${je(a,e)}
            ${Xe(a,e)}
        </div>
    </div>`}function Ue(a,e){switch(a.type){case p.RADIO:return Be(a,e);case p.JSXGRAPH:return Ve(a,e);case p.STRING:return De(a,e);default:return""}}function Be(a,e){const n=a.options||[];let t=`<div class="mcq-section">
        <label>Options</label>`;return n.forEach((r,s)=>{t+=`
        <div class="mcq-option">
            <input type="radio" name="correct-${e}" class="opt-correct" data-part="${e}" data-opt="${s}"
                ${r.correct?"checked":""} title="Mark as correct">
            <input type="text" class="opt-val" value="${I(r.value)}" data-part="${e}" data-opt="${s}" placeholder="Option text">
            <button class="del-opt danger-btn" data-part="${e}" data-opt="${s}" title="Remove">&times;</button>
        </div>`}),t+=`<button class="add-opt small-btn" data-idx="${e}">+ Add Option</button>
    </div>`,t}function Ve(a,e){return`
    <div class="jsxgraph-section">
        <div class="form-group">
            <label>Graph Type Preset</label>
            <select class="graph-preset" data-idx="${e}">
                <option value="">-- Custom Code --</option>
                <option value="pointPlacement">Point Placement (students place points)</option>
                <option value="functionSketch">Function Sketch (students draw curve)</option>
                <option value="vectorDraw">Vector Drawing</option>
            </select>
        </div>
        <div class="form-group">
            <label>Client-Side JavaScript (Graph Setup)
                <span class="tooltip" title="This code runs in the student's browser to create the interactive graph. Use 'divid' for the board container and 'ansXRef' to reference the hidden input.">?</span>
            </label>
            <textarea class="graph-code" rows="12" data-idx="${e}" placeholder="var board = JXG.JSXGraph.initBoard(divid, {...});">${Q(a.graphCode||"")}</textarea>
        </div>
        <div class="form-group">
            <label>Server-Side Maxima (Grading Logic)
                <span class="tooltip" title="This Maxima code runs on the server to grade the student's graph answer. Must set 'all_correct' to true/false.">?</span>
            </label>
            <textarea class="grading-code" rows="8" data-idx="${e}" placeholder="/* Must set all_correct: true or false */&#10;all_correct: true;">${Q(a.gradingCode||"")}</textarea>
        </div>
    </div>`}function De(a,e){var t;const n=((t=a.grading)==null?void 0:t.caseSensitive)!==!1;return`
    <div class="string-section">
        <label>
            <input type="checkbox" class="case-sensitive" data-idx="${e}" ${n?"checked":""}>
            Case-sensitive matching
        </label>
    </div>`}function je(a,e){if(a.type==="radio"||a.type==="string"||a.type==="jsxgraph")return"";const n=a.grading||{};return`
    <div class="grading-section">
        <h4>Grading Configuration</h4>
        <div class="grading-presets">
            <label>Quick Preset:</label>
            <select class="grading-preset" data-idx="${e}">
                <option value="">-- Custom --</option>
                ${Object.entries(ye).map(([r,s])=>`<option value="${r}" title="${s.description}">${s.label}</option>`).join("")}
            </select>
        </div>

        <div class="grading-pipeline">
            <div class="pipeline-step active">
                <div class="step-icon">1</div>
                <div class="step-content">
                    <strong>Wide Tolerance</strong> (Partial Credit: 50%)
                    <div class="grading-inputs">
                        <label>Tolerance: <input type="number" class="g-wide-tol" value="${n.wideTol||.2}" step="0.01" min="0" data-idx="${e}"></label>
                    </div>
                </div>
            </div>

            <div class="pipeline-step active">
                <div class="step-icon">2</div>
                <div class="step-content">
                    <strong>Tight Tolerance</strong> (Full Credit: 100%)
                    <div class="grading-inputs">
                        <label>Tolerance: <input type="number" class="g-tight-tol" value="${n.tightTol||.05}" step="0.01" min="0" data-idx="${e}"></label>
                    </div>
                </div>
            </div>

            <div class="pipeline-step secondary-step">
                <div class="step-icon">3</div>
                <div class="step-content">
                    <label>
                        <input type="checkbox" class="g-check-sigfigs" data-idx="${e}" ${n.checkSigFigs?"checked":""}>
                        <strong>Check Significant Figures</strong>
                    </label>
                    <div class="grading-inputs ${n.checkSigFigs?"":"hidden"}">
                        <label>Required sig figs: <input type="number" class="g-sigfigs" value="${n.sigFigs||3}" min="1" max="10" data-idx="${e}"></label>
                        <label>Penalty: <input type="number" class="g-penalty" value="${n.penalty||.1}" step="0.05" min="0" max="1" data-idx="${e}"></label>
                    </div>
                </div>
            </div>

            <div class="pipeline-step check-step">
                <div class="step-icon">4</div>
                <div class="step-content">
                    <label>
                        <input type="checkbox" class="g-check-p10" data-idx="${e}" ${n.checkPowerOf10?"checked":""}>
                        <strong>Power of 10 Check</strong>
                        <span class="tooltip" title="Detects if the student's answer is off by a factor of 10 (common unit conversion error)">?</span>
                    </label>
                    <div class="grading-inputs ${n.checkPowerOf10?"":"hidden"}">
                        <label>Penalty: <input type="number" class="g-p10-penalty" value="${n.powerOf10Penalty||.5}" step="0.1" min="0" max="1" data-idx="${e}"></label>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function Xe(a,e){const n=a.feedback||{};return`
    <details class="feedback-section">
        <summary>Custom Feedback Messages (optional)</summary>
        <div class="feedback-fields">
            <div class="form-group">
                <label>Correct answer feedback</label>
                <input type="text" class="fb-correct" value="${I(n.correct||"")}" data-idx="${e}"
                    placeholder="${f.correct}">
            </div>
            <div class="form-group">
                <label>Incorrect answer feedback</label>
                <input type="text" class="fb-incorrect" value="${I(n.incorrect||"")}" data-idx="${e}"
                    placeholder="${f.incorrect}">
            </div>
            ${a.type==="numerical"||a.type==="units"?`
            <div class="form-group">
                <label>Close but inaccurate feedback</label>
                <input type="text" class="fb-close" value="${I(n.closeButInaccurate||"")}" data-idx="${e}"
                    placeholder="${f.closeButInaccurate}">
            </div>
            <div class="form-group">
                <label>Wrong significant figures feedback</label>
                <input type="text" class="fb-sigfigs" value="${I(n.wrongSigFigs||"")}" data-idx="${e}"
                    placeholder="${f.wrongSigFigs}">
            </div>
            <div class="form-group">
                <label>Power of 10 error feedback</label>
                <input type="text" class="fb-p10" value="${I(n.powerOf10Error||"")}" data-idx="${e}"
                    placeholder="${f.powerOf10Error}">
            </div>
            `:""}
        </div>
    </details>`}function He(a,e,n){a.querySelectorAll(".part-type").forEach(t=>{t.addEventListener("change",()=>n.onUpdatePart(parseInt(t.dataset.idx),"type",t.value))}),a.querySelectorAll(".part-text").forEach(t=>{t.addEventListener("input",()=>n.onUpdatePart(parseInt(t.dataset.idx),"text",t.value))}),a.querySelectorAll(".part-ans").forEach(t=>{t.addEventListener("change",()=>n.onUpdatePart(parseInt(t.dataset.idx),"answer",t.value))}),a.querySelectorAll(".del-part").forEach(t=>{t.addEventListener("click",()=>n.onDeletePart(parseInt(t.dataset.idx)))}),a.querySelectorAll(".grading-preset").forEach(t=>{t.addEventListener("change",()=>{const r=ye[t.value];r&&n.onGradingBatch(parseInt(t.dataset.idx),r)})}),a.querySelectorAll(".g-tight-tol").forEach(t=>{t.addEventListener("change",()=>n.onGrading(parseInt(t.dataset.idx),"tightTol",parseFloat(t.value)))}),a.querySelectorAll(".g-wide-tol").forEach(t=>{t.addEventListener("change",()=>n.onGrading(parseInt(t.dataset.idx),"wideTol",parseFloat(t.value)))}),a.querySelectorAll(".g-check-sigfigs").forEach(t=>{t.addEventListener("change",()=>{n.onGrading(parseInt(t.dataset.idx),"checkSigFigs",t.checked)})}),a.querySelectorAll(".g-sigfigs").forEach(t=>{t.addEventListener("change",()=>n.onGrading(parseInt(t.dataset.idx),"sigFigs",parseInt(t.value)))}),a.querySelectorAll(".g-penalty").forEach(t=>{t.addEventListener("change",()=>n.onGrading(parseInt(t.dataset.idx),"penalty",parseFloat(t.value)))}),a.querySelectorAll(".g-check-p10").forEach(t=>{t.addEventListener("change",()=>{n.onGrading(parseInt(t.dataset.idx),"checkPowerOf10",t.checked)})}),a.querySelectorAll(".g-p10-penalty").forEach(t=>{t.addEventListener("change",()=>n.onGrading(parseInt(t.dataset.idx),"powerOf10Penalty",parseFloat(t.value)))}),a.querySelectorAll(".case-sensitive").forEach(t=>{t.addEventListener("change",()=>n.onGrading(parseInt(t.dataset.idx),"caseSensitive",t.checked))}),a.querySelectorAll(".add-opt").forEach(t=>{t.addEventListener("click",()=>n.onAddOption(parseInt(t.dataset.idx)))}),a.querySelectorAll(".opt-correct").forEach(t=>{t.addEventListener("change",()=>n.onSetCorrect(parseInt(t.dataset.part),parseInt(t.dataset.opt)))}),a.querySelectorAll(".opt-val").forEach(t=>{t.addEventListener("change",()=>n.onUpdateOption(parseInt(t.dataset.part),parseInt(t.dataset.opt),t.value))}),a.querySelectorAll(".del-opt").forEach(t=>{t.addEventListener("click",()=>n.onDeleteOption(parseInt(t.dataset.part),parseInt(t.dataset.opt)))}),a.querySelectorAll(".graph-code").forEach(t=>{t.addEventListener("input",()=>n.onUpdatePart(parseInt(t.dataset.idx),"graphCode",t.value))}),a.querySelectorAll(".grading-code").forEach(t=>{t.addEventListener("input",()=>n.onUpdatePart(parseInt(t.dataset.idx),"gradingCode",t.value))}),a.querySelectorAll(".graph-preset").forEach(t=>{t.addEventListener("change",()=>{t.value&&n.onGraphPreset&&n.onGraphPreset(parseInt(t.dataset.idx),t.value)})}),a.querySelectorAll(".fb-correct").forEach(t=>{t.addEventListener("change",()=>n.onFeedback(parseInt(t.dataset.idx),"correct",t.value))}),a.querySelectorAll(".fb-incorrect").forEach(t=>{t.addEventListener("change",()=>n.onFeedback(parseInt(t.dataset.idx),"incorrect",t.value))}),a.querySelectorAll(".fb-close").forEach(t=>{t.addEventListener("change",()=>n.onFeedback(parseInt(t.dataset.idx),"closeButInaccurate",t.value))}),a.querySelectorAll(".fb-sigfigs").forEach(t=>{t.addEventListener("change",()=>n.onFeedback(parseInt(t.dataset.idx),"wrongSigFigs",t.value))}),a.querySelectorAll(".fb-p10").forEach(t=>{t.addEventListener("change",()=>n.onFeedback(parseInt(t.dataset.idx),"powerOf10Error",t.value))})}function Q(a){return a?a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function I(a){return a?a.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function ze(a,e,n,t,r){if(!a)return;const s=Je(t,r);n&&(s.length>0?(n.innerHTML=s.map(c=>`<div class="warning-item ${c.level}">${q(c.message)}</div>`).join(""),n.classList.remove("hidden")):(n.innerHTML="",n.classList.add("hidden")));let i=G(t.questionText||"",r,t.images||[]),o="";(t.parts||[]).forEach((c,y)=>{const d=String.fromCharCode(97+y),m=G(c.text||"",r,t.images||[]);if(o+=`<div class="preview-part">
            <p><strong>(${d})</strong> ${m}</p>`,c.type==="radio"&&c.options)o+='<div class="preview-mcq">',c.options.forEach((b,L)=>{o+=`<label class="preview-radio">
                    <input type="radio" name="preview-${y}" disabled>
                    ${q(b.value)} ${b.correct?'<span class="correct-badge">&#10003;</span>':""}
                </label>`}),o+="</div>";else if(c.type==="jsxgraph")o+='<div class="preview-graph-placeholder">[Interactive Graph]</div>';else if(c.type==="matrix")o+='<div class="preview-input"><input type="text" disabled placeholder="matrix([[1,2],[3,4]])"></div>';else{const b=c.type==="units"?"e.g., 5.2 m/s":c.type==="string"?"Type answer...":"Numerical answer";o+=`<div class="preview-input"><input type="text" disabled placeholder="${b}"></div>`}o+="</div>"});let g="";t.generalFeedback&&(g=`<details class="preview-feedback">
            <summary>Worked Solution (shown after attempts)</summary>
            <div>${G(t.generalFeedback,r,t.images||[])}</div>
        </details>`);let w="";t.hints&&t.hints.length>0&&(w=`<details class="preview-hints">
            <summary>Hints (${t.hints.length})</summary>
            <ol>${t.hints.map(c=>`<li>${G(c,r,t.images||[])}</li>`).join("")}</ol>
        </details>`),a.innerHTML=i+o+g+w,e&&(e.innerHTML=Object.entries(r).map(([c,y])=>`<li><span class="var-tag">${q(c)}</span> <span class="equals">=</span> <span class="var-val-display">${q(String(y))}</span></li>`).join("")),window.MathJax&&window.MathJax.typesetPromise&&window.MathJax.typesetPromise([a]).catch(()=>{})}function G(a,e,n){if(!a)return"";let t=a;return t=t.replace(/\{@([a-zA-Z_][a-zA-Z0-9_]*)@\}/g,(r,s)=>e[s]!==void 0?`<span class="substituted-var" title="${q(s)}">${e[s]}</span>`:`<span class="undefined-var" title="Undefined variable">${r}</span>`),n.forEach(r=>{const s=new RegExp(`@@${r.name}@@`,"g");t=t.replace(s,`<img src="${r.data}" alt="${q(r.name)}" style="max-width:100%">`)}),t}function Je(a,e){const n=[],r=[a.questionText||"",...(a.parts||[]).map(i=>i.text||"")].join(" ").match(/\{@([a-zA-Z_][a-zA-Z0-9_]*)@\}/g)||[],s=new Set(Object.keys(e));return r.forEach(i=>{const o=i.replace(/\{@|@\}/g,"");s.has(o)||n.push({level:"warning",message:`Variable "${o}" is referenced but not defined.`})}),Object.entries(e).forEach(([i,o])=>{(o==="[Error]"||o==="[Calc Error]")&&n.push({level:"error",message:`Variable "${i}" has a calculation error. Check the expression.`})}),n}function q(a){return a?String(a).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function We(a,e,n){if(a){if(!e||e.length===0){a.innerHTML="";return}a.innerHTML=e.map((t,r)=>`
        <div class="image-card">
            <img src="${t.data}" alt="${Z(t.name)}" title="${Z(t.name)}">
            <div class="image-actions">
                <small>${Y(t.name)}</small>
                <button class="del-img danger-btn" data-idx="${r}" title="Remove">&times;</button>
            </div>
            <div class="image-ref">
                <code>@@${Y(t.name)}@@</code>
                <small>Use in question text to embed</small>
            </div>
        </div>
    `).join(""),a.querySelectorAll(".del-img").forEach(t=>{t.addEventListener("click",()=>n(parseInt(t.dataset.idx)))})}}function Qe(a,e,n){if(!a)return;a.innerHTML=`
    <div class="form-group">
        <label>Worked Solution / General Feedback
            <span class="tooltip" title="Shown to students after all attempts are used. Include step-by-step solution.">?</span>
        </label>
        <textarea id="general-feedback" rows="4" placeholder="Step 1: Apply the formula...&#10;Step 2: Substitute values...&#10;Step 3: Calculate the result...">${Y(e||"")}</textarea>
    </div>`;const t=a.querySelector("#general-feedback");t&&t.addEventListener("input",()=>n(t.value))}function Ye(a,e,n){var r;if(!a)return;let t="<label>Hints (shown on retry attempts)</label>";e&&e.length>0&&e.forEach((s,i)=>{t+=`
            <div class="hint-item">
                <span class="hint-label">Hint ${i+1}:</span>
                <input type="text" class="hint-text" value="${Z(s)}" data-idx="${i}" placeholder="Try reviewing the formula for...">
                <button class="del-hint danger-btn" data-idx="${i}">&times;</button>
            </div>`}),t+='<button class="add-hint small-btn">+ Add Hint</button>',a.innerHTML=t,a.querySelectorAll(".hint-text").forEach(s=>{s.addEventListener("change",()=>n.onUpdate(parseInt(s.dataset.idx),s.value))}),a.querySelectorAll(".del-hint").forEach(s=>{s.addEventListener("click",()=>n.onRemove(parseInt(s.dataset.idx)))}),(r=a.querySelector(".add-hint"))==null||r.addEventListener("click",()=>n.onAdd())}function Y(a){return a?a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}function Z(a){return a?a.replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"):""}class Ze{constructor(e){this.state=e,this.lastFocusedVarInput=null,this.els={qName:document.getElementById("q-name"),qText:document.getElementById("q-text"),varList:document.getElementById("variables-list"),partList:document.getElementById("parts-list"),previewBox:document.getElementById("preview-box"),liveVars:document.getElementById("live-vars"),templateSelect:document.getElementById("template-select"),diagnostics:document.getElementById("diagnostics"),validationBox:document.getElementById("validation-warnings"),imgInput:document.getElementById("img-input"),dropZone:document.getElementById("drop-zone"),imageList:document.getElementById("image-list"),toolbar:document.getElementById("toolbar-vars"),feedbackEditor:document.getElementById("feedback-editor"),hintsEditor:document.getElementById("hints-editor")}}init(){this._initMathJaxCheck(),this._initGeneralEvents(),this._initToolbarEvents(),this._initImageEvents()}render(e,n){this.els.qName&&this.els.qName.value!==e.name&&(this.els.qName.value=e.name||""),this.els.qText&&this.els.qText.value!==e.questionText&&(this.els.qText.value=e.questionText||""),Fe(this.els.toolbar,e.variables,t=>this.insertAtCursor(t)),qe(this.els.varList,e.variables,n,{onUpdate:(t,r,s)=>this.state.updateVariable(t,r,s),onMove:(t,r)=>this.state.moveVariable(t,r),onDelete:t=>this.state.removeVariable(t),onFocus:t=>{this.lastFocusedVarInput=t},onSyntaxInsert:t=>this._insertIntoVarField(t)}),Ne(this.els.partList,e.parts,e.variables,{onUpdatePart:(t,r,s)=>this.state.updatePart(t,r,s),onDeletePart:t=>this.state.removePart(t),onGrading:(t,r,s)=>this.state.updatePartGrading(t,r,s),onGradingBatch:(t,r)=>this.state.updatePartGradingBatch(t,r),onFeedback:(t,r,s)=>this.state.updatePartFeedback(t,r,s),onAddOption:t=>this.state.addPartOption(t),onUpdateOption:(t,r,s)=>this.state.updatePartOption(t,r,s),onSetCorrect:(t,r)=>this.state.setPartOptionCorrect(t,r),onDeleteOption:(t,r)=>this.state.removePartOption(t,r),onGraphPreset:(t,r)=>this._applyGraphPreset(t,r)}),We(this.els.imageList,e.images,t=>this.state.removeImage(t)),Qe(this.els.feedbackEditor,e.generalFeedback,t=>this.state.updateGeneralFeedback(t)),Ye(this.els.hintsEditor,e.hints,{onAdd:()=>this.state.addHint(),onUpdate:(t,r)=>this.state.updateHint(t,r),onRemove:t=>this.state.removeHint(t)}),ze(this.els.previewBox,this.els.liveVars,this.els.validationBox,e,n)}insertAtCursor(e){const n=document.activeElement;n&&(n.tagName==="TEXTAREA"||n.tagName==="INPUT")?this._insertIntoField(n,e):this.els.qText&&this._insertIntoField(this.els.qText,e)}_insertIntoField(e,n){const t=e.selectionStart,r=e.selectionEnd;e.value=e.value.substring(0,t)+n+e.value.substring(r),e.selectionStart=e.selectionEnd=t+n.length,e.focus(),e.dispatchEvent(new Event("input"))}_insertIntoVarField(e){this.lastFocusedVarInput&&this._insertIntoField(this.lastFocusedVarInput,e)}_applyGraphPreset(e,n){var o;const t=this.state.data.parts[e];if(!t)return;const r=t.answer||"ans1",s=Ke(n,r),i=((o=z[n])==null?void 0:o.call(z,r,5,5))||"";this.state.updatePart(e,"graphCode",s),this.state.updatePart(e,"gradingCode",i)}_initMathJaxCheck(){setTimeout(()=>{this.els.diagnostics&&(window.MathJax?this.els.diagnostics.classList.add("hidden"):(this.els.diagnostics.innerHTML="<strong>Warning:</strong> MathJax not loaded. Math rendering may not work.",this.els.diagnostics.classList.remove("hidden")))},3e3)}_initGeneralEvents(){this.els.qName&&this.els.qName.addEventListener("input",()=>{var e;this.state.updateGeneral(this.els.qName.value,((e=this.els.qText)==null?void 0:e.value)||"")}),this.els.qText&&this.els.qText.addEventListener("input",()=>{var e;this.state.updateGeneral(((e=this.els.qName)==null?void 0:e.value)||"",this.els.qText.value)})}_initToolbarEvents(){const e=document.getElementById("q-text-toolbar");e&&e.addEventListener("click",t=>{const r=t.target.closest(".tool-btn");r&&r.dataset.insert&&this.insertAtCursor(r.dataset.insert)}),document.querySelectorAll(".syntax-btn").forEach(t=>{t.addEventListener("click",()=>{this._insertIntoVarField(t.dataset.insert)})})}_initImageEvents(){const e=this.els.dropZone,n=this.els.imgInput;e&&(e.addEventListener("click",()=>n==null?void 0:n.click()),e.addEventListener("dragover",t=>{t.preventDefault(),e.classList.add("drag-over")}),e.addEventListener("dragleave",()=>e.classList.remove("drag-over")),e.addEventListener("drop",t=>{t.preventDefault(),e.classList.remove("drag-over"),t.dataTransfer.files.length>0&&this._processImageFile(t.dataTransfer.files[0])})),n&&n.addEventListener("change",()=>{n.files.length>0&&(this._processImageFile(n.files[0]),n.value="")})}_processImageFile(e){const n=new FileReader;n.onload=t=>{this.state.addImage({name:e.name,data:t.target.result})},n.readAsDataURL(e)}}function Ke(a,e){const n=`${e}Ref`;switch(a){case"pointPlacement":return`var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-5, 70, 65, -70],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

board.create('text', [62, -5, 't'], {fontSize: 14});
board.create('text', [-3, 65, 'f(t)'], {fontSize: 14});

var studentPoints = [];

board.on('down', function(e) {
    var coords = board.getUsrCoordsOfMouse(e);
    var x = Math.round(coords[0]);
    var y = Math.round(coords[1]);

    if (studentPoints.length < 5) {
        var p = board.create('point', [x, y], {
            name: '(' + x + ',' + y + ')',
            size: 4, face: 'o', strokeColor: '#2563eb', fillColor: '#2563eb'
        });
        studentPoints.push(p);

        if (studentPoints.length > 1) {
            board.create('segment',
                [studentPoints[studentPoints.length-2], studentPoints[studentPoints.length-1]],
                {strokeColor: '#ef4444', strokeWidth: 2}
            );
        }
        updateAnswer();
    }
});

function updateAnswer() {
    var arr = [];
    for (var i = 0; i < studentPoints.length; i++) {
        arr.push('[' + studentPoints[i].X().toFixed(0) + ',' + studentPoints[i].Y().toFixed(0) + ']');
    }
    var el = document.getElementById(${n});
    if(el) el.value = '[' + arr.join(',') + ']';
}

board.create('button', [5, 60, 'Reset', function() {
    JXG.JSXGraph.freeBoard(board);
    board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-5, 70, 65, -70],
        axis: true, showNavigation: true, showCopyright: false, grid: true
    });
    studentPoints = [];
    var el = document.getElementById(${n});
    if(el) el.value = '';
}]);`;case"functionSketch":return`var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-2, 12, 12, -2],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

var points = [];
var curve = null;

board.on('down', function(e) {
    var coords = board.getUsrCoordsOfMouse(e);
    var x = Math.round(coords[0] * 2) / 2;
    var y = Math.round(coords[1] * 2) / 2;

    var p = board.create('point', [x, y], {
        size: 3, face: 'o', strokeColor: '#2563eb', fillColor: '#2563eb'
    });
    points.push(p);

    if (points.length > 1 && curve) board.removeObject(curve);
    if (points.length > 1) {
        curve = board.create('spline', points, {strokeColor: '#ef4444', strokeWidth: 2});
    }
    updateAnswer();
});

function updateAnswer() {
    var arr = [];
    for (var i = 0; i < points.length; i++) {
        arr.push('[' + points[i].X().toFixed(1) + ',' + points[i].Y().toFixed(1) + ']');
    }
    var el = document.getElementById(${n});
    if(el) el.value = '[' + arr.join(',') + ']';
}`;case"vectorDraw":return`var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-10, 10, 10, -10],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

var startPt = board.create('point', [0, 0], {
    name: 'Start', size: 4, strokeColor: '#2563eb', fillColor: '#2563eb'
});
var endPt = board.create('point', [3, 4], {
    name: 'End', size: 4, strokeColor: '#ef4444', fillColor: '#ef4444'
});

board.create('arrow', [startPt, endPt], {strokeWidth: 3, strokeColor: '#10b981'});

function updateAnswer() {
    var el = document.getElementById(${n});
    if(el) el.value = '[' + startPt.X().toFixed(1) + ',' + startPt.Y().toFixed(1) + ',' +
                             endPt.X().toFixed(1) + ',' + endPt.Y().toFixed(1) + ']';
}

startPt.on('drag', updateAnswer);
endPt.on('drag', updateAnswer);
updateAnswer();`;default:return"// Custom graph code here"}}function et(a){const e=a.parts||[],n=e.map(i=>{let o='<div class="stack-part">';const g=String.fromCharCode(96+i.id);return o+=`<p><strong>(${g})</strong> ${N(i.text||"")}</p>`,i.type==="jsxgraph"?o+=`<div class="jsxgraph-box">
[[jsxgraph input-ref-${i.answer}="${i.answer}Ref" width="500px" height="400px"]]
${i.graphCode||""}
[[/jsxgraph]]
</div>
<p style="display:none">[[input:${i.answer}]] [[validation:${i.answer}]]</p>`:o+=`<div>[[input:${i.answer}]] [[validation:${i.answer}]]</div>`,o+="</div>",o}).join(`

`),t=(a.images||[]).map(i=>{const o=i.data.includes(",")?i.data.split(",")[1]:i.data;return`      <file name="${W(i.name)}" encoding="base64">${o}</file>`}).join(`
`),r=a.generalFeedback||"",s=(a.hints||[]).map(i=>`
    <hint format="html">
      <text><![CDATA[${N(i)}]]></text>
    </hint>`).join("");return`<?xml version="1.0" encoding="UTF-8"?>
<quiz>
  <question type="stack">
    <name><text>${W(a.name||"Untitled Question")}</text></name>
    <questiontext format="html">
      <text><![CDATA[${N(a.questionText||"")}

${n}]]></text>
${t}
    </questiontext>

    <generalfeedback format="html">
      <text><![CDATA[${N(r)}]]></text>
    </generalfeedback>
    <defaultgrade>${e.length||1}</defaultgrade>
    <penalty>0.1</penalty>
    <hidden>0</hidden>
${s}`}function tt(a){a.options.findIndex(n=>n.correct)+1;const e=`ta_${a.answer}`;return`
    <input>
      <name>${a.answer}</name>
      <type>radio</type>
      <tans>${e}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`}function at(a){const e=a.options.map(n=>`["${n.value.replace(/"/g,'\\"')}", ${n.correct?"true":"false"}]`);return`ta_${a.answer}: [${e.join(", ")}]`}function nt(a){const e=[];(a.variables||[]).forEach(t=>{let r=(t.value||"").trim();r.endsWith(";")||(r+=";"),e.push(`${t.name}: ${r}`)}),(a.parts||[]).forEach(t=>{t.type===p.RADIO&&t.options&&t.options.length>0&&e.push(at(t)+";")}),(a.parts||[]).forEach(t=>{var r;(r=t.grading)!=null&&r.checkPowerOf10&&t.answer&&e.push(`tans_${t.answer}: ${t.answer};`)});const n=e.join(`
`);return`
    <questionvariables>
      <text>${ke(n)}</text>
    </questionvariables>`}function rt(a){return`
    <input>
      <name>${a.answer}</name>
      <type>numerical</type>
      <tans>${a.answer}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>0</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>1</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>3</showvalidation>
      <options></options>
    </input>`}function fe(a){return`
    <input>
      <name>${a.answer}</name>
      <type>algebraic</type>
      <tans>${a.answer}</tans>
      <boxsize>20</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>1</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>3</showvalidation>
      <options></options>
    </input>`}function st(a){return`
    <input>
      <name>${a.answer}</name>
      <type>units</type>
      <tans>${a.answer}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>1</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>0</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>1</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>3</showvalidation>
      <options></options>
    </input>`}function it(a){return`
    <input>
      <name>${a.answer}</name>
      <type>matrix</type>
      <tans>${a.answer}</tans>
      <boxsize>5</boxsize>
      <strictsyntax>1</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>1</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>3</showvalidation>
      <options></options>
    </input>`}function ot(a){return`
    <input>
      <name>${a.answer}</name>
      <type>string</type>
      <tans>${a.answer}</tans>
      <boxsize>20</boxsize>
      <strictsyntax>0</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>1</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>1</mustverify>
      <showvalidation>1</showvalidation>
      <options></options>
    </input>`}function ct(a){return`
    <input>
      <name>${a.answer}</name>
      <type>algebraic</type>
      <tans>${a.answer}</tans>
      <boxsize>15</boxsize>
      <strictsyntax>0</strictsyntax>
      <insertstars>0</insertstars>
      <syntaxhint></syntaxhint>
      <syntaxattribute>0</syntaxattribute>
      <forbidwords></forbidwords>
      <allowwords></allowwords>
      <forbidfloat>0</forbidfloat>
      <requirelowestterms>0</requirelowestterms>
      <checkanswertype>0</checkanswertype>
      <mustverify>0</mustverify>
      <showvalidation>0</showvalidation>
      <options></options>
    </input>`}function lt(a){switch(a.type){case p.NUMERICAL:return rt(a);case p.ALGEBRAIC:return fe(a);case p.UNITS:return st(a);case p.RADIO:return tt(a);case p.MATRIX:return it(a);case p.STRING:return ot(a);case p.JSXGRAPH:return ct(a);default:return fe(a)}}function dt(a,e){const n=a.grading,t=a.feedback||{},r=a.answer;let s="",i="";const o=n.wideTol>0&&n.tightTol>=0&&n.wideTol>n.tightTol,g=n.checkSigFigs&&n.sigFigs>0,w=n.checkPowerOf10;if(w&&(s=`
      <feedbackvariables>
        <text><![CDATA[
/* Power of 10 detection: check if student is off by factor of 10 or 0.1 */
p10_safe_tans: if is(tans_${r} = 0) then 1 else tans_${r};
p10_ratio: ${r} / p10_safe_tans;
is_p10_high: is(abs(p10_ratio - 10) < 1);
is_p10_low: is(abs(p10_ratio - 0.1) < 0.01);
is_p10_error: is_p10_high or is_p10_low;
]]></text>
      </feedbackvariables>`),o){let y=-1;const m=(g?2:1)+1;w&&(y=m),i+=M({id:0,answerTest:$.NUM_ABSOLUTE,sans:r,tans:r,testOptions:String(n.wideTol),trueScore:.5,trueScoreMode:h.SET,trueNextNode:1,trueNote:`${e}-0-T`,trueFeedback:"",falseScore:0,falseScoreMode:h.SET,falseNextNode:y,falseNote:`${e}-0-F`,falseFeedback:t.incorrect||f.incorrect});const b=g?2:-1;i+=M({id:1,answerTest:$.NUM_ABSOLUTE,sans:r,tans:r,testOptions:String(n.tightTol),trueScore:1,trueScoreMode:h.SET,trueNextNode:b,trueNote:`${e}-1-T`,trueFeedback:t.correct||f.correct,falseScore:.5,falseScoreMode:h.SET,falsePenalty:.1,falseNextNode:-1,falseNote:`${e}-1-F`,falseFeedback:t.closeButInaccurate||f.closeButInaccurate})}else{const c=n.tightTol||0;i+=M({id:0,answerTest:c>0?$.NUM_ABSOLUTE:$.ALG_EQUIV,sans:r,tans:r,testOptions:c>0?String(c):"",trueScore:1,trueScoreMode:h.SET,trueNextNode:g?1:-1,trueNote:`${e}-0-T`,trueFeedback:t.correct||f.correct,falseScore:0,falseScoreMode:h.SET,falseNextNode:w?g?2:1:-1,falseNote:`${e}-0-F`,falseFeedback:t.incorrect||f.incorrect})}if(g){const c=o?2:1;i+=M({id:c,answerTest:$.NUM_SIG_FIGS,sans:r,tans:r,testOptions:String(n.sigFigs),trueScore:0,trueScoreMode:h.ADD,trueNextNode:-1,trueNote:`${e}-${c}-T`,trueFeedback:"",falseScore:n.penalty||.1,falseScoreMode:h.SUBTRACT,falseNextNode:-1,falseNote:`${e}-${c}-F`,falseFeedback:t.wrongSigFigs||f.wrongSigFigs})}if(w){const y=(g?o?2:1:o?1:0)+1;i+=M({id:y,answerTest:$.ALG_EQUIV,sans:"is_p10_error",tans:"true",testOptions:"",trueScore:0,trueScoreMode:h.SET,trueNextNode:-1,trueNote:`${e}-${y}-T`,trueFeedback:t.powerOf10Error||f.powerOf10Error,falseScore:0,falseScoreMode:h.SET,falseNextNode:-1,falseNote:`${e}-${y}-F`,falseFeedback:t.incorrect||f.incorrect})}return s+i}function M(a){return`
      <node>
        <name>${a.id}</name>
        <answertest>${a.answerTest}</answertest>
        <sans>${a.sans}</sans>
        <tans>${a.tans}</tans>
        <testoptions>${a.testOptions||""}</testoptions>
        <quiet>0</quiet>
        <truescoremode>${a.trueScoreMode}</truescoremode>
        <truescore>${a.trueScore}</truescore>
        <truepenalty>${a.truePenalty||""}</truepenalty>
        <truenextnode>${a.trueNextNode}</truenextnode>
        <trueanswernote>${a.trueNote}</trueanswernote>
        ${k("truefeedback",a.trueFeedback||"")}
        <falsescoremode>${a.falseScoreMode}</falsescoremode>
        <falsescore>${a.falseScore}</falsescore>
        <falsepenalty>${a.falsePenalty||""}</falsepenalty>
        <falsenextnode>${a.falseNextNode}</falsenextnode>
        <falseanswernote>${a.falseNote}</falseanswernote>
        ${k("falsefeedback",a.falseFeedback||"")}
      </node>`}function ut(a,e){const n=a.grading,t=a.feedback||{},r=a.answer,s=n.checkSigFigs&&n.sigFigs>0;let i="";return i+=`
      <node>
        <name>0</name>
        <answertest>${$.UNITS}</answertest>
        <sans>${r}</sans>
        <tans>${r}</tans>
        <testoptions>${n.tightTol||.05}</testoptions>
        <quiet>0</quiet>
        <truescoremode>${h.SET}</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>${s?1:-1}</truenextnode>
        <trueanswernote>${e}-0-T</trueanswernote>
        ${k("truefeedback",t.correct||f.correct)}
        <falsescoremode>${h.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${e}-0-F</falseanswernote>
        ${k("falsefeedback",t.wrongUnits||f.wrongUnits)}
      </node>`,s&&(i+=`
      <node>
        <name>1</name>
        <answertest>${$.NUM_SIG_FIGS}</answertest>
        <sans>${r}</sans>
        <tans>${r}</tans>
        <testoptions>${n.sigFigs}</testoptions>
        <quiet>0</quiet>
        <truescoremode>${h.ADD}</truescoremode>
        <truescore>0</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${e}-1-T</trueanswernote>
        ${k("truefeedback","")}
        <falsescoremode>${h.SUBTRACT}</falsescoremode>
        <falsescore>${n.penalty||.1}</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${e}-1-F</falseanswernote>
        ${k("falsefeedback",t.wrongSigFigs||f.wrongSigFigs)}
      </node>`),i}function he(a,e){const n=a.feedback||{};return`
      <node>
        <name>0</name>
        <answertest>${$.ALG_EQUIV}</answertest>
        <sans>${a.answer}</sans>
        <tans>${a.answer}</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>${h.SET}</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${e}-0-T</trueanswernote>
        ${k("truefeedback",n.correct||f.correct)}
        <falsescoremode>${h.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${e}-0-F</falseanswernote>
        ${k("falsefeedback",n.incorrect||f.incorrect)}
      </node>`}function pt(a,e){const n=a.feedback||{},t=a.options.find(s=>s.correct);t&&t.value;const r=a.options.findIndex(s=>s.correct)+1;return`
      <node>
        <name>0</name>
        <answertest>${$.ALG_EQUIV}</answertest>
        <sans>${a.answer}</sans>
        <tans>${r}</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>${h.SET}</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${e}-0-T</trueanswernote>
        ${k("truefeedback",n.correct||f.correct)}
        <falsescoremode>${h.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${e}-0-F</falseanswernote>
        ${k("falsefeedback",n.incorrect||f.incorrect)}
      </node>`}function gt(a,e){const n=a.feedback||{};return`
      <node>
        <name>0</name>
        <answertest>${$.ALG_EQUIV}</answertest>
        <sans>${a.answer}</sans>
        <tans>${a.answer}</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>${h.SET}</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${e}-0-T</trueanswernote>
        ${k("truefeedback",n.correct||f.correct)}
        <falsescoremode>${h.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${e}-0-F</falseanswernote>
        ${k("falsefeedback",n.incorrect||f.incorrect)}
      </node>`}function ft(a,e){var r;const n=a.feedback||{};return`
      <node>
        <name>0</name>
        <answertest>${((r=a.grading)==null?void 0:r.caseSensitive)!==!1?$.STRING:$.STRING_SLOPPY}</answertest>
        <sans>${a.answer}</sans>
        <tans>${a.answer}</tans>
        <testoptions></testoptions>
        <quiet>0</quiet>
        <truescoremode>${h.SET}</truescoremode>
        <truescore>1</truescore>
        <truepenalty></truepenalty>
        <truenextnode>-1</truenextnode>
        <trueanswernote>${e}-0-T</trueanswernote>
        ${k("truefeedback",n.correct||f.correct)}
        <falsescoremode>${h.SET}</falsescoremode>
        <falsescore>0</falsescore>
        <falsepenalty></falsepenalty>
        <falsenextnode>-1</falsenextnode>
        <falseanswernote>${e}-0-F</falseanswernote>
        ${k("falsefeedback",n.incorrect||f.incorrect)}
      </node>`}function ht(a,e){const n=`prt${a.id||e+1}`;let t="";switch(a.type){case p.NUMERICAL:t=dt(a,n);break;case p.UNITS:t=ut(a,n);break;case p.ALGEBRAIC:t=he(a,n);break;case p.RADIO:t=pt(a,n);break;case p.MATRIX:t=gt(a,n);break;case p.STRING:t=ft(a,n);break;case p.JSXGRAPH:t=Oe(a,n);break;default:t=he(a,n);break}return`
    <prt>
      <name>${n}</name>
      <value>1.0000000</value>
      <autosimplify>1</autosimplify>
      ${t}
    </prt>`}function me(a){let e=et(a);e+=nt(a),e+=`
    <specificfeedback format="html">
      <text><![CDATA[${(a.parts||[]).map(t=>`[[feedback:prt${t.id}]]`).join(`
`)}]]></text>
    </specificfeedback>`;const n=(a.variables||[]).filter(t=>t.type==="rand").map(t=>`{@${t.name}@}`).join(", ");return e+=`
    <questionnote format="html">
      <text><![CDATA[${n}]]></text>
    </questionnote>`,(a.parts||[]).forEach(t=>{e+=lt(t)}),(a.parts||[]).forEach((t,r)=>{e+=ht(t,r)}),e+=`
  </question>
</quiz>`,e}const mt={inductor:{name:"Engineering: Inductor Energy (Numerical)",questionText:"An inductor with inductance \\(L = {@L@} \\text{ H}\\) carries a current of \\(I = {@I@} \\text{ A}\\).<br>Calculate the energy stored in the magnetic field.",variables:[{name:"L",type:"rand",value:"rand(10)+1"},{name:"I",type:"rand",value:"rand(5)+1"},{name:"ans1",type:"calc",value:"0.5 * L * I * I"}],parts:[{id:1,type:"numerical",text:"Energy (Joules):",answer:"ans1",grading:{tightTol:.05,wideTol:.2,checkSigFigs:!0,sigFigs:3,penalty:.1,checkPowerOf10:!0,powerOf10Penalty:.5},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct! The energy stored is \\(E = \\frac{1}{2}LI^2\\).",incorrect:"Incorrect. Remember the formula: \\(E = \\frac{1}{2}LI^2\\).",powerOf10Error:"Your answer is off by a power of 10. Check your units — is L in henries and I in amperes?"}}],generalFeedback:"The energy stored in an inductor is given by:\\[E = \\frac{1}{2}LI^2\\]Substituting \\(L = {@L@}\\) H and \\(I = {@I@}\\) A:\\[E = \\frac{1}{2} \\times {@L@} \\times {@I@}^2 = {@ans1@} \\text{ J}\\]",hints:["What is the formula for energy stored in an inductor?","Remember: E = (1/2) L I^2. Make sure to square the current, not the inductance."],images:[]},circuit_ohm:{name:"Engineering: Circuit Analysis — Ohm's Law",questionText:"A resistor of \\(R = {@R@} \\; \\Omega\\) is connected to a voltage source of \\(V = {@V@} \\text{ V}\\).",variables:[{name:"R",type:"rand",value:"rand([100, 220, 330, 470, 680, 1000])"},{name:"V",type:"rand",value:"rand([5, 9, 12, 24])"},{name:"I_val",type:"calc",value:"V / R"},{name:"P_val",type:"calc",value:"V * V / R"},{name:"ans1",type:"algebraic",value:"V / R"},{name:"ans2",type:"algebraic",value:"V^2 / R"}],parts:[{id:1,type:"units",text:"Calculate the current through the resistor (include units):",answer:"ans1",grading:{tightTol:.001,wideTol:.01,checkSigFigs:!0,sigFigs:3,penalty:.1,checkPowerOf10:!0,powerOf10Penalty:.5},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct! Ohm's Law: \\(I = V/R\\).",wrongUnits:"Check your units. Current should be in amperes (A) or milliamperes (mA)."}},{id:2,type:"units",text:"Calculate the power dissipated by the resistor (include units):",answer:"ans2",grading:{tightTol:.01,wideTol:.05,checkSigFigs:!0,sigFigs:3,penalty:.1,checkPowerOf10:!0,powerOf10Penalty:.5},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct! Power: \\(P = V^2/R\\).",incorrect:"Incorrect. Use \\(P = V^2/R\\) or \\(P = I^2 R\\) or \\(P = VI\\)."}}],generalFeedback:"Using Ohm's Law: \\(I = V/R = {@V@}/{@R@}\\) A<br>Power: \\(P = V^2/R = {@V@}^2/{@R@}\\) W",hints:["Apply Ohm's Law: V = IR.","For power, you can use P = V*I, P = I^2*R, or P = V^2/R."],images:[]},circuit_series_parallel:{name:"Engineering: Series-Parallel Circuit",questionText:"Two resistors \\(R_1 = {@R1@} \\; \\Omega\\) and \\(R_2 = {@R2@} \\; \\Omega\\) are connected. Calculate the equivalent resistance for:",variables:[{name:"R1",type:"rand",value:"rand([100, 220, 330, 470])"},{name:"R2",type:"rand",value:"rand([100, 220, 330, 470])"},{name:"ans1",type:"calc",value:"R1 + R2"},{name:"ans2",type:"calc",value:"(R1 * R2) / (R1 + R2)"}],parts:[{id:1,type:"numerical",text:"Series connection (\\(\\Omega\\)):",answer:"ans1",grading:{tightTol:.01,wideTol:.1,checkSigFigs:!1,sigFigs:3,penalty:0,checkPowerOf10:!1,powerOf10Penalty:0},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct! Series: \\(R_{eq} = R_1 + R_2\\)."}},{id:2,type:"numerical",text:"Parallel connection (\\(\\Omega\\)):",answer:"ans2",grading:{tightTol:.05,wideTol:.2,checkSigFigs:!0,sigFigs:3,penalty:.1,checkPowerOf10:!1,powerOf10Penalty:0},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct! Parallel: \\(R_{eq} = \\frac{R_1 R_2}{R_1 + R_2}\\).",incorrect:"For parallel: \\(\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2}\\)."}}],generalFeedback:"Series: \\(R_{eq} = R_1 + R_2 = {@R1@} + {@R2@} = {@ans1@} \\; \\Omega\\)<br>Parallel: \\(R_{eq} = \\frac{R_1 \\cdot R_2}{R_1 + R_2} = \\frac{{@R1@} \\cdot {@R2@}}{{@R1@} + {@R2@}} = {@ans2@} \\; \\Omega\\)",hints:["For series: just add the resistances.","For parallel: use the product-over-sum formula."],images:[]}},vt={kinematics:{name:"Physics: Kinematics (Units)",questionText:"A car accelerates from rest at \\(a = {@a@} \\text{ m/s}^2\\) for \\(t = {@t@} \\text{ s}\\).",variables:[{name:"a",type:"rand",value:"rand(5)+1"},{name:"t",type:"rand",value:"rand(10)+5"},{name:"v_val",type:"calc",value:"a * t"},{name:"ans1",type:"algebraic",value:"stackunits(v_val, m/s)"}],parts:[{id:1,type:"units",text:"What is the final speed? (include units, e.g., 15 m/s)",answer:"ans1",grading:{tightTol:.05,wideTol:.1,checkSigFigs:!1,sigFigs:3,penalty:.1,checkPowerOf10:!1,powerOf10Penalty:0},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct! \\(v = a \\cdot t\\).",wrongUnits:"Check your units. Speed should be in m/s."}}],generalFeedback:"From \\(v = u + at\\) with \\(u = 0\\):<br>\\(v = {@a@} \\times {@t@} = {@v_val@}\\) m/s",hints:["Starting from rest means initial velocity u = 0.","Use v = u + at."],images:[]},projectile:{name:"Physics: Projectile Motion",questionText:"A ball is launched with initial speed \\(v_0 = {@v0@} \\text{ m/s}\\) at angle \\(\\theta = {@theta@}^\\circ\\) above the horizontal.",variables:[{name:"v0",type:"rand",value:"rand([10, 15, 20, 25, 30])"},{name:"theta",type:"rand",value:"rand([30, 45, 60])"},{name:"theta_rad",type:"calc",value:"theta * pi / 180"},{name:"ans1",type:"calc",value:"v0 * v0 * sin(2 * theta_rad) / 9.81"},{name:"ans2",type:"calc",value:"(v0 * sin(theta_rad))^2 / (2 * 9.81)"}],parts:[{id:1,type:"numerical",text:"Calculate the range (horizontal distance in metres):",answer:"ans1",grading:{tightTol:.5,wideTol:2,checkSigFigs:!0,sigFigs:3,penalty:.1,checkPowerOf10:!0,powerOf10Penalty:.5},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct!",incorrect:"Use \\(R = \\frac{v_0^2 \\sin(2\\theta)}{g}\\)."}},{id:2,type:"numerical",text:"Calculate the maximum height (metres):",answer:"ans2",grading:{tightTol:.3,wideTol:1,checkSigFigs:!0,sigFigs:3,penalty:.1,checkPowerOf10:!0,powerOf10Penalty:.5},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct!",incorrect:"Use \\(H = \\frac{(v_0 \\sin\\theta)^2}{2g}\\)."}}],generalFeedback:"Range: \\(R = \\frac{v_0^2 \\sin(2\\theta)}{g} = {@ans1@}\\) m<br>Max height: \\(H = \\frac{(v_0 \\sin\\theta)^2}{2g} = {@ans2@}\\) m",hints:["Decompose the initial velocity into horizontal and vertical components."],images:[]}},bt={algebra_expansion:{name:"Maths: Algebraic Expansion",questionText:"Expand the following expression completely: \\((x + {@a@})(x - {@b@})\\)",variables:[{name:"a",type:"rand",value:"rand(9)+1"},{name:"b",type:"rand",value:"rand(9)+1"},{name:"ans1",type:"algebraic",value:"expand((x+a)*(x-b))"}],parts:[{id:1,type:"algebraic",text:"Expanded form:",answer:"ans1",grading:{tightTol:0,wideTol:0,checkSigFigs:!1,sigFigs:3,penalty:0,checkPowerOf10:!1,powerOf10Penalty:0},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct! The expansion is complete.",incorrect:"Use FOIL or distributive property to expand."}}],generalFeedback:"\\((x + {@a@})(x - {@b@}) = x^2 + ({@a@} - {@b@})x - {@a@} \\cdot {@b@}\\)",hints:["Use the FOIL method: First, Outer, Inner, Last."],images:[]},calculus_int:{name:"Maths: Definite Integral",questionText:"Evaluate the integral: \\[ \\int_{0}^{{@k@}} (3x^2 + {@c@}) \\, dx \\]",variables:[{name:"k",type:"rand",value:"rand(4)+1"},{name:"c",type:"rand",value:"rand(10)"},{name:"ans1",type:"algebraic",value:"integrate(3*x^2 + c, x, 0, k)"}],parts:[{id:1,type:"numerical",text:"Value:",answer:"ans1",grading:{tightTol:.01,wideTol:.05,checkSigFigs:!1,sigFigs:3,penalty:.1,checkPowerOf10:!1,powerOf10Penalty:0},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct!",incorrect:"Remember to integrate term by term and evaluate at the limits."}}],generalFeedback:"\\(\\int_0^{{@k@}} (3x^2 + {@c@})\\,dx = [x^3 + {@c@}x]_0^{{@k@}} = {@k@}^3 + {@c@} \\cdot {@k@} = {@ans1@}\\)",hints:["The antiderivative of 3x^2 is x^3, and the antiderivative of a constant c is cx."],images:[]},diff_equation:{name:"Maths: First-Order Differential Equation",questionText:"Solve the differential equation: \\[ \\frac{dy}{dx} = {@a@}x + {@b@} \\] with initial condition \\(y(0) = {@y0@}\\).",variables:[{name:"a",type:"rand",value:"rand(5)+1"},{name:"b",type:"rand",value:"rand(8)+1"},{name:"y0",type:"rand",value:"rand(5)"},{name:"ans1",type:"algebraic",value:"a*x^2/2 + b*x + y0"}],parts:[{id:1,type:"algebraic",text:"Find \\(y(x)\\):",answer:"ans1",grading:{tightTol:0,wideTol:0,checkSigFigs:!1,sigFigs:3,penalty:0,checkPowerOf10:!1,powerOf10Penalty:0},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct! Well done integrating and applying the initial condition.",incorrect:"Integrate both sides and use y(0) to find the constant of integration."}}],generalFeedback:"Integrating: \\(y = \\int ({@a@}x + {@b@})\\,dx = \\frac{{@a@}}{2}x^2 + {@b@}x + C\\)<br>Using \\(y(0) = {@y0@}\\): \\(C = {@y0@}\\)<br>So \\(y(x) = \\frac{{@a@}}{2}x^2 + {@b@}x + {@y0@}\\)",hints:["Integrate the right-hand side with respect to x.","Don't forget the constant of integration C. Use the initial condition to find it."],images:[]},matrix_operations:{name:"Maths: Matrix Operations",questionText:"Given the matrices:<br>\\[ A = \\begin{pmatrix} {@a11@} & {@a12@} \\\\ {@a21@} & {@a22@} \\end{pmatrix}, \\quad B = \\begin{pmatrix} {@b11@} & {@b12@} \\\\ {@b21@} & {@b22@} \\end{pmatrix} \\]",variables:[{name:"a11",type:"rand",value:"rand(5)+1"},{name:"a12",type:"rand",value:"rand(5)"},{name:"a21",type:"rand",value:"rand(5)"},{name:"a22",type:"rand",value:"rand(5)+1"},{name:"b11",type:"rand",value:"rand(5)+1"},{name:"b12",type:"rand",value:"rand(5)"},{name:"b21",type:"rand",value:"rand(5)"},{name:"b22",type:"rand",value:"rand(5)+1"},{name:"A",type:"algebraic",value:"matrix([a11, a12], [a21, a22])"},{name:"B",type:"algebraic",value:"matrix([b11, b12], [b21, b22])"},{name:"ans1",type:"algebraic",value:"A + B"},{name:"ans2",type:"algebraic",value:"A . B"},{name:"det_val",type:"calc",value:"a11 * a22 - a12 * a21"},{name:"ans3",type:"algebraic",value:"determinant(A)"}],parts:[{id:1,type:"matrix",text:"Calculate \\(A + B\\):",answer:"ans1",grading:{tightTol:0,wideTol:0,checkSigFigs:!1,sigFigs:3,penalty:0,checkPowerOf10:!1,powerOf10Penalty:0},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct! Add corresponding elements.",incorrect:"Add element by element: (A+B)_{ij} = A_{ij} + B_{ij}."}},{id:2,type:"matrix",text:"Calculate \\(A \\cdot B\\) (matrix product):",answer:"ans2",grading:{tightTol:0,wideTol:0,checkSigFigs:!1,sigFigs:3,penalty:0,checkPowerOf10:!1,powerOf10Penalty:0},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct!",incorrect:"Row of A times column of B: (AB)_{ij} = sum of A_{ik} * B_{kj}."}},{id:3,type:"numerical",text:"Calculate \\(\\det(A)\\):",answer:"ans3",grading:{tightTol:.01,wideTol:.1,checkSigFigs:!1,sigFigs:3,penalty:0,checkPowerOf10:!1,powerOf10Penalty:0},options:[],graphCode:"",gradingCode:"",feedback:{correct:"Correct!",incorrect:"For a 2x2 matrix: det = a11*a22 - a12*a21."}}],generalFeedback:"Matrix addition: add element by element.<br>Matrix multiplication: row times column.<br>Determinant of 2x2: \\(\\det(A) = a_{11}a_{22} - a_{12}a_{21} = {@a11@} \\cdot {@a22@} - {@a12@} \\cdot {@a21@} = {@det_val@}\\)",hints:["For matrix addition, add corresponding elements.","For matrix multiplication, multiply row of first matrix by column of second."],images:[]}},yt={blank:{name:"-- Blank Question --",questionText:"",variables:[],parts:[],generalFeedback:"",hints:[],images:[]},mcq_primes:{name:"General: Multiple Choice",questionText:"Which of the following integers is a prime number?",variables:[],parts:[{id:1,type:"radio",text:"Choose one:",answer:"ans1",options:[{value:"4",correct:!1},{value:"7",correct:!0},{value:"9",correct:!1},{value:"15",correct:!1}],grading:{tightTol:0,wideTol:0,checkSigFigs:!1,sigFigs:3,penalty:0,checkPowerOf10:!1,powerOf10Penalty:0},graphCode:"",gradingCode:"",feedback:{correct:"Correct! 7 is prime — it has no divisors other than 1 and itself.",incorrect:"Incorrect. A prime number has exactly two factors: 1 and itself."}}],generalFeedback:"A prime number is a natural number greater than 1 that has no positive divisors other than 1 and itself.<br>4 = 2x2, 9 = 3x3, 15 = 3x5 — none are prime.<br>7 has no divisors other than 1 and 7, so it is prime.",hints:["A prime number can only be divided by 1 and itself."],images:[]},jsxgraph_connect:{name:"Interactive: Point Placement Graph",questionText:"Sketch the function \\(f(t)\\) by clicking on the graph to place points at the key locations.<br><small>Click to place 5 points. They will connect automatically.</small>",variables:[{name:"t1",type:"rand",value:"10"},{name:"t2",type:"rand",value:"30"},{name:"t3",type:"rand",value:"40"},{name:"t4",type:"rand",value:"60"},{name:"p0",type:"algebraic",value:"[0, 0]"},{name:"p1",type:"algebraic",value:"[t1, 5*t1]"},{name:"p2",type:"algebraic",value:"[t2, -5*t2 + 100]"},{name:"p3",type:"algebraic",value:"[t3, -50]"},{name:"p4",type:"algebraic",value:"[t4, 0]"},{name:"correct_points",type:"algebraic",value:"[p0, p1, p2, p3, p4]"},{name:"ans1",type:"algebraic",value:"correct_points"}],parts:[{id:1,type:"jsxgraph",text:"Place 5 points on the graph:",answer:"ans1",grading:{tightTol:0,wideTol:0,checkSigFigs:!1,sigFigs:3,penalty:0,checkPowerOf10:!1,powerOf10Penalty:0},options:[],graphCode:`var board = JXG.JSXGraph.initBoard(divid, {
    boundingbox: [-5, 70, 65, -70],
    axis: true, showNavigation: true, showCopyright: false, grid: true
});

board.create('text', [62, -5, 't (s)'], {fontSize: 14});
board.create('text', [-3, 65, 'f(t)'], {fontSize: 14});

var studentPoints = [];

board.on('down', function(e) {
    var coords = board.getUsrCoordsOfMouse(e);
    var x = Math.round(coords[0]);
    var y = Math.round(coords[1]);

    if (studentPoints.length < 5) {
        var p = board.create('point', [x, y], {
            name: '(' + x + ',' + y + ')',
            size: 4, face: 'o', strokeColor: '#2563eb', fillColor: '#2563eb'
        });
        studentPoints.push(p);

        if (studentPoints.length > 1) {
            board.create('segment',
                [studentPoints[studentPoints.length-2], studentPoints[studentPoints.length-1]],
                {strokeColor: '#ef4444', strokeWidth: 2}
            );
        }
        updateAnswer();
    }
});

function updateAnswer() {
    var arr = [];
    for (var i = 0; i < studentPoints.length; i++) {
        arr.push('[' + studentPoints[i].X().toFixed(0) + ',' + studentPoints[i].Y().toFixed(0) + ']');
    }
    var el = document.getElementById(ans1Ref);
    if(el) el.value = '[' + arr.join(',') + ']';
}

board.create('button', [5, 60, 'Reset', function() {
    JXG.JSXGraph.freeBoard(board);
    board = JXG.JSXGraph.initBoard(divid, {
        boundingbox: [-5, 70, 65, -70],
        axis: true, showNavigation: true, showCopyright: false, grid: true
    });
    studentPoints = [];
    var el = document.getElementById(ans1Ref);
    if(el) el.value = '';
}]);`,gradingCode:`/* Check number of points */
correct_count: is(length(ans1) = 5);

/* Check each point within tolerance */
tolerance: 5;
pt_checks: makelist(
    if is(abs(ans1[i][1] - correct_points[i][1]) < tolerance) and
       is(abs(ans1[i][2] - correct_points[i][2]) < tolerance) then 1 else 0,
    i, 1, 5
);

/* All must be correct */
num_correct: apply("+", pt_checks);
all_correct: correct_count and is(num_correct = 5);`,feedback:{correct:"Correct! All points are in the right positions.",incorrect:"Some points are not in the correct positions. Check each key point of the function."}}],generalFeedback:"The function has key points at t=0, t={@t1@}, t={@t2@}, t={@t3@}, and t={@t4@}.",hints:["Start from the origin (0,0) and work through each time interval."],images:[]}},O={...yt,...mt,...vt,...bt};function xt(a,e){const n=[],t=wt(a),r=new Set(e.map(s=>s.name));for(const s of t)r.has(s)||n.push({type:"undefined_variable",variable:s,message:`Variable "{@${s}@}" is used in text but not defined.`});return n}function wt(a){if(!a)return[];const e=a.match(/\{@([a-zA-Z_][a-zA-Z0-9_]*)@\}/g)||[];return[...new Set(e.map(n=>n.replace(/\{@|@\}/g,"")))]}function kt(a){if(!a||!a.trim())return"Expression cannot be empty.";const e=a.trim().replace(/;+$/,"");let n=0;for(const t of e)if(t==="("&&n++,t===")"&&n--,n<0)return"Unmatched closing parenthesis.";if(n!==0)return"Unmatched opening parenthesis.";n=0;for(const t of e)if(t==="["&&n++,t==="]"&&n--,n<0)return"Unmatched closing bracket.";return n!==0?"Unmatched opening bracket.":/\*\*\*/.test(e)?"Triple asterisk is invalid. Use ^ for exponents.":/\/\//.test(e)&&!e.includes("/*")?"Double slash is not valid in Maxima. Use single / for division.":null}function $t(a){return a?/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(a)?["if","then","else","do","for","while","true","false","and","or","not"].includes(a.toLowerCase())?`"${a}" is a reserved word in Maxima.`:null:"Variable name must start with a letter or underscore, and contain only letters, numbers, and underscores.":"Variable name cannot be empty."}function St(a){const e=[];(!a.name||!a.name.trim())&&e.push({level:"error",message:"Question name is required."}),(!a.questionText||!a.questionText.trim())&&e.push({level:"error",message:"Question text is required."}),(!a.parts||a.parts.length===0)&&e.push({level:"error",message:"At least one part (answer input) is required."});const n=[a.questionText||"",...(a.parts||[]).map(r=>r.text||"")].join(" "),t=xt(n,a.variables||[]);return e.push(...t.map(r=>({level:"warning",message:r.message}))),(a.parts||[]).forEach((r,s)=>{const i=String.fromCharCode(97+s);(!r.answer||!r.answer.trim())&&e.push({level:"error",message:`Part (${i}): Answer variable is required.`}),r.type==="radio"&&((!r.options||r.options.length<2)&&e.push({level:"error",message:`Part (${i}): Multiple choice needs at least 2 options.`}),r.options&&r.options.some(g=>g.correct)||e.push({level:"error",message:`Part (${i}): No correct option marked.`})),(r.type==="numerical"||r.type==="units")&&r.grading&&r.grading.tightTol>r.grading.wideTol&&r.grading.wideTol>0&&e.push({level:"warning",message:`Part (${i}): Tight tolerance (${r.grading.tightTol}) is larger than wide tolerance (${r.grading.wideTol}).`}),r.type==="jsxgraph"&&((!r.graphCode||!r.graphCode.trim())&&e.push({level:"warning",message:`Part (${i}): JSXGraph code is empty.`}),(!r.gradingCode||!r.gradingCode.trim())&&e.push({level:"warning",message:`Part (${i}): Graph grading code is empty.`}))}),(a.variables||[]).forEach(r=>{const s=$t(r.name);s&&e.push({level:"error",message:`Variable "${r.name}": ${s}`});const i=kt(r.value);i&&e.push({level:"warning",message:`Variable "${r.name}": ${i}`})}),e}function ve(){var r,s,i,o,g,w,c,y;const a=new _e,e=new Ze(a);a.subscribe((d,m)=>{e.render(d,m)}),e.init();const n=document.getElementById("template-select");n&&Object.entries(O).forEach(([d,m])=>{const b=document.createElement("option");b.value=d,b.textContent=m.name,n.appendChild(b)}),(r=document.getElementById("btn-add-var"))==null||r.addEventListener("click",()=>{a.addVariable()}),(s=document.getElementById("btn-detect-vars"))==null||s.addEventListener("click",()=>{const d=a.scanVariables(),m=d>0?`Found and added ${d} new variable(s).`:"No new variables found. All {@var@} references are already defined.";T(m,d>0?"success":"info")}),(i=document.getElementById("btn-add-part"))==null||i.addEventListener("click",()=>{a.addPart()}),(o=document.getElementById("btn-gen-sample"))==null||o.addEventListener("click",()=>{a.generateSampleValues()});const t=document.getElementById("btn-load-template");t&&n&&(t.addEventListener("click",()=>{const d=n.value;d&&O[d]&&(a.loadTemplate(O[d]),n.value="",T("Template loaded.","success"))}),n.addEventListener("change",()=>{const d=n.value;d&&O[d]&&(a.loadTemplate(O[d]),n.value="",T("Template loaded.","success"))})),(g=document.getElementById("btn-save"))==null||g.addEventListener("click",()=>{const d=JSON.stringify(a.data,null,2);be(d,(a.data.name||"question")+".json","application/json")}),(w=document.getElementById("file-upload"))==null||w.addEventListener("change",d=>{const m=d.target.files[0];if(!m)return;const b=new FileReader;b.onload=L=>{try{const S=L.target.result;m.name.endsWith(".xml")?(a.loadFromXml(S),T("XML file imported successfully.","success")):(a.loadFromJson(S),T("JSON file loaded successfully.","success"))}catch(S){T("Error: "+S.message,"error")}},b.readAsText(m),d.target.value=""}),(c=document.getElementById("btn-export-xml"))==null||c.addEventListener("click",()=>{const d=St(a.data),m=d.filter(S=>S.level==="error");if(m.length>0){const S=`Cannot export — fix these errors first:

`+m.map(P=>"- "+P.message).join(`
`);T(S,"error");return}const b=d.filter(S=>S.level==="warning");if(b.length>0&&!confirm(`Warnings found:

`+b.map(P=>"- "+P.message).join(`
`)+`

Export anyway?`))return;const L=me(a.data);be(L,(a.data.name||"question")+".xml","application/xml"),T("XML exported successfully.","success")}),(y=document.getElementById("btn-preview-xml"))==null||y.addEventListener("click",()=>{const d=me(a.data),m=window.open("","_blank");m&&(m.document.write("<pre>"+Et(d)+"</pre>"),m.document.title="XML Preview")}),a.generateSampleValues(),a.notify()}function be(a,e,n){const t=new Blob([a],{type:n}),r=URL.createObjectURL(t),s=document.createElement("a");s.href=r,s.download=e,s.click(),URL.revokeObjectURL(r)}function T(a,e="info"){const n=document.createElement("div");n.className=`notification notification-${e}`,n.textContent=a,document.body.appendChild(n),setTimeout(()=>{n.classList.add("fade-out"),setTimeout(()=>n.remove(),300)},3e3)}function Et(a){return a.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",ve):ve();
