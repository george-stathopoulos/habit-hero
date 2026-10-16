// UTC recurrence keys. Weekly periods begin on Monday.
export function occurrenceKey(frequency,isoTime=new Date().toISOString()){
 const day=isoTime.slice(0,10);
 if(frequency==='once')return '1970-01-01';
 if(frequency==='monthly')return day.slice(0,7)+'-01';
 if(frequency==='weekly'){
  const date=new Date(day+'T12:00:00.000Z');
  date.setUTCDate(date.getUTCDate()-((date.getUTCDay()+6)%7));
  return date.toISOString().slice(0,10);
 }
 return day;
}
// The equivalent expression uses the same UTC Monday/week and month boundaries.
export const occurrenceSql=`CASE h.frequency_type
 WHEN 'once' THEN '1970-01-01'
 WHEN 'monthly' THEN substr(?,1,7)||'-01'
 WHEN 'weekly' THEN date(?,'weekday 0','-6 days')
 ELSE ? END`;
