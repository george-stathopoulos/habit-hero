export async function occurrenceControl(env,actor,habit,period,slot){
 return env.DB.prepare(`SELECT deferred_until,retry_for FROM habit_occurrence_controls
  WHERE family_id=? AND child_id=? AND habit_id=? AND occurrence_date=? AND slot_index=?`)
  .bind(actor.family_id,actor.child_id,habit,period,slot).first();
}
