// Child-only screen with a restricted child cookie; parent APIs never accept it.
export function childPage(){
 const html=`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <title>Habit Hero — Το προφίλ μου</title><meta name="referrer" content="no-referrer"><link rel="manifest" href="/habit-hero/app/child.webmanifest"><meta name="theme-color" content="#448be7"><meta name="apple-mobile-web-app-capable" content="yes">
 <style>:root{font-family:system-ui,sans-serif;background:#f3f6ff;color:#18334f}
 body{margin:0;padding:18px}main{max-width:650px;margin:24px auto}
 section{background:white;border-radius:18px;padding:24px;margin:16px 0;box-shadow:0 8px 25px #21396514}
 h1{font-size:30px}h2{font-size:22px}p{line-height:1.6}label{display:block;font-weight:bold}
 input{padding:13px;width:100%;box-sizing:border-box;border:1px solid #afc0dc;border-radius:9px;font:inherit;margin:12px 0}
 button{background:#448ce7;border:0;color:white;border-radius:10px;padding:11px 17px;margin:6px;font:inherit;cursor:pointer}
 button:disabled{opacity:.45}.secondary{background:#e8eff9;color:#173e68}
 li{list-style:none;padding:14px 0;border-bottom:1px solid #e5eafa}ul{padding:0}
 .muted{color:#5d728e}.hidden{display:none}
 nav.quick-nav{position:sticky;top:0;z-index:20;display:flex;gap:8px;overflow-x:auto;
 padding:10px 0;background:#f3f6fff2;backdrop-filter:blur(10px)}
 nav.quick-nav a{display:inline-flex;white-space:nowrap;background:white;color:#1c548b;
 padding:11px 16px;border-radius:999px;text-decoration:none;font-weight:700;box-shadow:0 2px 10px #21396513}
 nav.quick-nav a:focus-visible{outline:3px solid #f5a623}
 section{scroll-margin-top:80px}
 @media(max-width:600px){body{padding:10px}main{margin:10px auto}section{padding:19px}h1{font-size:27px}}
 :root{--purple:#6658e8;--violet:#392f87}
 body{background:linear-gradient(150deg,#f3eaff,#eef7ff 60%,#fff8eb);color:#242d52}
 main{max-width:820px;padding-bottom:100px}
 main>section:first-child{background:linear-gradient(125deg,#393082,#7764f5);color:white}
 main>section:first-child p{color:#fff}
 section{border-radius:26px;border:1px solid #eeebfd;box-shadow:0 12px 28px #232f6c13}
 button{background:var(--purple);font-weight:750;border-radius:16px;min-height:45px}
 button:active{transform:scale(.97)}
 [data-tab]:not([data-active="true"]){display:none!important}
 nav.quick-nav{display:none}
 .child-tabs{position:fixed;bottom:0;left:0;right:0;z-index:50;display:flex;gap:6px;background:#fffefa;
  border-top:1px solid #e8e6fb;box-shadow:0 -8px 30px #2525771a;
  padding:9px 12px calc(9px + env(safe-area-inset-bottom))}
 .child-tabs button{flex:1;background:transparent;color:#647391;font-size:14px;margin:0;
  display:flex;align-items:center;justify-content:center;flex-direction:column;gap:2px}
 .child-tabs button span:first-child{font-size:27px}
 .child-tabs button[aria-selected="true"]{background:#eceaff;color:#4a3fca}
 .child-heading{text-align:center;font-size:24px;font-weight:850;margin:15px 4px}
 #activities li,#rewards li{background:#f8f8ff;padding:17px;border-radius:18px;margin-bottom:12px;border:1px solid #eeedfc}
 @media(min-width:720px){.child-tabs{max-width:600px;left:50%;transform:translateX(-50%);border-radius:25px 25px 0 0}}
 @media(max-width:600px){body{padding:10px}main{margin:0 auto}section{padding:20px;border-radius:24px}}
 </style></head><body>
 <main><section><h1>🏆 Habit Hero</h1><p id="status" role="status">Έλεγχος προφίλ...</p>
 <button id="lockProfile" class="secondary" hidden>🔒 Κλείδωμα</button> <button id="logout" class="secondary" hidden>Αποσύνδεση παιδιού</button></section>
 <nav id="quickNav" class="quick-nav" aria-label="Πλοήγηση παιδιού" hidden>
 <a href="#activitiesPanel">🌟 Συνήθειες</a><a href="#rewardsPanel">🎁 Έπαθλα</a>
 <a href="#progressPanel">📈 Πρόοδος</a></nav>
 <h2 id="childTabTitle" class="child-heading" hidden>Οι αποστολές μου 🌟</h2>
 <section id="pairPanel" hidden><h2>🔑 Σύνδεση με οικογενειακό κωδικό</h2>
 <p class="muted">Ζήτησε από τον γονέα σου έναν νέο κωδικό σύνδεσης. Ο κωδικός λειτουργεί μόνο μία φορά και λήγει σε 10 λεπτά.</p>
 <form id="pairForm"><label for="code">Κωδικός συσκευής</label><input id="code" required maxlength="32" minlength="32" autocomplete="off" spellcheck="false" placeholder="Επικόλλησε τον κωδικό">
 <button id="pairButton" type="submit">Σύνδεση</button></form><p id="pairMessage" role="status"></p></section>
 <section id="pinPanel" hidden><h2>🔐 Το PIN μου</h2>
 <p class="muted">Πληκτρολόγησε το 4-ψήφιο PIN που όρισε ο γονέας σου.</p>
 <form id="pinUnlockForm"><label for="pinInput">4-ψήφιο PIN</label>
 <input id="pinInput" type="password" required inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off">
 <button id="pinUnlockButton" type="submit">Ξεκλείδωμα</button></form><p id="pinMessage" role="status"></p></section>
 <section id="activitiesPanel" data-tab="quests" hidden><h2>🌟 Οι δραστηριότητές μου</h2>
 <p class="muted">Πάτησε «Το έκανα!» όταν ολοκληρώσεις μια δραστηριότητα. Οι πόντοι προστίθενται μετά από έγκριση γονέα.</p>
 <ul id="activities"></ul><p id="feedback" role="status"></p></section>
 <section id="progressPanel" data-tab="hero" hidden><h2>📈 Η πρόοδός μου</h2>
 <p id="progressStats" class="muted"></p>
 <p id="heroLevel" class="muted"></p><div id="levelBar" style="height:14px;border-radius:20px;background:#e8eff9;overflow:hidden"><div id="levelFill" style="height:100%;width:0;background:#f5a623;transition:width .3s"></div></div>
 <h3>🏅 Τα επιτεύγματά μου</h3><ul id="heroBadges"></ul><h3>Οι πρόσφατες προσπάθειές μου</h3><ul id="activityHistory"></ul></section>
 <section id="rewardsPanel" data-tab="rewards" hidden><h2>🎁 Τα έπαθλά μου</h2>
 <p id="balance" class="muted"></p><ul id="rewards"></ul>
 <p id="rewardMessage" role="status"></p><h3>Τα αιτήματά μου</h3><ul id="redemptionHistory"></ul></section>
 <nav id="childTabs" class="child-tabs" role="tablist" aria-label="Πλοήγηση παιδιού" hidden>
 <button type="button" data-child-tab="quests" role="tab" aria-selected="true"><span>🎯</span><span>Αποστολές</span></button>
 <button type="button" data-child-tab="rewards" role="tab" aria-selected="false"><span>🎁</span><span>Έπαθλα</span></button>
 <button type="button" data-child-tab="hero" role="tab" aria-selected="false"><span>🦸</span><span>Ο ήρωάς μου</span></button>
 </nav>
 </main><script>
 const childTitles={quests:'Οι αποστολές μου 🎯',rewards:'Τα έπαθλά μου 🎁',hero:'Ο ήρωάς μου 🦸'};
 function openChildTab(name){
  if(!childTitles[name])name='quests';
  for(const panel of document.querySelectorAll('[data-tab]'))panel.dataset.active=String(panel.dataset.tab===name);
  for(const btn of document.querySelectorAll('[data-child-tab]'))btn.setAttribute('aria-selected',String(btn.dataset.childTab===name));
  document.getElementById('childTabTitle').textContent=childTitles[name];
  scrollTo({top:0,behavior:'instant'});
 }
 document.getElementById('childTabs').addEventListener('click',event=>{
  const button=event.target.closest('[data-child-tab]');if(button)openChildTab(button.dataset.childTab);
 });
 openChildTab('quests');
 const status=document.getElementById('status');
 async function refresh(){
  const me=await fetch('/api/child/me',{credentials:'same-origin',cache:'no-store'});
  if(!me.ok){
   const pinState=await fetch('/api/child/pin/status',{credentials:'same-origin',cache:'no-store'}).catch(()=>null);
   const needsPin=pinState?.ok&&(await pinState.json()).requires_pin===true;
   document.getElementById('pinPanel').hidden=!needsPin;
   document.getElementById('pairPanel').hidden=needsPin;
   document.getElementById('quickNav').hidden=true;
   document.getElementById('childTabs').hidden=true;
   document.getElementById('childTabTitle').hidden=true;
   document.getElementById('activitiesPanel').hidden=true;
   document.getElementById('rewardsPanel').hidden=true;
   document.getElementById('progressPanel').hidden=true;
   document.getElementById('rewards').replaceChildren();
   document.getElementById('redemptionHistory').replaceChildren();
   document.getElementById('progressStats').textContent='';
   document.getElementById('activityHistory').replaceChildren();
   document.getElementById('heroBadges').replaceChildren();
   document.getElementById('logout').hidden=!needsPin;
   document.getElementById('lockProfile').hidden=true;
   status.textContent=needsPin?'Εισαγωγή προσωπικού PIN.':'Χρειάζεται σύνδεση με κωδικό γονέα.';
   return;
  }
  const profile=await me.json();
  const icons={hero:'🦸',unicorn:'🦄',robot:'🤖',dragon:'🐉',astronaut:'🧑‍🚀',cat:'🐱',ninja:'🥷',wizard:'🧙'};
  status.textContent=(icons[profile.avatar_id]||'🦸')+' Γεια σου, '+profile.name+'!';
  document.getElementById('pairPanel').hidden=true;
  document.getElementById('pinPanel').hidden=true;
  document.getElementById('quickNav').hidden=false;
  document.getElementById('childTabs').hidden=false;
  document.getElementById('childTabTitle').hidden=false;
  document.getElementById('logout').hidden=false;
  document.getElementById('lockProfile').hidden=!profile.pin_enabled;
  const res=await fetch('/api/child/activities',{credentials:'same-origin',cache:'no-store'});
  if(!res.ok){status.textContent='Οι δραστηριότητες δεν είναι διαθέσιμες αυτή τη στιγμή.';return}
  const data=await res.json();
  document.getElementById('activitiesPanel').hidden=false;
  await refreshRewards();
  await refreshProgress();
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
 async function refreshProgress(){
  const response=await fetch('/api/child/progress',{credentials:'same-origin',cache:'no-store'});
  if(!response.ok)return;
  const data=await response.json(),progress=data.progress;
  if(!progress)return;
  document.getElementById('progressStats').textContent=
   '🔥 '+progress.current_streak_days+' ημέρες σερί · ✅ '+progress.approved_last_30_days+
   ' ολοκληρώσεις τον τελευταίο μήνα · ⭐ '+progress.earned_last_30_days+' πόντοι κερδισμένοι';
  document.getElementById('heroLevel').textContent='🦸 Επίπεδο '+progress.level+' · '+progress.level_points+'/100 πόντοι μέχρι το επόμενο επίπεδο';
  document.getElementById('levelFill').style.width=progress.level_points+'%';
  const badges=document.getElementById('heroBadges');badges.replaceChildren();
  if(!progress.badges.length){
    const item=document.createElement('li');item.textContent='Ο πρώτος σου στόχος: ολοκλήρωσε μία αποστολή!';badges.append(item);
  }
  for(const badge of progress.badges){
    const item=document.createElement('li');item.textContent=badge.emoji+' '+badge.name;badges.append(item);
  }
  const history=document.getElementById('activityHistory');history.replaceChildren();
  for(const event of progress.recent_activity){
   const item=document.createElement('li');
   const state=event.status==='approved'?'✅ Εγκρίθηκε':event.status==='rejected'?'❌ Απορρίφθηκε':'⏳ Σε αναμονή';
   item.textContent=event.habit_name+' · '+state+' · '+event.occurrence_date;
   history.append(item);
  }
  document.getElementById('progressPanel').hidden=false;
 }
 async function refreshRewards(){
  const response=await fetch('/api/child/rewards',{credentials:'same-origin',cache:'no-store'});
  if(!response.ok){document.getElementById('rewardMessage').textContent='Δεν είναι διαθέσιμα τα έπαθλα.';return}
  const data=await response.json();
  document.getElementById('rewardsPanel').hidden=false;
  document.getElementById('balance').textContent='Διαθέσιμοι πόντοι: '+data.balance;
  const previous=document.getElementById('redemptionHistory');previous.replaceChildren();
  for(const request of data.redemption_history||[]){
   const item=document.createElement('li');
   const state=request.status==='requested'?'⏳ Σε αναμονή':request.status==='approved'?'✅ Εγκρίθηκε':
     request.status==='fulfilled'?'🎉 Παραδόθηκε':'❌ Απορρίφθηκε';
   item.textContent=request.reward_name+' · '+state+' · '+request.points_spent+' πόντοι';
   previous.append(item);
  }
  const list=document.getElementById('rewards');list.replaceChildren();
  if(!data.rewards.length){
    const item=document.createElement('li');item.textContent='Δεν υπάρχουν ακόμη έπαθλα.';list.append(item);
  }
  for(const reward of data.rewards){
    const item=document.createElement('li'),label=document.createElement('span');
    label.textContent=(reward.emoji||'🎁')+' '+reward.name+' · '+reward.points_cost+' πόντοι ';
    item.append(label);
    if(data.balance<reward.points_cost){
      const needed=document.createElement('small');
      needed.textContent=' 🔒 Χρειάζεσαι '+(reward.points_cost-data.balance)+' ακόμη πόντους';
      item.append(needed);
    }
    if(!reward.recurring&&reward.previously_requested){
      const caption=document.createElement('small');caption.textContent='Έχει ήδη ζητηθεί';item.append(caption);
    }else {
      const btn=document.createElement('button');btn.textContent='Ζήτα το έπαθλο';
      btn.disabled=data.balance<reward.points_cost;
      btn.title=btn.disabled?'Χρειάζεσαι περισσότερους πόντους':'';
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
 document.getElementById('pinUnlockForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=document.getElementById('pinUnlockButton'),note=document.getElementById('pinMessage');
  button.disabled=true;
  try{
   const pin=document.getElementById('pinInput').value;
   const response=await fetch('/api/child/pin/unlock',{method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json'},body:JSON.stringify({pin})});
   if(!response.ok){const error=await response.json().catch(()=>({}));throw Error(error.detail||'Λάθος PIN.')}
   document.getElementById('pinInput').value='';note.textContent='';await refresh();
  }catch(e){note.textContent=e.message}finally{button.disabled=false}
 });
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
 document.getElementById('lockProfile').addEventListener('click',async()=>{
  const button=document.getElementById('lockProfile');button.disabled=true;
  try{
   const response=await fetch('/api/child/pin/lock',{method:'POST',credentials:'same-origin'});
   if(!response.ok)throw Error('Δεν μπόρεσα να κλειδώσω το προφίλ.');
   await refresh();
  }catch(e){document.getElementById('feedback').textContent=e.message}
  finally{button.disabled=false}
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
