const KEY_HASH="d9e1025a03c66ffc8f60c49f309793c6ed4bc4dca3d75bb7e57e14ebc9f8a049";
const FIELDS=["status","who","star","notes","tt","ig","title","sound","hook","how","says","shoot","note","flag","del","isnew","kind","phase","q"];
const LIM={notes:3000,how:3000,hook:1500,says:1500,note:1500,shoot:800,tt:600,ig:600,title:300,sound:400,flag:400,q:300};
async function sha(s){const b=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,"0")).join("");}
function J(o,s=200){return new Response(JSON.stringify(o),{status:s,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}});}
async function init(env){await env.DB.prepare("CREATE TABLE IF NOT EXISTS st (id TEXT PRIMARY KEY, v TEXT NOT NULL, t INTEGER NOT NULL)").run();}
async function all(env){await init(env);const r=await env.DB.prepare("SELECT id,v,t FROM st").all();const o={};for(const x of r.results||[]){o[x.id]=JSON.parse(x.v);}return o;}
export default {async fetch(req,env){
 const u=new URL(req.url);
 if(u.pathname==="/api/state"&&req.method==="GET"){return J({items:await all(env),now:Date.now()});}
 if(u.pathname==="/api/check"){const k=req.headers.get("x-key")||"";return J({ok:(await sha(k))===KEY_HASH});}
 if(u.pathname==="/api/item"&&req.method==="POST"){
  const k=req.headers.get("x-key")||""; if((await sha(k))!==KEY_HASH) return J({error:"team key needed"},401);
  let b; try{b=await req.json();}catch(e){return J({error:"bad json"},400);}
  const id=String(b.id||"").slice(0,40); if(!/^[a-z0-9_-]+$/i.test(id)) return J({error:"bad id"},400);
  await init(env);
  const row=await env.DB.prepare("SELECT v FROM st WHERE id=?1").bind(id).first();
  const cur=row?JSON.parse(row.v):{t:{}}; cur.t=cur.t||{};
  const now=Date.now();
  for(const f of FIELDS){ if(b[f]===undefined) continue; const ts=Math.min(+((b.t||{})[f])||now,now);
    if(ts>=(cur.t[f]||0)){ let v=b[f]; if(f==="star"||f==="del"||f==="isnew") v=!!v; else v=String(v).slice(0,LIM[f]||60); cur[f]=v; cur.t[f]=ts; } }
  cur.by=String(b.by||"").slice(0,40);
  await env.DB.prepare("INSERT INTO st (id,v,t) VALUES (?1,?2,?3) ON CONFLICT(id) DO UPDATE SET v=excluded.v,t=excluded.t").bind(id,JSON.stringify(cur),now).run();
  return J({ok:true,id,item:cur});
 }
 if(u.pathname==="/api/item"&&req.method==="DELETE"){const k=req.headers.get("x-key")||"";if((await sha(k))!==KEY_HASH)return J({error:"team key needed"},401);const id=u.searchParams.get("id")||"";await init(env);await env.DB.prepare("DELETE FROM st WHERE id=?1").bind(id).run();return J({ok:true,deleted:id});}
 if(u.pathname.startsWith("/api/")) return J({error:"not found"},404);
 return env.ASSETS.fetch(req);
}};
