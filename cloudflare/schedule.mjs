// Stored in the existing frequency_days_json column; no schema migration required.
const allDays=[1,2,3,4,5,6,7],names=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
export function validateSchedule(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||(value.version!==undefined&&value.version!==1))throw Error('Invalid schedule');
 const days=value.weekdays??allDays;
 if(!Array.isArray(days)||!days.length||days.length>7||new Set(days).size!==days.length||days.some(d=>!Number.isInteger(d)||d<1||d>7))throw Error('Choose valid weekdays');
 const start=value.start||'',end=value.end||'',time=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
 if((start||end)&&(!time.test(start)||!time.test(end)||start>=end))throw Error('Time window must start before it ends on the same day');
 const routine=value.routine??'',order=value.order??1;
 if(!['','morning','afterschool','bedtime'].includes(routine)||!Number.isInteger(order)||order<1||order>50)throw Error('Invalid routine or step order');
 return {routine,order,version:1,weekdays:[...days].sort((a,b)=>a-b),start,end};
}
export function readSchedule(raw){
 if(!raw)return validateSchedule({});
 try{const value=typeof raw==='string'?JSON.parse(raw):raw;return validateSchedule(Array.isArray(value)?{weekdays:value}:value)}catch{return null}
}
export function scheduleStatus(raw,timezone='UTC',instant=new Date()){
 const schedule=readSchedule(raw);
 if(!schedule)return {schedule_available:false,scheduled_today:false,schedule_label:'Ο γονέας σου χρειάζεται να ενημερώσει το πρόγραμμα.'};
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:timezone||'UTC',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(instant);
 const get=type=>parts.find(p=>p.type===type).value,day=`${get('year')}-${get('month')}-${get('day')}`;
 const weekday=((new Date(day+'T12:00:00Z').getUTCDay()+6)%7)+1,clock=get('hour')+':'+get('minute');
 const scheduled_today=schedule.weekdays.includes(weekday),inWindow=!schedule.start||(clock>=schedule.start&&clock<schedule.end);
 const schedule_label=(schedule.weekdays.length===7?'Κάθε ημέρα':schedule.weekdays.map(d=>names[d-1]).join(', '))+(schedule.start?' · '+schedule.start+'–'+schedule.end:'')+' · '+(timezone||'UTC');
 return {schedule_available:scheduled_today&&inWindow,scheduled_today,schedule_label,routine:schedule.routine,routine_order:schedule.order};
}

export function slotAvailability(habit,rows,slot,timezone='UTC',instant=new Date()){
 const status=scheduleStatus(habit.frequency_days_json,timezone,instant);
 const current=rows.find(row=>row.slot_index===slot);
 if(current?.submission_status==='rejected')return {...status,schedule_available:false,availability_reason:'Μίλησε με τον γονέα σου για την επόμενη προσπάθεια.'};
 if(!status.schedule_available)return {...status,availability_reason:'Διαθέσιμη: '+status.schedule_label};
 if(slot>1&&!current?.submission_status){
  const previous=rows.find(row=>row.slot_index===slot-1&&row.submitted_at);
  if(!previous)return {...status,schedule_available:false,availability_reason:'Ολοκλήρωσε πρώτα την προηγούμενη προσπάθεια.'};
  const previousDate=new Date(previous.submitted_at);
  const day=date=>new Intl.DateTimeFormat('en-CA',{timeZone:timezone||'UTC',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  if(['weekly','monthly'].includes(habit.frequency_type)&&day(previousDate)===day(instant))return {...status,schedule_available:false,availability_reason:'Η επόμενη προσπάθεια ανοίγει μια άλλη ημέρα.'};
  const delay=Math.max(30,Number(habit.retry_delay_minutes)||0),remaining=delay*60000-(instant-previousDate);
  if(remaining>0)return {...status,schedule_available:false,availability_reason:'Λίγο διάλειμμα: περίπου '+Math.ceil(remaining/60000)+' λεπτά ακόμη.'};
 }
 return status;
}
