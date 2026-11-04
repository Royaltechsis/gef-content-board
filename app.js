(function(){
"use strict";
const BASE=window.ITEMS||[];
const EF=["title","sound","hook","how","says","shoot","note","flag"];
let showDel=false;
function IT(){const out=[];for(const i of BASE){if(!!L(i,"del")===showDel)out.push(i);}
  for(const [id,s] of Object.entries(state)){if(!s||!s.isnew)continue;if(!!s.del!==showDel)continue;
    out.push({id,cat:"Our ideas",num:"(new)",title:"",phase:s.phase||"venue",who:s.kind||"any",q:s.title||"",custom:true});}
  return out;}
const STATUSES=["Idea","Scripted","Filmed","Edited","Posted"];
const SC=["#94a3b8","#7c3aed","#0284c7","#d97706","#16a34a"];
const CATS=["Trip idea","Professional","Trend","Talking sound","Classic sound","Our ideas"];
const PHASES=[["before","Before"],["travel","Travel"],["venue","Venue day"],["cairo","Cairo"],["after","After"]];
const PH=Object.fromEntries(PHASES);
const WHO={solo:"Solo",duo:"Duo",team:"Team",any:"Solo or team"};
const $=s=>document.querySelector(s);
const LS=(k,v)=>{try{if(v===undefined)return JSON.parse(localStorage.getItem(k));localStorage.setItem(k,JSON.stringify(v));}catch(e){return null;}};

let key=null;
const h=new URLSearchParams(location.hash.slice(1));
if(h.get("k")){key=h.get("k");LS("gef_key",key);history.replaceState(null,"",location.pathname+location.search);}
else key=LS("gef_key");
let shared=false; // true once server confirms key
let state=LS("gef_state")||{};      // id -> {status,who,star,notes,t:{}}
let queue=LS("gef_queue")||[];       // pending writes
let me=LS("gef_me")||"";
const f={cat:"",phase:"",who:"",status:"",star:false,mine:false,real:false,q:"",vibe:"",asg:"",refs:false,unassigned:false,unstar:false,sort:"default"};

const VIBES=[["comedy","😂 Comedy",/comed|funny|joke|😂|skit|prank|pov|reaction|meme|bad boy|hobby|hideout|clocks out/i],
 ["dance","💃 Dance",/danc|choreo|moves|groove|shaku|zanku|amapiano|legwork/i],
 ["lipsync","🎤 Lip-sync / sound",/lip-?sync|same audio|use audio|mouth the|mime/i],
 ["pov","👀 POV",/\bpov\b/i],
 ["talk","🗣 Talking / interview",/interview|ask(ing)? (people|the team|my|coworkers)|explain|mic|vox|street|passing the phone|tell me/i],
 ["vlog","🎬 Vlog / B-roll",/vlog|b-?roll|day in|travel|airport|packing|grwm|get ready|walk|cinematic|montage|reveal/i],
 ["pro","💼 Professional",/linkedin|professional|announce|thrilled|honou?red|keynote|panel|lesson|insight/i]];
const vcache={};
function vibesOf(i){if(vcache[i.id])return vcache[i.id];const t=[L(i,"title"),L(i,"sound"),L(i,"hook"),L(i,"how"),i.cat,i.format].join(" ");
  const v=VIBES.filter(x=>x[2].test(t)).map(x=>x[0]);if(i.cat==="Professional"&&!v.includes("pro"))v.push("pro");return vcache[i.id]=v;}
function isRef(i){return /Bunmi's reference/.test(L(i,"note")||"")||!!i.custom;}
function S(id){return state[id]||(state[id]={t:{}});}
function L(i,k){const s=S(i.id);return (s[k]!==undefined&&s[k]!==null)?s[k]:i[k];}
function stIdx(id){const s=S(id).status;const i=STATUSES.indexOf(s);return i<0?0:i;}
function setField(id,field,val){delete vcache[id];const s=S(id);s[field]=val;s.t=s.t||{};s.t[field]=Date.now();LS("gef_state",state);
  queue.push({id,[field]:val,t:{[field]:s.t[field]},by:me});LS("gef_queue",queue);flush();renderTop();}

let toastT;function toast(msg,undo){let t=document.getElementById("toast");if(!t){t=document.createElement("div");t.id="toast";document.body.appendChild(t);}
  t.innerHTML="";const s=document.createElement("span");s.textContent=msg;t.appendChild(s);
  if(undo){const b=document.createElement("button");b.type="button";b.textContent="Undo";b.onclick=()=>{undo();t.classList.remove("on");};t.appendChild(b);}
  t.classList.add("on");clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove("on"),5000);}
function syncMsg(txt,warn){const el=$("#sync");el.textContent=txt;el.className="sync"+(warn?" warn":"");}
let flushing=false;
async function flush(){
  if(flushing||!key||!queue.length){updSync();return;}
  flushing=true;
  try{
    while(queue.length){
      const b=queue[0];
      const r=await fetch("/api/item",{method:"POST",headers:{"content-type":"application/json","x-key":key},body:JSON.stringify(b)});
      if(r.status===401){shared=false;key=null;LS("gef_key",null);break;}
      if(!r.ok) throw new Error("http "+r.status);
      queue.shift();LS("gef_queue",queue);
    }
  }catch(e){}
  flushing=false;updSync();
}
function updSync(){
  if(!key){syncMsg("Saved on this phone only. Open the team link to share status with the team.",true);return;}
  if(queue.length){syncMsg(queue.length+" change"+(queue.length>1?"s":"")+" waiting for internet, will sync automatically",true);return;}
  syncMsg("Synced with the team"+(lastPull?" · updated "+new Date(lastPull).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}):""));
}
let lastPull=0;
async function pull(){
  try{
    const r=await fetch("/api/state",{cache:"no-store"});if(!r.ok)throw 0;
    const d=await r.json();const srv=d.items||{};const sig=JSON.stringify(srv);const changed=sig!==lastSig;lastSig=sig;
    for(const [id,sv] of Object.entries(srv)){
      const loc=S(id);loc.t=loc.t||{};const st=sv.t||{};
      for(const k of Object.keys(sv)){ if(k==="t"||k==="by")continue; if(sv[k]!==undefined&&(st[k]||0)>=(loc.t[k]||0)){loc[k]=sv[k];loc.t[k]=st[k]||0;} }
    }
    LS("gef_state",state);lastPull=Date.now();
    if(key&&!shared){const c=await fetch("/api/check",{headers:{"x-key":key}}).then(r=>r.json()).catch(()=>({ok:false}));shared=!!c.ok;if(!shared){key=null;LS("gef_key",null);}}
    if(changed)render(true);
  }catch(e){syncMsg(key?"Offline. Changes are kept on this phone and sync when you are back online.":"Saved on this phone only.",true);}
  updSync();
}

function chip(label,count,on,fn){const b=document.createElement("button");b.type="button";b.className="chip";b.setAttribute("aria-pressed",on?"true":"false");
  b.textContent=label;if(count!=null){const s=document.createElement("small");s.textContent=count;b.appendChild(s);}b.onclick=fn;return b;}
function nActive(){let n=0;for(const k of ["cat","phase","who","status","vibe","asg"])if(f[k])n++;for(const k of ["star","unstar","mine","real","refs","unassigned"])if(f[k])n++;if(f.sort!=="default")n++;return n;}
function clearF(){Object.assign(f,{cat:"",phase:"",who:"",status:"",star:false,mine:false,real:false,vibe:"",asg:"",refs:false,unassigned:false,unstar:false,sort:"default"});}
function fill(id,list){const el=$(id);if(!el)return;el.innerHTML="";for(const c of list)el.appendChild(c);}
function renderChips(){
  const all=IT();const cnt=fn=>all.filter(fn).length;
  fill("#quickChips",[
    chip("All",all.length,!nActive(),()=>{clearF();render();}),
    chip("📌 Bunmi's refs",cnt(isRef),f.refs,()=>{f.refs=!f.refs;render();}),
    chip("★ Starred",cnt(i=>S(i.id).star),f.star,()=>{f.star=!f.star;if(f.star)f.unstar=false;render();}),
    chip("☆ Unstarred",cnt(i=>!S(i.id).star),f.unstar,()=>{f.unstar=!f.unstar;if(f.unstar)f.star=false;render();}),
    chip("Not started",cnt(i=>stIdx(i.id)===0),f.status==="Idea",()=>{f.status=f.status==="Idea"?"":"Idea";render();}),
    chip("😂 Comedy",cnt(i=>vibesOf(i).includes("comedy")),f.vibe==="comedy",()=>{f.vibe=f.vibe==="comedy"?"":"comedy";render();}),
    chip("👥 Team",cnt(i=>i.who==="team"),f.who==="team",()=>{f.who=f.who==="team"?"":"team";render();}),
    chip("🙋 Mine",null,f.mine,()=>{if(!me){openMenu();return;}f.mine=!f.mine;render();}),
    chip("🆕 Newest first",null,f.sort==="new",()=>{f.sort=f.sort==="new"?"default":"new";render();})]);
  fill("#sortChips",[["default","Board order"],["new","Newest first"],["star","Starred first"],["status","Least done first"],["az","A–Z"]].map(([k,l])=>chip(l,null,f.sort===k,()=>{f.sort=k;render();})));
  fill("#vibeChips",VIBES.map(([k,l])=>chip(l,cnt(i=>vibesOf(i).includes(k)),f.vibe===k,()=>{f.vibe=f.vibe===k?"":k;render();})));
  fill("#catChips",CATS.map(c=>chip(c,cnt(i=>i.cat===c),f.cat===c,()=>{f.cat=f.cat===c?"":c;render();})));
  fill("#statusChips",STATUSES.map((s,k)=>chip(s,cnt(i=>stIdx(i.id)===k),f.status===s,()=>{f.status=f.status===s?"":s;render();})));
  fill("#whoChips",["solo","duo","team"].map(w=>chip(WHO[w],cnt(i=>i.who===w),f.who===w,()=>{f.who=f.who===w?"":w;render();})));
  const ppl=[...new Set(Object.values(state).map(x=>x&&x.who).filter(Boolean).map(x=>x.trim()))].sort();
  fill("#asgChips",[chip("Unassigned",cnt(i=>!(S(i.id).who||"").trim()),f.unassigned,()=>{f.unassigned=!f.unassigned;f.asg="";render();})].concat(ppl.map(p=>chip(p,cnt(i=>(S(i.id).who||"").trim().toLowerCase()===p.toLowerCase()),f.asg.toLowerCase()===p.toLowerCase(),()=>{f.asg=f.asg===p?"":p;f.unassigned=false;render();}))));
  fill("#phaseChips",PHASES.map(([k,l])=>chip(l,cnt(i=>i.phase===k),f.phase===k,()=>{f.phase=f.phase===k?"":k;render();})));
  fill("#moreChips",[chip("★ Starred",cnt(i=>S(i.id).star),f.star,()=>{f.star=!f.star;if(f.star)f.unstar=false;render();}),chip("☆ Unstarred",cnt(i=>!S(i.id).star),f.unstar,()=>{f.unstar=!f.unstar;if(f.unstar)f.star=false;render();}),chip("Has real video",null,f.real,()=>{f.real=!f.real;render();}),chip("🗑 Deleted",null,showDel,()=>{showDel=!showDel;render();})]);
  const n=nActive();$("#fCount").textContent=n?String(n):"";
  // active pills
  const act=[];const pill=(t,fn)=>{const b=document.createElement("button");b.type="button";b.className="apill";b.textContent=t+" ✕";b.onclick=()=>{fn();render();};act.push(b);};
  if(f.refs)pill("Bunmi's refs",()=>f.refs=false);if(f.star)pill("Starred",()=>f.star=false);if(f.unstar)pill("Unstarred",()=>f.unstar=false);if(f.mine)pill("Mine",()=>f.mine=false);
  if(f.vibe)pill(VIBES.find(v=>v[0]===f.vibe)[1],()=>f.vibe="");if(f.cat)pill(f.cat,()=>f.cat="");if(f.status)pill(f.status,()=>f.status="");
  if(f.who)pill(WHO[f.who],()=>f.who="");if(f.asg)pill("Assigned: "+f.asg,()=>f.asg="");if(f.unassigned)pill("Unassigned",()=>f.unassigned=false);
  if(f.phase)pill(PH[f.phase],()=>f.phase="");if(f.real)pill("Has real video",()=>f.real=false);if(f.sort!=="default")pill("Sort: "+({new:"Newest",star:"Starred",status:"Least done",az:"A–Z"}[f.sort]),()=>f.sort="default");
  if(showDel)pill("Deleted",()=>showDel=false);
  if(act.length>1){const c=document.createElement("button");c.type="button";c.className="apill clr";c.textContent="Clear all";c.onclick=()=>{clearF();showDel=false;render();};act.push(c);}
  fill("#activeF",act);
}
function renderTop(){
  const counts=[0,0,0,0,0];for(const i of IT())counts[stIdx(i.id)]++;
  const bar=$("#bar");bar.innerHTML="";
  for(let i=4;i>=1;i--){if(!counts[i])continue;const s=document.createElement("span");s.style.width=(counts[i]/IT().length*100)+"%";s.style.background=SC[i];bar.appendChild(s);}
  const c=$("#counts");c.innerHTML="";
  const p=document.createElement("span");p.innerHTML="<b>"+counts[4]+"/"+IT().length+"</b> posted";c.appendChild(p);
  for(let i=0;i<4;i++){const s=document.createElement("span");s.innerHTML='<i class="dot" style="background:'+SC[i]+'"></i>'+STATUSES[i]+" "+counts[i];c.appendChild(s);}
  const stars=IT().filter(i=>S(i.id).star).length;const s=document.createElement("span");s.textContent="★ "+stars;c.appendChild(s);
  const ppl=new Set(Object.values(state).map(x=>x.who).filter(Boolean));if(me)ppl.add(me);
  $("#people").innerHTML=[...ppl].map(p=>'<option value="'+esc(p)+'">').join("");
}
function esc(s){return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function match(i){
  const s=S(i.id);
  if(f.cat&&i.cat!==f.cat)return false;
  if(f.phase&&i.phase!==f.phase)return false;
  if(f.who&&!(i.who===f.who||(i.who==="any"&&f.who!=="duo")))return false;
  if(f.status&&STATUSES[stIdx(i.id)]!==f.status)return false;
  if(f.star&&!s.star)return false;
  if(f.unstar&&s.star)return false;
  if(f.mine&&(s.who||"").trim().toLowerCase()!==me.trim().toLowerCase())return false;
  if(f.real&&!(L(i,"tt")||L(i,"ig")))return false;
  if(f.vibe&&!vibesOf(i).includes(f.vibe))return false;
  if(f.refs&&!isRef(i))return false;
  if(f.asg&&(s.who||"").trim().toLowerCase()!==f.asg.toLowerCase())return false;
  if(f.unassigned&&(s.who||"").trim())return false;
  if(f.q){const hay=[L(i,"title"),L(i,"sound"),L(i,"hook"),L(i,"how"),L(i,"says"),i.format,i.cat,L(i,"flag"),s.who,s.notes,L(i,"shoot")].join(" ").toLowerCase();
    if(!f.q.toLowerCase().split(/\s+/).every(w=>hay.includes(w)))return false;}
  return true;
}
function refBtn(kind,url,q){
  const a=document.createElement("a");a.target="_blank";a.rel="noopener";
  if(url){a.href=url;a.className="ref real "+kind;a.textContent=(kind==="tt"?"▶ TikTok example":"▶ Instagram example");}
  else{a.href=kind==="tt"?"https://www.tiktok.com/search?q="+encodeURIComponent(q):"https://www.instagram.com/explore/search/keyword/?q="+encodeURIComponent(q);
    a.className="ref search "+kind;a.textContent=(kind==="tt"?"Search TikTok":"Search Instagram");a.title="search: "+q;}
  return a;
}
const T=$("#cardT");
function card(i){
  const n=T.content.firstElementChild.cloneNode(true);const s=S(i.id);const si=stIdx(i.id);
  n.dataset.id=i.id;n.classList.toggle("s4",si===4);
  const m=n.querySelector(".meta");
  const pills=[[i.cat+" "+i.num,"pill cat-"+i.cat.split(" ")[0]],[PH[i.phase],"pill"],[WHO[i.who]||i.who,"pill"]];
  if(i.format)pills.push([i.format,"pill"]);
  for(const [t,c] of pills){const p=document.createElement("span");p.className=c;p.textContent=t;m.appendChild(p);}
  const star=n.querySelector(".star");const paint=()=>{star.textContent=S(i.id).star?"★":"☆";star.classList.toggle("on",!!S(i.id).star);star.setAttribute("aria-pressed",S(i.id).star?"true":"false");};paint();
  star.onclick=()=>{setField(i.id,"star",!S(i.id).star);paint();};
  const qd=n.querySelector(".qdel");
  if(showDel){qd.textContent="↩";qd.setAttribute("aria-label","Restore this idea");qd.onclick=()=>{setField(i.id,"del",false);render();toast("Restored");};}
  else qd.onclick=()=>{setField(i.id,"del",true);n.remove();renderTop();toast("Deleted",()=>{setField(i.id,"del",false);render();});};
  n.querySelector(".title").textContent=L(i,"title")||"New idea (tap ✏️ to fill)";
  const snd=n.querySelector(".sound");if(L(i,"sound")&&i.cat!=="Professional"&&i.cat!=="Trip idea")snd.textContent="🎵 "+L(i,"sound");else snd.remove();
  const hk=n.querySelector(".hook");
  if(L(i,"hook")&&L(i,"hook")!=='"'+L(i,"title")+'"'){hk.textContent=(i.cat==="Professional"?"Hook: ":"👉 ")+L(i,"hook");}
  else if(i.cat==="Trip idea"&&L(i,"how")){hk.textContent="🎬 "+L(i,"how");hk.classList.add("plan");}else hk.remove();
  const fl=n.querySelector(".flag");if(L(i,"flag")){fl.textContent=(L(i,"flag").includes("⚠️")?"":"⚠️ ")+L(i,"flag");}else fl.remove();
  const r=n.querySelector(".refs");const paintRefs=()=>{r.innerHTML="";const qq_=L(i,"q")||L(i,"title")||"";r.appendChild(refBtn("tt",L(i,"tt"),qq_));r.appendChild(refBtn("ig",L(i,"ig"),qq_));};paintRefs();
  const ed=document.createElement("details");ed.className="editrefs";const sm=document.createElement("summary");sm.textContent="✏️ Change reference videos";ed.appendChild(sm);
  for(const [k,lab] of [["tt","TikTok link"],["ig","Instagram link"]]){const row=document.createElement("div");row.className="erow";
    const inp=document.createElement("input");inp.type="url";inp.inputMode="url";inp.placeholder="Paste "+lab;inp.value=L(i,k)||"";inp.setAttribute("aria-label",lab);
    const save=()=>{const v=inp.value.trim();if(v&&!/^https?:\/\//i.test(v)){alert("Paste a full link starting with https://");return;}setField(i.id,k,v);paintRefs();};
    inp.onchange=save;
    const del=document.createElement("button");del.type="button";del.className="edel";del.textContent="Delete";del.onclick=()=>{inp.value="";setField(i.id,k,"");paintRefs();};
    const lb=document.createElement("label");lb.textContent=lab;row.appendChild(lb);row.appendChild(inp);row.appendChild(del);ed.appendChild(row);}
  r.after(ed);

  const ee=document.createElement("details");ee.className="editrefs editidea";const es=document.createElement("summary");es.textContent=i.custom?"✏️ Edit this new idea":"✏️ Edit idea";ee.appendChild(es);
  if(i.custom&&!L(i,"title"))ee.open=true;
  const ELAB=[["title","Title"],["sound","Sound"],["hook","On-screen text / hook / caption"],["how","How to shoot"],["says","Says"],["shoot","Shot"],["note","Note"],["flag","Warning"]];
  for(const [k,lab] of ELAB){const row=document.createElement("div");row.className="erow ecol";const lb=document.createElement("label");lb.textContent=lab;
    const big=(k==="how"||k==="hook"||k==="says"||k==="note");const inp=document.createElement(big?"textarea":"input");if(big)inp.rows=k==="how"?5:3;
    inp.value=L(i,k)||"";inp.setAttribute("aria-label",lab);
    inp.onchange=()=>{setField(i.id,k,inp.value);if(i.custom&&k==="title")setField(i.id,"q",inp.value);render(true);};
    row.appendChild(lb);row.appendChild(inp);ee.appendChild(row);}
  if(i.custom){const row=document.createElement("div");row.className="erow ecol";const lb=document.createElement("label");lb.textContent="Solo or team";const sel=document.createElement("select");
    for(const [v,t] of [["solo","Solo"],["duo","Duo"],["team","Team"],["any","Solo or team"]]){const o=document.createElement("option");o.value=v;o.textContent=t;if((S(i.id).kind||"any")===v)o.selected=true;sel.appendChild(o);}
    sel.onchange=()=>{setField(i.id,"kind",sel.value);render(true);};row.appendChild(lb);row.appendChild(sel);ee.appendChild(row);}
  const dr=document.createElement("div");dr.className="erow";const db=document.createElement("button");db.type="button";db.className="edel";
  if(showDel){db.textContent="↩ Restore this idea";db.className="erest";db.onclick=()=>{setField(i.id,"del",false);render();};}
  else{db.textContent="🗑 Delete this idea";db.onclick=()=>{setField(i.id,"del",true);render();toast("Deleted",()=>{setField(i.id,"del",false);render();});};}
  dr.appendChild(db);ee.appendChild(dr);
  ed.after(ee);
  const body=n.querySelector(".body");
  const add=(lab,txt)=>{if(!txt)return;const p=document.createElement("p");const b=document.createElement("b");b.textContent=lab+": ";p.appendChild(b);p.appendChild(document.createTextNode(txt));body.appendChild(p);};
  add(i.cat==="Trend"||i.cat==="Talking sound"?"How the trend works":"How to shoot",L(i,"how"));
  add("Says",L(i,"says"));add("Shot",L(i,"shoot"));add("Format",i.format);add("Note",L(i,"note"));
  if(i.ref_note)add("Reference",i.ref_note);
  const nb=n.querySelector(".notes");const ta=nb.querySelector("textarea");ta.value=s.notes||"";
  const nl=nb.querySelector(".nlinks");const paintLinks=()=>{nl.innerHTML="";for(const u of (ta.value.match(/https?:\/\/[^\s<>"]+/g)||[])){const l=document.createElement("a");l.href=u;l.target="_blank";l.rel="noopener";l.textContent=u.replace(/^https?:\/\/(www\.)?/,"").slice(0,44);nl.appendChild(l);}};paintLinks();
  ta.onchange=()=>{setField(i.id,"notes",ta.value);paintLinks();};
  const st=n.querySelector(".status");
  STATUSES.forEach((lab,k)=>{const b=document.createElement("button");b.type="button";b.className="st s"+k+(k===si?" on":"");b.textContent=lab==="Scripted"?"Script":lab;b.setAttribute("aria-pressed",k===si?"true":"false");
    b.onclick=()=>{setField(i.id,"status",lab);render(true);};st.appendChild(b);});
  const w=n.querySelector(".who");w.value=s.who||"";w.onchange=()=>setField(i.id,"who",w.value.trim());
  return n;
}
let lastSig="";
function render(soft){
  renderChips();renderTop();
  const list=$("#list");
  let shown=IT().filter(match);
  if(f.sort!=="default"){const base=IT().map(i=>i.id);const ix=id=>base.indexOf(id);
    const tsOf=i=>i.custom?parseInt(i.id.slice(1),36):(i.cat==="Our ideas"?1e12+(+i.num||0):0);
    const cmp={new:(a,b)=>tsOf(b)-tsOf(a)||ix(b.id)-ix(a.id),star:(a,b)=>(!!S(b.id).star-!!S(a.id).star)||ix(a.id)-ix(b.id),status:(a,b)=>stIdx(a.id)-stIdx(b.id)||ix(a.id)-ix(b.id),az:(a,b)=>String(L(a,"title")||"").localeCompare(String(L(b,"title")||""))}[f.sort];
    shown=shown.slice().sort(cmp);}
  $("#showing").textContent="Showing "+shown.length+" of "+IT().length;
  if(soft){ // keep focus/open details
    const act=document.activeElement;if(act&&list.contains(act)&&(act.tagName==="INPUT"||act.tagName==="TEXTAREA"))return;
  }
  const open=new Set([...list.querySelectorAll("details[open]")].map(d=>d.closest(".card").dataset.id));
  list.innerHTML="";
  if(!shown.length){list.innerHTML='<p class="empty">No ideas match. Clear a filter or try another word.</p>';return;}
  const frag=document.createDocumentFragment();
  for(const i of shown){const c=card(i);if(open.has(i.id))c.querySelector("details").open=true;frag.appendChild(c);}
  list.appendChild(frag);
}
let qt;$("#q").addEventListener("input",e=>{clearTimeout(qt);qt=setTimeout(()=>{f.q=e.target.value.trim();render();},150);});
function openMenu(){$("#myName").value=me;$("#modeNote").textContent=key?"Status, assignments, stars and notes are shared live with everyone on the team link.":"You opened the board without the team link, so changes stay on this phone. Ask Bunmi for the team link to share.";$("#menu").showModal();}
$("#menuBtn").onclick=openMenu;
$("#myName").onchange=e=>{me=e.target.value.trim();LS("gef_me",me);render();};
$("#menu").addEventListener("close",()=>{me=$("#myName").value.trim();LS("gef_me",me);render();});
$("#exportBtn").onclick=()=>{const out=IT().map(i=>({id:i.id,category:i.cat,title:i.title,status:STATUSES[stIdx(i.id)],assigned:S(i.id).who||"",star:!!S(i.id).star,notes:S(i.id).notes||"",tiktok:L(i,"tt")||"",instagram:L(i,"ig")||""}));
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({exported:new Date().toISOString(),items:out},null,1)],{type:"application/json"}));a.download="gef-content-status.json";a.click();};
$("#importFile").onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const d=JSON.parse(await file.text());for(const x of d.items||[]){if(!IT().find(i=>i.id===x.id))continue;
  if(x.status)setField(x.id,"status",x.status);if(x.assigned!==undefined)setField(x.id,"who",x.assigned);if(x.star!==undefined)setField(x.id,"star",!!x.star);if(x.notes)setField(x.id,"notes",x.notes);}render();alert("Imported");}catch(err){alert("That file could not be read.");}};
window.addEventListener("online",()=>{flush();pull();});
setInterval(()=>{flush();if(document.visibilityState==="visible")pull();},20000);
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")pull();});
$("#fBtn").onclick=()=>{const p=$("#fPanel");p.hidden=!p.hidden;$("#fBtn").setAttribute("aria-expanded",String(!p.hidden));};
$("#fDone").onclick=()=>{$("#fPanel").hidden=true;$("#fBtn").setAttribute("aria-expanded","false");window.scrollTo({top:0,behavior:"smooth"});};
$("#fClear").onclick=()=>{clearF();showDel=false;render();};
const nb_=document.createElement("button");nb_.type="button";nb_.id="newIdea";nb_.textContent="＋ New idea";nb_.setAttribute("aria-label","Add a new idea");
nb_.onclick=()=>{const id="c"+Date.now().toString(36);setField(id,"isnew",true);showDel=false;f.cat="";f.q="";const qq=$("#q");if(qq)qq.value="";render();
  setTimeout(()=>{const c=document.querySelector('.card[data-id="'+id+'"]');if(c){c.scrollIntoView({behavior:"smooth",block:"center"});const t=c.querySelector(".editidea input");if(t)t.focus();}},80);};
document.body.appendChild(nb_);
render();updSync();pull();flush();
})();
