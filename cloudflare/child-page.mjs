// Child-only screen with a restricted child cookie; parent APIs never accept it.
export function childPage(){
 const html=`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <title>Habit Hero — Το προφίλ μου</title><meta name="referrer" content="no-referrer">
 <style>:root{font-family:system-ui,sans-serif;background:#f3f6ff;color:#18334f}
 body{margin:0;padding:18px}main{max-width:650px;margin:24px auto}
 section{background:white;border-radius:18px;padding:24px;margin:16px 0;box-shadow:0 8px 25px #21396514}
 h1{font-size:30px}h2{font-size:22px}p{line-height:1.6}label{display:block;font-weight:bold}
 input{padding:13px;width:100%;box-sizing:border-box;border:1px solid #afc0dc;border-radius:9px;font:inherit;margin:12px 0}
 button{background:#448ce7;border:0;color:white;border-radius:10px;padding:11px 17px;margin:6px;font:inherit;cursor:pointer}
 button:disabled{opacity:.45}.secondary{background:#e8eff9;color:#173e68}
 li{list-style:none;padding:14px 0;border-bottom:1px solid #e5eafa}ul{padding:0}
 .muted{color:#5d728e}.hidden{display:none}</style></head><body>
 <main><section><h1>🏆 Habit Hero</h1><p id="status" role="status">Έλεγχος προφίλ...</p>
 <button id="logout" class="secondary" hidden>Αποσύνδεση παιδιού</button></section>
 <section id="pairPanel" hidden><h2>🔑 Σύνδεση με οικογενειακό κωδικό</h2>
 <p class="muted">Ζήτησε από τον γονέα σου έναν νέο κωδικό σύνδεσης. Ο κωδικός λειτουργεί μόνο μία φορά και λήγει σε 10 λεπτά.</p>
 <form id="pairForm"><label for="code">Κωδικός συσκευής</label><input id="code" required maxlength="32" minlength="32" autocomplete="off" spellcheck="false" placeholder="Επικόλλησε τον κωδικό">
 <button id="pairButton" type="submit">Σύνδεση</button></form><p id="pairMessage" role="status"></p></section>
 <section id="activitiesPanel" hidden><h2>🌟 Οι δραστηριότητές μου</h2>
 <p class="muted">Πάτησε «Το έκανα!» όταν ολοκληρώσεις μια δραστηριότητα. Οι πόντοι προστίθενται μετά από έγκριση γονέα.</p>
 <ul id="activities"></ul><p id="feedback" role="status"></p></section>
 <section id="rewardsPanel" hidden><h2>🎁 Τα έπαθλά μου</h2>
 <p id="balance" class="muted"></p><ul id="rewards"></ul>
 <p id="rewardMessage" role="status"></p></section>
 </main><script>
 const status=document.getElementById('status');
 async function refresh(){
  const me=await fetch('/api/child/me',{credentials:'same-origin',cache:'no-store'});
  if(!me.ok){document.getElementById('pairPanel').hidden=false;
   document.getElementById('activitiesPanel').hidden=true;
   document.getElementById('logout').hidden=true;
   status.textContent='Χρειάζεται σύνδεση με κωδικό γονέα.';
   return;
  }
  const profile=await me.json();
  status.textContent='Γεια σου, '+profile.name+'!';
  document.getElementById('pairPanel').hidden=true;
  document.getElementById('logout').hidden=false;
  const res=await fetch('/api/child/activities',{credentials:'same-origin',cache:'no-store'});
  if(!res.ok){status.textContent='Οι δραστηριότητες δεν είναι διαθέσιμες αυτή τη στιγμή.';return}
  const data=await res.json();
  document.getElementById('activitiesPanel').hidden=false;
  await refreshRewards();
  const list=document.getElementById('activities');list.replaceChildren();
  if(!data.activities.length){const li=document.createElement('li');li.textContent='Δεν υπάρχουν ακόμη δραστηριότητες.';list.append(li)}
  for(const item of data.activities){
   const li=document.createElement('li'),span=document.createElement('span');
   span.textContent=(item.emoji||'⭐')+' '+item.habit_name+' · '+item.points+' πόντοι ';
   li.append(span);
   if(!item.submission_status){
    const button=document.createElement('button');button.textContent='Το έκανα!';
    button.addEventListener('click',async()=>{
     button.disabled=true;
     try{
      const r=await fetch('/api/child/activities',{method:'POST',credentials:'same-origin',
       headers:{'content-type':'application/json'},body:JSON.stringify({habit_id:item.habit_id})});
      if(!r.ok)throw Error('Δεν αποθηκεύτηκε η δραστηριότητα.');
      document.getElementById('feedback').textContent='Μπράβο! Περιμένουμε την έγκριση του γονέα.';
      await refresh();
     }catch(e){document.getElementById('feedback').textContent=e.message;button.disabled=false}
    });li.append(button);
   }else{const label=document.createElement('small');
    label.textContent=item.submission_status==='pending'?'⏳ Σε αναμονή':item.submission_status==='approved'?'✅ Εγκρίθηκε':'❌ Απορρίφθηκε';
    li.append(label);
   }
   list.append(li);
  }
 }
 async function refreshRewards(){
  const response=await fetch('/api/child/rewards',{credentials:'same-origin',cache:'no-store'});
  if(!response.ok){document.getElementById('rewardMessage').textContent='Δεν είναι διαθέσιμα τα έπαθλα.';return}
  const data=await response.json();
  document.getElementById('rewardsPanel').hidden=false;
  document.getElementById('balance').textContent='Διαθέσιμοι πόντοι: '+data.balance;
  const list=document.getElementById('rewards');list.replaceChildren();
  if(!data.rewards.length){
    const item=document.createElement('li');item.textContent='Δεν υπάρχουν ακόμη έπαθλα.';list.append(item);
  }
  for(const reward of data.rewards){
    const item=document.createElement('li'),label=document.createElement('span');
    label.textContent=(reward.emoji||'🎁')+' '+reward.name+' · '+reward.points_cost+' πόντοι ';
    item.append(label);
    if(!reward.recurring&&reward.previously_requested){
      const caption=document.createElement('small');caption.textContent='Έχει ήδη ζητηθεί';item.append(caption);
    }else {
      const btn=document.createElement('button');btn.textContent='Ζήτα το έπαθλο';
      btn.addEventListener('click',async()=>{
        btn.disabled=true;
        try{
          const r=await fetch('/api/child/rewards/request',{method:'POST',credentials:'same-origin',
            headers:{'content-type':'application/json'},body:JSON.stringify({reward_id:reward.id})});
          if(!r.ok)throw Error('Δεν στάλθηκε το αίτημα. Δοκίμασε ξανά.');
          document.getElementById('rewardMessage').textContent='Το αίτημα στάλθηκε στον γονέα σου!';
          await refreshRewards();
        }catch(e){document.getElementById('rewardMessage').textContent=e.message;btn.disabled=false}
      });item.append(btn);
    }
    list.append(item);
  }
 }
 document.getElementById('pairForm').addEventListener('submit',async ev=>{
  ev.preventDefault();const btn=document.getElementById('pairButton');btn.disabled=true;
  try{
   const code=document.getElementById('code').value.trim();
   const response=await fetch('/api/child/pair',{method:'POST',credentials:'same-origin',
     headers:{'content-type':'application/json'},body:JSON.stringify({code})});
   if(!response.ok)throw Error('Ο κωδικός έληξε ή χρησιμοποιήθηκε. Ζήτησε νέο από γονέα.');
   document.getElementById('code').value='';await refresh();
  }catch(e){document.getElementById('pairMessage').textContent=e.message}finally{btn.disabled=false}
 });
 document.getElementById('logout').addEventListener('click',async()=>{
  await fetch('/api/child/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});
  await refresh();
 });
 refresh().catch(()=>{status.textContent='Δεν είναι διαθέσιμη η σύνδεση.'});
 </script></body></html>`;
 return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8',
  'cache-control':'no-store, private','x-content-type-options':'nosniff',
  'referrer-policy':'no-referrer',
  'content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"}});
}
