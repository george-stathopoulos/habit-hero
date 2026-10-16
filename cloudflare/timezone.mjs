// IANA timezone support. All occurrence dates are computed server-side.
import {authorizedParent} from './family-api.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const json=(data,status=200)=>Response.json(data,{status,headers:{'cache-control':'no-store','x-content-type-options':'nosniff'}});
export function localDay(timezone='UTC',instant=new Date()){
 const tz=typeof timezone==='string'?timezone:'UTC';
 let parts;
 try{parts=new Intl.DateTimeFormat('en-US',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(instant)}
 catch{parts=new Intl.DateTimeFormat('en-US',{timeZone:'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(instant)}
 const get=type=>parts.find(part=>part.type===type).value;
 return get('year')+'-'+get('month')+'-'+get('day');
}
export async function setFamilyTimezone(request,env){
 if(request.headers.get('origin')!==origin)return json({detail:'Forbidden'},403);
 if(!(request.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))
  return json({detail:'JSON required'},415);
 const actor=await authorizedParent(request,env);
 if(!actor)return json({detail:'Not authenticated'},401);
 let data;
 try{const raw=await request.text();if(raw.length>256)return json({detail:'Request too large'},413);data=JSON.parse(raw)}
 catch{return json({detail:'Invalid JSON'},400)}
 const tz=data?.timezone;
 if(typeof tz!=='string'||tz.length>80||tz.length<2)return json({detail:'Invalid timezone'},400);
 try{new Intl.DateTimeFormat('en-US',{timeZone:tz}).format(new Date())}
 catch{return json({detail:'Unknown timezone'},400)}
 try{
  await env.DB.prepare(`INSERT INTO family_settings (family_id,timezone,updated_at) VALUES (?,?,?)
   ON CONFLICT(family_id) DO UPDATE SET timezone=excluded.timezone,updated_at=excluded.updated_at`)
   .bind(actor.family_id,tz,new Date().toISOString()).run();
  return json({timezone:tz});
 }catch{return json({detail:'Could not save timezone'},503)}
}
