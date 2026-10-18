export const routineNames={morning:'Το πρωινό μου',afterschool:'Μετά το σχολείο',bedtime:'Ετοιμάζομαι για ύπνο'};
export function routineSteps(activities,key,includeOtherDays=false){return activities.filter(m=>m.routine===key&&(includeOtherDays||m.scheduled_today!==false)).sort((a,b)=>(a.routine_order||1)-(b.routine_order||1)||(a.slot_index||1)-(b.slot_index||1)||a.habit_name.localeCompare(b.habit_name,'el'))}
export function nextRoutineStep(activities,key){return routineSteps(activities,key).find(m=>!['approved','pending'].includes(m.submission_status)&&m.schedule_available!==false)}

export function setCustomRoutines(routines=[]){for(const key of Object.keys(routineNames))if(!['morning','afterschool','bedtime'].includes(key))delete routineNames[key];for(const r of routines)routineNames[r.id]=r.name}
