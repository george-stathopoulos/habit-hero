import {occurrenceControl} from './lifecycle-state.mjs';
import {scheduleStatus,slotAvailability} from './schedule.mjs';
import {localDay} from './timezone.mjs';
import {occurrenceKey,occurrenceSql} from './occurrence.mjs';
// Child access via parent-approved pairing, never the parent's authentication cookie.
// Intended for a separate child device/browser profile; never share a parent session.
import {authorizedParent} from './family-api.mjs';
const base='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const cookieName='__Host-hh_child';
const headers={'cache-control':'no-store','x-content-type-options':'nosniff'};
const json=(body,status=200,extra={})=>Response.json(body,{status,headers:{...headers,...extra}});
const random=()=>crypto.getRandomValues(new Uint8Array(24));
const b64=a=>btoa(String.fromCharCode(...a)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const sha=async text=>b64(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))));
const validUUID=value=>typeof value==='string'&&/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
const childCookie=token=>cookieName+'='+token+'; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800';
const clearCookie=cookieName+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
function cookie(request){
 const item=(request.headers.get('cookie')||'').split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='));
 return item?item.slice(cookieName.length+1):null;
}
async function bodyOf(req){
 if(req.headers.get('origin')!==base)return {error:json({detail:'Forbidden'},403)};
 if(!(req.headers.get('content-type')||'').toLowerCase().startsWith('application/json'))return {error:json({detail:'JSON required'},415)};
 try{
  const raw=await req.text();
  if(raw.length>512)return {error:json({detail:'Request too large'},413)};
  const body=JSON.parse(raw);
  if(!body||typeof body!=='object'||Array.isArray(body))throw Error('Bad input');
  return {body};
 }catch{return {error:json({detail:'Invalid JSON'},400)}}
}
export async function makePairing(request,env){
 const parsed=await bodyOf(request);
 if(parsed.error)return parsed.error;
 const parent=await authorizedParent(request,env);
 if(!parent)return json({detail:'Not authenticated'},401);
 const childId=parsed.body.child_id;
 if(!validUUID(childId))return json({detail:'Invalid child'},400);
 try{
  const child=await env.DB.prepare('SELECT id FROM child_profiles WHERE family_id=? AND id=? AND deleted_at IS NULL')
   .bind(parent.family_id,childId).first();
  if(!child)return json({detail:'Child not found'},404);
  const token=b64(random()),now=new Date(),expires=new Date(now.getTime()+10*60*1000);
  await env.DB.prepare(`INSERT INTO child_device_pairings
   (id,family_id,child_id,token_hash,created_by,created_at,expires_at)
   VALUES (?,?,?,?,?,?,?)`).bind(crypto.randomUUID(),parent.family_id,childId,await sha(token),
   parent.parent_id,now.toISOString(),expires.toISOString()).run();
  return json({pairing_code:token,expires_at:expires.toISOString()},201);
 }catch{return json({detail:'Could not create pairing'},503)}
}
export async function pairDevice(request,env){
 const parsed=await bodyOf(request);
 if(parsed.error)return parsed.error;
 const code=parsed.body.code;
 if(typeof code!=='string'|| !/^[A-Za-z0-9_-]{32}$/.test(code))return json({detail:'Invalid pairing code'},400);
 const now=new Date(),expires=new Date(now.getTime()+7*86400000);
 const token=b64(random()),tokenHash=await sha(token),codeHash=await sha(code);
 try{
  // Atomically consume code and create a child-only session. D1 batch executes
  // the dependent INSERT SELECT in a single transaction with no parent privileges.
  const results=await env.DB.batch([
   env.DB.prepare(`UPDATE child_device_pairings SET consumed_at=?
    WHERE token_hash=? AND consumed_at IS NULL AND expires_at>?
    AND EXISTS(SELECT 1 FROM child_profiles c WHERE c.family_id=child_device_pairings.family_id
      AND c.id=child_device_pairings.child_id AND c.deleted_at IS NULL)`)
    .bind(now.toISOString(),codeHash,now.toISOString()),
   env.DB.prepare(`INSERT INTO auth_sessions
      (id,child_id,family_id,role,token_hash,created_at,expires_at)
      SELECT ?,p.child_id,p.family_id,'child',?,?,?
      FROM child_device_pairings p WHERE p.token_hash=? AND p.consumed_at=?
      AND p.expires_at>?`)
    .bind(crypto.randomUUID(),tokenHash,now.toISOString(),expires.toISOString(),
      codeHash,now.toISOString(),now.toISOString())
  ]);
  if(results[0]?.meta?.changes!==1||results[1]?.meta?.changes!==1)
    return json({detail:'Pairing code invalid, expired, or already used'},401);
  return json({ok:true,role:'child'},200,{'set-cookie':childCookie(token)});
 }catch{return json({detail:'Pairing unavailable'},503)}
}
export async function authorizedChild(request,env){
 const token=cookie(request);
 if(!env.DB||!token|| !/^[A-Za-z0-9_-]{32}$/.test(token))return null;
 try{
  return await env.DB.prepare(`SELECT s.id AS session_id,s.family_id,s.child_id,
    c.display_name AS child_name,c.avatar_id,(c.pin_hash IS NOT NULL) AS pin_enabled,COALESCE(settings.timezone,'UTC') AS timezone
   FROM auth_sessions s JOIN child_profiles c ON c.id=s.child_id AND c.family_id=s.family_id
   JOIN families f ON f.id=s.family_id
   LEFT JOIN family_settings settings ON settings.family_id=f.id
   WHERE s.token_hash=? AND s.role='child' AND s.parent_id IS NULL
    AND s.revoked_at IS NULL AND s.expires_at>?
    AND c.deleted_at IS NULL AND f.deleted_at IS NULL
    AND (c.pin_hash IS NULL OR s.pin_verified_at IS NOT NULL)`)
    .bind(await sha(token),new Date().toISOString()).first();
 }catch{return null}
}
export async function childMe(request,env){
 const actor=await authorizedChild(request,env);
 return actor?json({role:'child',id:actor.child_id,name:actor.child_name,avatar_id:actor.avatar_id,pin_enabled:!!actor.pin_enabled}):json({detail:'Not authenticated'},401);
}
export async function childActivities(request,env){
 const child=await authorizedChild(request,env);
 if(!child)return json({detail:'Not authenticated'},401);
 try{
  const today=localDay(child.timezone);
  const rows=await env.DB.prepare(`SELECT h.id AS habit_id,h.name_el AS habit_name,h.points,h.emoji,
    h.description_el,h.why_important_el,h.frequency_type,h.frequency_count,h.retry_delay_minutes,h.frequency_days_json,
    s.id AS completion_id,s.slot_index,s.status AS submission_status,s.submitted_at
    FROM habit_assignments a JOIN habits h ON h.id=a.habit_id AND h.family_id=a.family_id
    LEFT JOIN completion_submissions s ON s.family_id=a.family_id AND s.child_id=a.child_id AND s.habit_id=a.habit_id
      AND s.occurrence_date=${occurrenceSql}
    WHERE a.family_id=? AND a.child_id=? AND h.active=1 AND h.deleted_at IS NULL
    ORDER BY h.name_el,s.slot_index,s.submitted_at DESC,s.rowid DESC LIMIT 1000`).bind(today,today,today,child.family_id,child.child_id).all();
  const controlRows=await env.DB.prepare('SELECT * FROM habit_occurrence_controls WHERE family_id=? AND child_id=?').bind(child.family_id,child.child_id).all();
  const controls=new Map((controlRows.results||[]).map(c=>[c.habit_id+'|'+c.occurrence_date+'|'+c.slot_index,c]));
  const grouped=new Map();
  for(const row of rows.results||[]){
   if(!grouped.has(row.habit_id))grouped.set(row.habit_id,[]);
   grouped.get(row.habit_id).push(row);
  }
  const activities=[];
  for(const group of grouped.values()){
   const first=group[0];
   const target=first.frequency_type==='once'?1:Math.min(5,Math.max(1,Number(first.frequency_count)||1));
   for(let slot=1;slot<=target;slot++){
    const existing=group.find(x=>x.slot_index===slot);
    const period=occurrenceKey(first.frequency_type,today),control=controls.get(first.habit_id+'|'+period+'|'+slot);
    const retry=existing?.submission_status==='rejected'&&control?.retry_for===existing.completion_id;
    const available=slotAvailability(first,retry?group.map(x=>x===existing?{...x,submission_status:null}:x):group,slot,child.timezone);
    const deferred=!existing&&control?.deferred_until>new Date().toISOString();
    activities.push({...first,...available,slot_index:slot,slot_total:target,
      ...(deferred?{schedule_available:false,availability_reason:'Για αργότερα · '+new Intl.DateTimeFormat('el-GR',{timeZone:child.timezone,hour:'2-digit',minute:'2-digit'}).format(new Date(control.deferred_until))}:{}),
      deferred_until:deferred?control.deferred_until:null,retry_available:retry,
      submission_status:retry?null:existing?.submission_status||null,
      submitted_at:existing?.submitted_at||null});
   }
  }
  return json({name:child.child_name,activities,date:today});
 }catch{return json({detail:'Could not load habits'},503)}
}
export async function childSubmit(request,env){
 const parsed=await bodyOf(request);if(parsed.error)return parsed.error;
 const child=await authorizedChild(request,env);if(!child)return json({detail:'Not authenticated'},401);
 return submitHabitForActor(child,parsed.body,env);
}
export async function submitHabitForActor(child,body,env){
 const habitId=body.habit_id,slot=body.slot_index??1;
 if(!validUUID(habitId)||!Number.isInteger(slot)||slot<1||slot>5)return json({detail:'Invalid habit slot'},400);
 try{
  const assigned=await env.DB.prepare(`SELECT h.id,h.frequency_type,h.frequency_count,h.retry_delay_minutes,h.frequency_days_json
   FROM habit_assignments a JOIN habits h ON h.id=a.habit_id AND h.family_id=a.family_id
   WHERE a.family_id=? AND a.child_id=? AND a.habit_id=? AND h.active=1 AND h.deleted_at IS NULL`)
   .bind(child.family_id,child.child_id,habitId).first();
  if(!assigned)return json({detail:'Habit not assigned'},404);
  const schedule=scheduleStatus(assigned.frequency_days_json,child.timezone);
  if(!schedule.schedule_available)return json({detail:'Η αποστολή είναι διαθέσιμη: '+schedule.schedule_label},409);
  const maximum=assigned.frequency_type==='once'?1:Math.min(5,Math.max(1,Number(assigned.frequency_count)||1));
  if(slot>maximum)return json({detail:'Habit slot not configured'},400);
  const now=new Date().toISOString(),period=occurrenceKey(assigned.frequency_type,localDay(child.timezone));
  const current=await env.DB.prepare(`SELECT id AS completion_id,status AS submission_status,slot_index,submitted_at FROM completion_submissions
    WHERE family_id=? AND child_id=? AND habit_id=? AND occurrence_date=? ORDER BY submitted_at DESC,rowid DESC`)
    .bind(child.family_id,child.child_id,habitId,period).all();
  const entries=current.results||[];
  const existing=entries.find(x=>x.slot_index===slot),control=await occurrenceControl(env,child,habitId,period,slot);
  if(existing&&(existing.submission_status!=='rejected'||control?.retry_for!==existing.completion_id))return json({detail:'Already submitted; parent retry permission required'},409);
  if(control?.deferred_until>now)return json({detail:'Η αποστολή έχει μεταφερθεί για αργότερα. Επιλέξτε «Είμαι έτοιμος τώρα» για να επιστρέψετε.'},409);
  if(slot>1){
   const previous=entries.find(x=>x.slot_index===slot-1);
   if(!previous)return json({detail:'Complete the previous occurrence first'},409);
   if(['weekly','monthly'].includes(assigned.frequency_type)&&
      localDay(child.timezone,new Date(previous.submitted_at))===localDay(child.timezone,new Date(now)))
    return json({detail:'Wait until another day for the next weekly or monthly completion'},429);
   const delay=Math.max(maximum>1?30:0,Number(assigned.retry_delay_minutes)||0);
   if(delay>0&&Date.now()-Date.parse(previous.submitted_at)<delay*60000)
    return json({detail:'Please wait '+delay+' minutes between repetitions'},429);
  }
  const result=await env.DB.prepare(`INSERT INTO completion_submissions
   (id,family_id,child_id,habit_id,occurrence_date,slot_index,status,submitted_at,idempotency_key)
   SELECT ?,?,?,?,?,?,'pending',?,? WHERE EXISTS(SELECT 1 FROM habits h JOIN habit_assignments a ON a.habit_id=h.id AND a.family_id=h.family_id WHERE h.id=? AND h.family_id=? AND a.child_id=? AND h.active=1 AND h.deleted_at IS NULL)
    AND (? IS NULL OR EXISTS(SELECT 1 FROM habit_occurrence_controls c WHERE c.family_id=? AND c.child_id=? AND c.habit_id=? AND c.occurrence_date=? AND c.slot_index=? AND c.retry_for=?))`)
   .bind(crypto.randomUUID(),child.family_id,child.child_id,habitId,period,slot,now,
     'child-'+child.child_id+'-'+habitId+'-'+period+'-'+slot+'-'+(existing?.completion_id||'initial'),habitId,child.family_id,child.child_id,
     existing?.completion_id||null,child.family_id,child.child_id,habitId,period,slot,existing?.completion_id||null).run();
  if(result.meta?.changes!==1)return json({detail:'Η αποστολή άλλαξε. Ανανεώστε τη σελίδα.'},409);
  return json({status:'pending',slot_index:slot},201);
 }catch(e){
  if(/constraint|UNIQUE/i.test(String(e)))return json({detail:'Already submitted for this occurrence'},409);
  return json({detail:'Could not submit habit'},503);
 }
}
export async function childLogout(request,env){
 if(request.headers.get('origin')!==base)return json({detail:'Forbidden'},403);
 const token=cookie(request);
 if(token&&env.DB){
  try{await env.DB.prepare("UPDATE auth_sessions SET revoked_at=? WHERE token_hash=? AND role='child'")
     .bind(new Date().toISOString(),await sha(token)).run();}
  catch{return json({detail:'Logout unavailable'},503)}
 }
 return json({ok:true},200,{'set-cookie':clearCookie});
}
export async function revokeChildDevices(request,env){
 const parsed=await bodyOf(request);
 if(parsed.error)return parsed.error;
 const parent=await authorizedParent(request,env);
 if(!parent)return json({detail:'Not authenticated'},401);
 if(!validUUID(parsed.body.child_id))return json({detail:'Invalid child'},400);
 try{
  const now=new Date().toISOString();
  await env.DB.batch([
   env.DB.prepare(`UPDATE auth_sessions SET revoked_at=?
     WHERE family_id=? AND child_id=? AND role='child' AND revoked_at IS NULL`)
     .bind(now,parent.family_id,parsed.body.child_id),
   env.DB.prepare(`UPDATE child_device_pairings SET consumed_at=?
     WHERE family_id=? AND child_id=? AND consumed_at IS NULL`)
     .bind(now,parent.family_id,parsed.body.child_id)
  ]);
  return json({ok:true});
 }catch{return json({detail:'Could not revoke access'},503)}
}
