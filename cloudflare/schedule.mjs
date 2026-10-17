// Stored in the existing frequency_days_json column; no schema migration required.
const allDays=[1,2,3,4,5,6,7],names=['Δευ','Τρι','Τετ','Πεμ','Παρ','Σαβ','Κυρ'];
export function validateSchedule(value){
 if(!value||typeof value!=='object'||Array.isArray(value)||(value.version!==undefined&&value.version!==1))throw Error('Invalid schedule');
 const days=value.weekdays??allDays;
 if(!Array.isArray(days)||!days.length||days.length>7||new Set(days).size!==days.length||days.some(d=>!Number.isInteger(d)||d<1||d>7))throw Error('Choose valid weekdays');
 const start=value.start||'',end=value.end||'',time=/^(?:[01]\d|2[0-3]):[0-5]\d$/;
 if((start||end)&&(!time.test(start)||!time.test(end)||start>=end))throw Error('Time window must start before it ends on the same day');
 return {version:1,weekdays:[...days].sort((a,b)=>a-b),start,end};
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
 return {schedule_available:scheduled_today&&inWindow,scheduled_today,schedule_label};
}
