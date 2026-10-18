// Privacy: authenticated export of the requesting parent's family records.
// Do not include session tokens, pairing codes, OAuth claims or authentication secrets.
import {authorizedParent} from './family-api.mjs';
const specs=[
 ['custom_routines','custom_routines','id,name,created_at,updated_at'],
 ['child_routine_steps','child_routine_steps','child_id,habit_id,routine_key,step_order,updated_at'],
 ['reminder_preferences','notification_preferences','subject_id,enabled,reminder_time,quiet_start,quiet_end,approvals,love,updated_at'],
 ['habit_lifecycle','habit_lifecycle_events','id,child_id,habit_id,completion_id,action,detail,created_at'],
 ['occurrence_controls','habit_occurrence_controls','child_id,habit_id,occurrence_date,slot_index,deferred_until,retry_for,updated_at'],
 ['messages','family_messages','id,child_id,created_by,body,gift_points,created_at,read_at,claimed_at'],
 ['children','child_profiles','id,display_name,age_band,avatar_id,avatar_level,created_at,updated_at'],
 ['habits','habits','id,name_el,name_en,points,emoji,frequency_type,active,created_at,updated_at,deleted_at'],
 ['habit_assignments','habit_assignments','habit_id,child_id,assigned_at'],
 ['completions','completion_submissions','id,child_id,habit_id,occurrence_date,status,submitted_at,reviewed_at,points_awarded'],
 ['point_ledger','point_ledger','id,child_id,delta,reason,completion_id,redemption_id,created_at'],
 ['rewards','reward_catalog','id,name_el,description_el,points_cost,emoji,recurring,active,created_at,updated_at'],
 ['reward_eligibility','reward_eligibility','reward_id,child_id'],
 ['redemptions','reward_redemptions','id,reward_id,child_id,points_spent,status,requested_at,resolved_at']
];
export async function exportFamily(request,env){
 const actor=await authorizedParent(request,env);
 if(!actor)return Response.json({detail:'Not authenticated'},{status:401,headers:{'cache-control':'no-store'}});
 try{
  const payload={version:1,exported_at:new Date().toISOString(),family:{name:actor.family_name},records:{}};
  for(const [name,table,fields] of specs){
   const result=await env.DB.prepare('SELECT '+fields+' FROM '+table+' WHERE family_id=? LIMIT 10001')
     .bind(actor.family_id).all();
   const rows=result.results||[];
   if(rows.length>10000)return Response.json({detail:'Export too large; contact support for a complete export'},
    {status:413,headers:{'cache-control':'no-store'}});
   payload.records[name]=rows;
  }
  return new Response(JSON.stringify(payload),{status:200,headers:{
   'content-type':'application/json; charset=utf-8',
   'content-disposition':'attachment; filename="habit-hero-family-export.json"',
   'cache-control':'no-store, private','x-content-type-options':'nosniff'
  }});
 }catch{return Response.json({detail:'Export unavailable'},{status:503,headers:{'cache-control':'no-store'}})}
}
