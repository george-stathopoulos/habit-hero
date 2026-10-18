import {authorizedParent} from './family-api.mjs';
import {authorizedChild} from './child-auth.mjs';
import {localDay} from './timezone.mjs';
import {occurrenceKey} from './occurrence.mjs';
import {slotAvailability} from './schedule.mjs';
const origin='https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const reply=(body,status=200)=>Response.json(body,{status,headers:{'cache-control':'no-store'}});
const encode=bytes=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const decode=text=>Uint8Array.from(atob(text.replaceAll('-','+').replaceAll('_','/').padEnd(Math.ceil(text.length/4)*4,'=')),c=>c.charCodeAt(0));
async function actorFor(req,env){const role=new URL(req.url).searchParams.get('role');const parent=role==='child'?null:await authorizedParent(req,env);if(parent)return {...parent,subject_id:'parent',is_parent:true};const child=role==='parent'?null:await authorizedChild(req,env);return child?{...child,subject_id:child.child_id}:null}
async function body(req){if(req.headers.get('origin')!==origin)return {error:reply({detail:'Forbidden'},403)};if(!(req.headers.get('content-type')||'').startsWith('application/json'))return {error:reply({detail:'JSON required'},415)};try{const raw=await req.text();if(raw.length>3000)return {error:reply({detail:'Request too large'},413)};const value=JSON.parse(raw);if(!value||Array.isArray(value)||typeof value!=='object')throw Error();return {value}}catch{return {error:reply({detail:'Invalid JSON'},400)}}}
async function configuration(env){let row=await env.DB.prepare("SELECT * FROM push_configuration WHERE id='vapid'").bind().first();if(row)return row;
 const keys=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']),publicKey=encode(await crypto.subtle.exportKey('raw',keys.publicKey)),privateJwk=JSON.stringify(await crypto.subtle.exportKey('jwk',keys.privateKey));
 await env.DB.prepare("INSERT OR IGNORE INTO push_configuration(id,public_key,private_jwk,created_at) VALUES('vapid',?,?,?)").bind(publicKey,privateJwk,new Date().toISOString()).run();
 return env.DB.prepare("SELECT * FROM push_configuration WHERE id='vapid'").bind().first();
}
export async function notificationSettings(req,env){const actor=await authorizedParent(req,env);if(!actor)return reply({detail:'Not authenticated'},401);try{const rows=await env.DB.prepare('SELECT * FROM notification_preferences WHERE family_id=?').bind(actor.family_id).all();const devices=await env.DB.prepare('SELECT subject_id,COUNT(*) AS devices FROM push_subscriptions WHERE family_id=? GROUP BY subject_id').bind(actor.family_id).all();return reply({preferences:rows.results||[],devices:devices.results||[],timezone:actor.timezone})}catch{return reply({detail:'Could not load reminders'},503)}}
export async function saveNotificationSettings(req,env){const {value,error}=await body(req);if(error)return error;const actor=await authorizedParent(req,env);if(!actor)return reply({detail:'Not authenticated'},401);
 const time=/^(?:[01]\d|2[0-3]):[0-5]\d$/;if(typeof value.subject_id!=='string'||!time.test(value.reminder_time)||!time.test(value.quiet_start)||!time.test(value.quiet_end)||typeof value.enabled!=='boolean'||typeof value.approvals!=='boolean'||typeof value.love!=='boolean')return reply({detail:'Invalid reminder settings'},400);
 try{if(value.subject_id!=='parent'&&!await env.DB.prepare('SELECT id FROM child_profiles WHERE family_id=? AND id=? AND deleted_at IS NULL').bind(actor.family_id,value.subject_id).first())return reply({detail:'Child not found'},404);
 await env.DB.prepare(`INSERT INTO notification_preferences(family_id,subject_id,enabled,reminder_time,quiet_start,quiet_end,approvals,love,updated_at) VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(family_id,subject_id) DO UPDATE SET enabled=excluded.enabled,reminder_time=excluded.reminder_time,quiet_start=excluded.quiet_start,quiet_end=excluded.quiet_end,approvals=excluded.approvals,love=excluded.love,updated_at=excluded.updated_at`).bind(actor.family_id,value.subject_id,value.enabled?1:0,value.reminder_time,value.quiet_start,value.quiet_end,value.approvals?1:0,value.love?1:0,new Date().toISOString()).run();return reply({ok:true})}catch{return reply({detail:'Could not save reminders'},503)}
}
export async function pushKey(req,env){const actor=await actorFor(req,env);if(!actor)return reply({detail:'Not authenticated'},401);try{return reply({public_key:(await configuration(env)).public_key})}catch{return reply({detail:'Push configuration unavailable'},503)}}
export async function subscribePush(req,env){const {value,error}=await body(req);if(error)return error;const actor=await actorFor(req,env);if(!actor)return reply({detail:'Not authenticated'},401);
 let endpoint;try{endpoint=new URL(value.endpoint);if(endpoint.protocol!=='https:'||endpoint.port||endpoint.username||endpoint.password||endpoint.href.length>2000||!(/^(fcm\.googleapis\.com|web\.push\.apple\.com|([a-z0-9-]+\.)*push\.services\.mozilla\.com|[a-z0-9.-]+\.notify\.windows\.com)$/.test(endpoint.hostname)))throw Error()}catch{return reply({detail:'Unsupported push endpoint'},400)}
 try{const old=await env.DB.prepare('SELECT family_id,subject_id FROM push_subscriptions WHERE endpoint=?').bind(endpoint.href).first();if(old&&(old.family_id!==actor.family_id||old.subject_id!==actor.subject_id))return reply({detail:'Απενεργοποιήστε τις ειδοποιήσεις σε αυτόν τον browser και ενεργοποιήστε τις ξανά για το τρέχον προφίλ.'},409);
 const count=await env.DB.prepare('SELECT COUNT(*) AS n FROM push_subscriptions WHERE family_id=? AND subject_id=?').bind(actor.family_id,actor.subject_id).first();if(!old&&count.n>=8)return reply({detail:'Device notification limit reached'},409);
 const now=new Date().toISOString();await env.DB.prepare(`INSERT INTO push_subscriptions(id,family_id,subject_id,endpoint,created_at,updated_at) VALUES(?,?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET updated_at=excluded.updated_at`).bind(crypto.randomUUID(),actor.family_id,actor.subject_id,endpoint.href,now,now).run();return reply({ok:true})}catch{return reply({detail:'Could not enable notifications'},503)}}
export async function unsubscribePush(req,env){const {value,error}=await body(req);if(error)return error;const actor=await actorFor(req,env);if(!actor)return reply({detail:'Not authenticated'},401);try{await env.DB.prepare('DELETE FROM push_subscriptions WHERE family_id=? AND subject_id=? AND endpoint=?').bind(actor.family_id,actor.subject_id,value.endpoint||'').run();return reply({ok:true})}catch{return reply({detail:'Could not disable notifications'},503)}}
export function reminderDue(pref,timezone,instant=new Date()){
 if(!pref.enabled)return false;const clock=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(instant);
 const quiet=pref.quiet_start===pref.quiet_end?false:pref.quiet_start<pref.quiet_end?clock>=pref.quiet_start&&clock<pref.quiet_end:clock>=pref.quiet_start||clock<pref.quiet_end;
 return !quiet&&clock>=pref.reminder_time;
}
async function sendPush(endpoint,config){
 const header=encode(new TextEncoder().encode(JSON.stringify({typ:'JWT',alg:'ES256'}))),payload=encode(new TextEncoder().encode(JSON.stringify({aud:new URL(endpoint).origin,exp:Math.floor(Date.now()/1000)+3600,sub:'mailto:habit.hero.kids@gmail.com'}))),unsigned=header+'.'+payload;
 const key=await crypto.subtle.importKey('jwk',JSON.parse(config.private_jwk),{name:'ECDSA',namedCurve:'P-256'},false,['sign']);const signature=encode(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},key,new TextEncoder().encode(unsigned)));
 return fetch(endpoint,{method:'POST',headers:{Authorization:'vapid t='+unsigned+'.'+signature+', k='+config.public_key,TTL:'3600',Urgency:'normal'}});
}
export async function deliverReminders(env){
 const now=new Date(),rows=await env.DB.prepare(`SELECT s.*,p.enabled,p.reminder_time,p.quiet_start,p.quiet_end,p.approvals,p.love,COALESCE(f.timezone,'UTC') AS timezone
 FROM push_subscriptions s JOIN notification_preferences p ON p.family_id=s.family_id AND p.subject_id=s.subject_id LEFT JOIN family_settings f ON f.family_id=s.family_id JOIN families family ON family.id=s.family_id WHERE p.enabled=1 AND family.deleted_at IS NULL ORDER BY s.updated_at LIMIT 20`).bind().all();
 if(!rows.results?.length)return;const config=await configuration(env);
 for(const sub of rows.results){try{await env.DB.prepare('UPDATE push_subscriptions SET updated_at=? WHERE id=?').bind(now.toISOString(),sub.id).run();if(!reminderDue(sub,sub.timezone,now))continue;const day=localDay(sub.timezone,now);let kind='habit';
  if(sub.subject_id==='parent'){
   const pending=sub.approvals?await env.DB.prepare("SELECT COUNT(*) AS n FROM completion_submissions WHERE family_id=? AND status='pending'").bind(sub.family_id).first():{n:0};
   const weekday=new Date(day+'T12:00:00Z').getUTCDay();const love=sub.love&&weekday===1?await env.DB.prepare("SELECT COUNT(*) AS n FROM family_messages WHERE family_id=? AND created_at>=?").bind(sub.family_id,new Date(now.getTime()-7*86400000).toISOString()).first():{n:1};
   if(!pending.n&&love.n)continue;kind=pending.n?'approvals':'love';
  }else{
   const habits=await env.DB.prepare(`SELECT h.* FROM habits h JOIN habit_assignments a ON a.family_id=h.family_id AND a.habit_id=h.id JOIN child_profiles c ON c.id=a.child_id AND c.family_id=a.family_id WHERE a.family_id=? AND a.child_id=? AND h.active=1 AND h.deleted_at IS NULL AND c.deleted_at IS NULL LIMIT 200`).bind(sub.family_id,sub.subject_id).all();
   const attempts=await env.DB.prepare('SELECT id AS completion_id,habit_id,occurrence_date,slot_index,status AS submission_status,submitted_at FROM completion_submissions WHERE family_id=? AND child_id=? AND occurrence_date IN (?,?,?,?) ORDER BY submitted_at DESC,rowid DESC').bind(sub.family_id,sub.subject_id,day,occurrenceKey('weekly',day),occurrenceKey('monthly',day),'1970-01-01').all();
   const controls=await env.DB.prepare('SELECT * FROM habit_occurrence_controls WHERE family_id=? AND child_id=? AND occurrence_date IN (?,?,?,?)').bind(sub.family_id,sub.subject_id,day,occurrenceKey('weekly',day),occurrenceKey('monthly',day),'1970-01-01').all();let available=false;
   for(const h of habits.results||[]){const period=occurrenceKey(h.frequency_type,day),entries=(attempts.results||[]).filter(a=>a.habit_id===h.id&&a.occurrence_date===period);
    for(let slot=1;slot<=(h.frequency_type==='once'?1:h.frequency_count||1);slot++){
     const existing=entries.find(a=>a.slot_index===slot),control=(controls.results||[]).find(c=>c.habit_id===h.id&&c.occurrence_date===period&&c.slot_index===slot),retry=existing?.submission_status==='rejected'&&control?.retry_for===existing.completion_id;
     if(existing&&!retry)continue;if(control?.deferred_until>now.toISOString())continue;
     if(slotAvailability(h,retry?entries.map(a=>a===existing?{...a,submission_status:null}:a):entries,slot,sub.timezone,now).schedule_available){available=true;break}
    }if(available)break;
   }
   if(!available)continue;
  }
  const delivery=kind+'-'+day;const claim=await env.DB.prepare('INSERT OR IGNORE INTO notification_deliveries(subscription_id,delivery_key,created_at) VALUES(?,?,?)').bind(sub.id,delivery,now.toISOString()).run();if(!claim.meta?.changes)continue;
  try{const result=await sendPush(sub.endpoint,config);if(result.status===404||result.status===410)await env.DB.prepare('DELETE FROM push_subscriptions WHERE id=?').bind(sub.id).run();else if(!result.ok)await env.DB.prepare('DELETE FROM notification_deliveries WHERE subscription_id=? AND delivery_key=?').bind(sub.id,delivery).run()}catch{await env.DB.prepare('DELETE FROM notification_deliveries WHERE subscription_id=? AND delivery_key=?').bind(sub.id,delivery).run()}
  await env.DB.prepare('UPDATE push_subscriptions SET updated_at=? WHERE id=?').bind(now.toISOString(),sub.id).run();
 }catch{/* One unavailable subscription must not stop other families. */}}
 await env.DB.prepare('DELETE FROM notification_deliveries WHERE created_at<?').bind(new Date(now.getTime()-35*86400000).toISOString()).run();
}
