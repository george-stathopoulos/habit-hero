// Small, Worker-owned parent dashboard until the Expo feature screens are migrated.
export function parentPage() {
 const html=`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><link rel="manifest" href="/habit-hero/app/parent.webmanifest"><meta name="theme-color" content="#448be7"><meta name="apple-mobile-web-app-capable" content="yes">
 <title>Habit Hero — Οικογένεια</title><style>
 :root{font-family:system-ui,-apple-system,sans-serif;background:#f3f7ff;color:#173451}
 *{box-sizing:border-box}body{margin:0;padding:24px}main{max-width:760px;margin:30px auto}
 header,.panel{background:white;border-radius:18px;padding:25px;margin-bottom:18px;box-shadow:0 8px 35px #1f457811}
 header{display:flex;gap:20px;align-items:center;justify-content:space-between;flex-wrap:wrap}
 h1{margin:0}h2{margin-top:0}p{line-height:1.6}.subtle{color:#607188}
 a{color:#285ca0}button{border:0;border-radius:11px;background:#448be7;color:white;font:inherit;padding:12px 16px;cursor:pointer}
 button:disabled{opacity:.5}button.secondary{background:#eaf0fa;color:#244c75}
 input,select{width:100%;padding:12px;border:1px solid #d4ddea;border-radius:9px;font:inherit;margin:7px 0 15px}
 label{font-weight:600}ul{list-style:none;padding:0}li{padding:14px 0;border-bottom:1px solid #e9eef8}
 form{display:grid;gap:6px}.row{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap}
 nav.quick-nav{position:sticky;top:0;z-index:20;display:flex;gap:8px;overflow-x:auto;scrollbar-width:thin;
  padding:12px;margin:0 0 18px;background:#f3f7fff5;backdrop-filter:blur(12px);border-radius:15px}
 nav.quick-nav a{flex-shrink:0;display:inline-flex;align-items:center;padding:10px 15px;border-radius:999px;
  background:white;color:#244c75;text-decoration:none;font-size:14px;font-weight:650;box-shadow:0 2px 10px #1f457811}
 nav.quick-nav a:focus-visible{outline:3px solid #f5a623}
 section.panel{scroll-margin-top:90px}
 @media(max-width:600px){body{padding:12px}main{margin:8px auto}header,.panel{padding:19px;border-radius:17px}
  h1{font-size:27px}h2{font-size:20px}button{padding:11px 13px}nav.quick-nav{margin:0 0 12px}}
 </style></head><body><main><header><div><h1>🏆 Habit Hero</h1><div class="subtle">Οικογενειακός πίνακας</div></div><button id="logout" class="secondary">Αποσύνδεση</button></header>
 <nav class="quick-nav" aria-label="Γρήγορη πλοήγηση">
 <a href="#family">👨‍👩‍👧 Παιδιά</a><a href="#habitPanel">🎯 Συνήθειες</a>
 <a href="#approvalsPanel">✅ Εγκρίσεις</a><a href="#rewardsPanel">🎁 Έπαθλα</a>
 <a href="#redemptionsPanel">📩 Αιτήματα</a><a href="#progressPanel">📈 Πρόοδος</a>
 <a href="#privacyPanel">🔒 Δεδομένα</a></nav>
 <section class="panel"><h2 id="greeting">Φόρτωση...</h2><p id="status" role="status" class="subtle">Έλεγχος σύνδεσης...</p>
 <div class="row"><a href="#approvalsPanel" id="pendingApprovalSummary">✅ Εγκρίσεις: —</a>
 <a href="#redemptionsPanel" id="pendingRedemptionSummary">🎁 Αιτήματα: —</a></div></section>
 <section class="panel" id="family" hidden><h2>👨‍👩‍👧‍👦 Τα παιδιά μου</h2><p class="subtle">Δημιουργήστε το προφίλ κάθε παιδιού. Δεν απαιτείται Google λογαριασμός για τα παιδιά.</p>
 <ul id="children"></ul><p id="empty" class="subtle">Δεν υπάρχουν ακόμη προφίλ παιδιών.</p></section>
 <section class="panel" id="create" hidden><h2>➕ Προσθήκη παιδιού</h2><form id="form"><label for="name">Όνομα ή ψευδώνυμο</label>
 <input id="name" maxlength="80" autocomplete="off" required placeholder="π.χ. Αλέξης">
 <label for="age">Ηλικιακή ομάδα (προαιρετική)</label><select id="age"><option value="">Δεν θέλω να δηλώσω</option><option value="6-8">6–8</option><option value="9-11">9–11</option><option value="12-14">12–14</option></select>
 <button id="save" type="submit">Προσθήκη παιδιού</button></form><p id="formStatus" role="status" class="subtle"></p></section>
 <section class="panel" id="devicesPanel" hidden><h2>📱 Συσκευές παιδιών</h2>
 <p class="subtle">Ενεργοποιήστε την ανεξάρτητη πρόσβαση του παιδιού από άλλη συσκευή ή ξεχωριστό προφίλ browser, χωρίς να δώσετε πρόσβαση στον λογαριασμό γονέα.</p>
 <label for="deviceChild">Παιδί</label><select id="deviceChild"></select>
 <button id="createPair">Δημιουργία κωδικού σύνδεσης (10 λεπτά)</button>
 <button id="revokeDevice" class="secondary">Ανάκληση πρόσβασης παιδιού</button>
 <p id="deviceStatus" role="status" class="subtle"></p>
 <div id="pairResult" hidden><p>Ο κωδικός εμφανίζεται μόνο τώρα. Αντιγράψτε τον στη συσκευή του παιδιού:</p>
 <input id="pairCode" readonly aria-label="Κωδικός σύνδεσης"><button id="copyPair">Αντιγραφή κωδικού</button>
 <p><a href="/habit-hero/child/" target="_blank" rel="noopener noreferrer">Άνοιγμα σελίδας παιδιού</a></p></div>
 <p class="subtle">Προσοχή: αν ο γονέας είναι ήδη συνδεδεμένος στον ίδιο browser, το παιδί θα μπορούσε να ανοίξει τις σελίδες γονέα. Χρησιμοποιήστε ξεχωριστή συσκευή ή προφίλ.</p>
 </section>
 <section class="panel" id="habitPanel" hidden><h2>✅ Συνήθειες</h2><p class="subtle">Αναθέστε δραστηριότητες στα παιδιά. Οι πόντοι θα ενεργοποιηθούν όταν υλοποιηθούν οι εγκρίσεις.</p>
 <ul id="habits"></ul><p id="noHabits" class="subtle">Δεν υπάρχουν ακόμη συνήθειες.</p>
 <form id="habitForm"><label for="habitName">Όνομα συνήθειας</label><input id="habitName" required maxlength="100" placeholder="π.χ. Βουρτσίζω τα δόντια μου">
 <label for="habitChild">Παιδί</label><select id="habitChild" required></select>
 <label for="habitFrequency">Συχνότητα</label><select id="habitFrequency"><option value="daily">Καθημερινά</option><option value="weekly">Εβδομαδιαία</option><option value="monthly">Μηνιαία</option><option value="once">Μία φορά</option></select>
 <label for="habitPoints">Πόντοι</label><input id="habitPoints" type="number" min="1" max="1000" value="10" required>
 <button id="habitSave" type="submit">Δημιουργία και ανάθεση</button></form><p id="habitStatus" role="status" class="subtle"></p></section>
 <section class="panel" id="activitiesPanel" hidden>
 <h2>🌟 Ολοκλήρωση δραστηριοτήτων</h2>
 <p class="subtle">Δοκιμαστική λειτουργία με επίβλεψη γονέα: το παιδί επιλέγει «Το έκανα!» στη συσκευή του γονέα. Δεν έχει ακόμη δικό του PIN.</p>
 <ul id="activities"></ul><p id="activityNote" class="subtle" role="status"></p></section>
 <section class="panel" id="approvalsPanel" hidden>
 <h2>🛡️ Εγκρίσεις γονέα</h2><ul id="approvals"></ul>
 <p id="noApprovals" class="subtle">Δεν υπάρχουν εκκρεμείς εγκρίσεις.</p>
 <p id="approvalNote" role="status" class="subtle"></p></section>
 <section class="panel" id="pointsPanel" hidden><h2>🏆 Πόντοι παιδιών</h2>
 <ul id="balances"></ul><p class="subtle">Οι πόντοι των συνηθειών προστίθενται μετά από έγκριση γονέα.</p>
 <form id="pointsForm"><label for="pointsChild">Παιδί</label><select id="pointsChild" required></select>
 <label for="pointsDelta">Προσθήκη (+) ή αφαίρεση (-) πόντων</label>
 <input id="pointsDelta" type="number" required step="1" min="-1000" max="1000" placeholder="+10 ή -5">
 <button type="submit" id="pointsSave">Καταχώρηση διόρθωσης</button></form>
 <p id="pointsStatus" role="status" class="subtle"></p></section>
 <section class="panel" id="rewardsPanel" hidden>
  <h2>🎁 Έπαθλα & ανταμοιβές</h2>
  <p class="subtle">Δημιουργήστε έπαθλα για τα παιδιά. Η εξαργύρωση αφαιρεί πόντους μόνο όταν την εγκρίνετε.</p>
  <ul id="rewardsList"></ul><p id="noRewards" class="subtle">Δεν υπάρχουν ακόμη έπαθλα.</p>
  <form id="rewardForm">
    <label for="rewardName">Όνομα επάθλου</label>
    <input id="rewardName" required maxlength="100" placeholder="π.χ. Μια ώρα στο πάρκο">
    <label for="rewardDescription">Περιγραφή (προαιρετική)</label>
    <input id="rewardDescription" maxlength="500" placeholder="Τι περιλαμβάνει το έπαθλο">
    <label for="rewardCost">Πόντοι που απαιτούνται</label>
    <input id="rewardCost" type="number" min="1" max="100000" value="50" required>
    <label for="rewardChild">Παιδί</label><select id="rewardChild" required></select>
    <label><input id="rewardRecurring" type="checkbox" checked style="width:auto"> Επαναλαμβανόμενο έπαθλο</label>
    <button id="rewardSave" type="submit">Προσθήκη επάθλου</button>
  </form><p id="rewardStatus" role="status" class="subtle"></p>
 </section>
 <section class="panel" id="redemptionsPanel" hidden>
  <h2>📩 Αιτήματα εξαργύρωσης</h2><ul id="redemptionsList"></ul>
  <p id="noRedemptions" class="subtle">Δεν υπάρχουν ακόμη αιτήματα.</p>
  <p id="redemptionStatus" role="status" class="subtle"></p>
 </section>
 <section class="panel" id="progressPanel" hidden><h2>📈 Η πρόοδός μας</h2>
 <p class="subtle">Οι τελευταίες 30 ημέρες · οι συνεχόμενες ημέρες βασίζονται σε εγκεκριμένες δραστηριότητες.</p>
 <ul id="progressList"></ul><p id="progressMessage" role="status" class="subtle"></p></section>
 <section class="panel" id="privacyPanel" hidden><h2>🔒 Τα δεδομένα της οικογένειας</h2>
 <p class="subtle">Μπορείτε να κατεβάσετε τα προφίλ, τις συνήθειες, τις εγκρίσεις, τους πόντους και τα έπαθλα της οικογένειάς σας ως αρχείο JSON. Το αρχείο περιέχει προσωπικά δεδομένα και πρέπει να φυλάσσεται με ασφάλεια.</p>
 <a href="/api/family/export" download="habit-hero-family-export.json">⬇️ Εξαγωγή οικογενειακών δεδομένων</a></section>
 <section class="panel"><h2>🚧 Επόμενες λειτουργίες</h2><p class="subtle">Επεξεργασία συνηθειών, υπενθυμίσεις, αναλυτικά στατιστικά και πλήρης σχεδίαση εφαρμογής βρίσκονται υπό ανάπτυξη.</p></section>
 </main><script>
 const status=document.getElementById('status'),greeting=document.getElementById('greeting');
 const list=document.getElementById('children'),empty=document.getElementById('empty');
 async function refresh() {
  try {
   const r=await fetch('/api/family/overview',{credentials:'same-origin',cache:'no-store'});
   if(!r.ok)throw Error(r.status===401?'Χρειάζεται σύνδεση Google.':'Προσωρινό πρόβλημα σύνδεσης.');
   const data=await r.json();
   greeting.textContent='Καλώς ήρθατε, '+data.parent.name+'!';
   status.textContent='Οικογένεια: '+data.family.name;
   document.getElementById('family').hidden=false;document.getElementById('create').hidden=false;
   document.getElementById('privacyPanel').hidden=false;
   list.replaceChildren();
   for(const child of data.children) {
    const avatarIcons={hero:'🦸',unicorn:'🦄',robot:'🤖',dragon:'🐉',astronaut:'🧑‍🚀',cat:'🐱',ninja:'🥷',wizard:'🧙'};
    const li=document.createElement('li'),label=document.createElement('span');
    label.textContent=(avatarIcons[child.avatar_id]||'🌟')+' '+child.display_name+(child.age_band?' · '+child.age_band:'')+' ';
    li.append(label);
    const edit=document.createElement('button');edit.className='secondary';edit.textContent='Επεξεργασία';
    edit.addEventListener('click',async()=>{
     const name=prompt('Όνομα παιδιού',child.display_name);if(name===null)return;
     const age=prompt('Ηλικιακή ομάδα: 6-8, 9-11, 12-14 ή κενό',child.age_band||'');if(age===null)return;
     const avatar=prompt('Avatar: hero, unicorn, robot, dragon, astronaut, cat, ninja, wizard',child.avatar_id||'hero');if(avatar===null)return;
     if(!name.trim()||name.length>80||!['','6-8','9-11','12-14'].includes(age)||!Object.hasOwn(avatarIcons,avatar)){
      document.getElementById('formStatus').textContent='Μη έγκυρα στοιχεία παιδιού.';return;
     }
     edit.disabled=true;
     try{
      const response=await fetch('/api/children/update',{method:'POST',credentials:'same-origin',
       headers:{'content-type':'application/json'},body:JSON.stringify({
        child_id:child.id,name,age_band:age||null,avatar_id:avatar})});
      if(!response.ok)throw Error('Δεν αποθηκεύτηκε το προφίλ.');
      document.getElementById('formStatus').textContent='Το προφίλ ενημερώθηκε.';
      await refresh();
     }catch(e){document.getElementById('formStatus').textContent=e.message;edit.disabled=false}
    });li.append(edit);list.append(li);
   }
   empty.hidden=data.children.length>0;
   const select=document.getElementById('habitChild');select.replaceChildren();
   for(const child of data.children){
    const option=document.createElement('option');option.value=child.id;option.textContent=child.display_name;select.append(option);
   }
   const deviceSelect=document.getElementById('deviceChild');deviceSelect.replaceChildren();
   for(const child of data.children){
    const opt=document.createElement('option');opt.value=child.id;opt.textContent=child.display_name;deviceSelect.append(opt);
   }
   document.getElementById('devicesPanel').hidden=data.children.length===0;
   document.getElementById('habitPanel').hidden=data.children.length===0;
   if(data.children.length)await refreshHabits();
   if(data.children.length)await refreshActivityWorkflow();
   const pointsChild=document.getElementById('pointsChild');pointsChild.replaceChildren();
   for(const child of data.children){
     const option=document.createElement('option');option.value=child.id;option.textContent=child.display_name;pointsChild.append(option);
   }
   const rewardChild=document.getElementById('rewardChild');rewardChild.replaceChildren();
   for(const child of data.children){const option=document.createElement('option');option.value=child.id;option.textContent=child.display_name;rewardChild.append(option)}
   document.getElementById('rewardsPanel').hidden=data.children.length===0;
   document.getElementById('redemptionsPanel').hidden=data.children.length===0;
   if(data.children.length)await refreshRewards();
   if(data.children.length)await refreshProgress();
  }catch(e){
   greeting.textContent='Habit Hero';status.textContent=e.message;
   const a=document.createElement('a');a.href='/api/auth/google/start';a.textContent='Σύνδεση με Google';
   status.append(' · ',a);
  }
 }
 async function refreshHabits(){
  const r=await fetch('/api/habits',{credentials:'same-origin',cache:'no-store'});
  if(!r.ok)throw Error('Δεν ήταν δυνατή η φόρτωση των συνηθειών.');
  const data=await r.json(),items=document.getElementById('habits');
  items.replaceChildren();
  for(const habit of data.habits){
   const li=document.createElement('li');
   const label=document.createElement('span');
   label.textContent=(habit.emoji||'⭐')+' '+habit.name+' · '+habit.points+' πόντοι · '+habit.children.map(c=>c.name).join(', ')+' ';
   li.append(label);
   const edit=document.createElement('button');edit.className='secondary';edit.textContent='Επεξεργασία';
   edit.addEventListener('click',async()=>{
    const name=prompt('Όνομα συνήθειας',habit.name);
    if(name===null)return;
    const pts=prompt('Πόντοι',String(habit.points));if(pts===null)return;
    const frequency=prompt('Συχνότητα: daily, weekly, monthly, once',habit.frequency);
    if(frequency===null)return;
    const points=Number(pts);
    if(!name.trim()||!Number.isInteger(points)||points<1||points>1000||
      !['daily','weekly','monthly','once'].includes(frequency)){
      document.getElementById('habitStatus').textContent='Ελέγξτε όνομα, πόντους και συχνότητα.';return;
    }
    edit.disabled=true;
    try{
     const res=await fetch('/api/habits/update',{method:'POST',credentials:'same-origin',
       headers:{'content-type':'application/json'},body:JSON.stringify({habit_id:habit.id,name,points,frequency})});
     if(!res.ok)throw Error('Δεν αποθηκεύτηκαν οι αλλαγές.');
     document.getElementById('habitStatus').textContent='Η συνήθεια ενημερώθηκε.';
     await refreshHabits();await refreshActivityWorkflow();
    }catch(e){document.getElementById('habitStatus').textContent=e.message;edit.disabled=false}
   });
   li.append(edit);
   const assign=document.createElement('button');assign.className='secondary';assign.textContent='Ανάθεση σε παιδί';
   assign.addEventListener('click',async()=>{
     const childOptions=Array.from(document.getElementById('habitChild').options)
       .filter(option=>!habit.children.some(child=>child.id===option.value));
     if(!childOptions.length){
       document.getElementById('habitStatus').textContent='Η συνήθεια έχει ήδη ανατεθεί σε όλα τα παιδιά.';return;
     }
     const choices=childOptions.map((option,index)=>(index+1)+'. '+option.textContent).join('\\n');
     const choice=prompt('Επιλέξτε αριθμό παιδιού:\\n'+choices);
     if(choice===null)return;
     const index=Number(choice)-1;
     if(!Number.isInteger(index)||index<0||index>=childOptions.length){
       document.getElementById('habitStatus').textContent='Μη έγκυρη επιλογή.';return;
     }
     assign.disabled=true;
     try{
       const response=await fetch('/api/habits/assign',{method:'POST',credentials:'same-origin',
        headers:{'content-type':'application/json'},body:JSON.stringify({
         habit_id:habit.id,child_id:childOptions[index].value})});
       if(!response.ok)throw Error('Η ανάθεση δεν αποθηκεύτηκε.');
       document.getElementById('habitStatus').textContent='Η συνήθεια ανατέθηκε και στο παιδί.';
       await refreshHabits();await refreshActivityWorkflow();
     }catch(e){document.getElementById('habitStatus').textContent=e.message;assign.disabled=false}
   });li.append(assign);
   const archive=document.createElement('button');archive.className='secondary';archive.textContent='Αρχειοθέτηση';
   archive.addEventListener('click',async()=>{
    if(!confirm('Αρχειοθέτηση της συνήθειας; Το ιστορικό και οι πόντοι θα διατηρηθούν.'))return;
    archive.disabled=true;
    try{
     const res=await fetch('/api/habits/archive',{method:'POST',credentials:'same-origin',
      headers:{'content-type':'application/json'},body:JSON.stringify({habit_id:habit.id})});
     if(!res.ok)throw Error('Δεν αρχειοθετήθηκε η συνήθεια.');
     document.getElementById('habitStatus').textContent='Η συνήθεια αρχειοθετήθηκε.';
     await refreshHabits();await refreshActivityWorkflow();
    }catch(e){document.getElementById('habitStatus').textContent=e.message;archive.disabled=false}
   });
   li.append(archive);
   items.append(li);
  }
  document.getElementById('noHabits').hidden=data.habits.length>0;
 }
 async function refreshActivityWorkflow(){
  const [a,p,b]=await Promise.all([
    fetch('/api/activities',{credentials:'same-origin',cache:'no-store'}),
    fetch('/api/approvals',{credentials:'same-origin',cache:'no-store'}),
    fetch('/api/points',{credentials:'same-origin',cache:'no-store'})
  ]);
  if(!a.ok||!p.ok||!b.ok)throw Error('Δεν φορτώθηκαν οι δραστηριότητες.');
  const activities=(await a.json()).activities,pending=(await p.json()).pending,balances=(await b.json()).balances;
  for(const id of ['activitiesPanel','approvalsPanel','pointsPanel'])document.getElementById(id).hidden=false;
  const activitiesList=document.getElementById('activities');activitiesList.replaceChildren();
  for(const activity of activities){
    const li=document.createElement('li'),label=document.createElement('span');
    label.textContent=(activity.emoji||'⭐')+' '+activity.child_name+' — '+activity.habit_name+' ('+activity.points+' πόντοι) ';
    li.append(label);
    if(!activity.submission_status){
      const btn=document.createElement('button');btn.textContent='Το έκανα!';
      btn.addEventListener('click',async()=>{
        btn.disabled=true;
        try{
          const r=await fetch('/api/activities',{method:'POST',credentials:'same-origin',
            headers:{'content-type':'application/json'},
            body:JSON.stringify({child_id:activity.child_id,habit_id:activity.habit_id})});
          if(!r.ok)throw Error('Δεν καταχωρήθηκε. Ίσως έχει ήδη υποβληθεί σήμερα.');
          document.getElementById('activityNote').textContent='Η δραστηριότητα περιμένει έγκριση.';
          await refreshActivityWorkflow();
        }catch(e){document.getElementById('activityNote').textContent=e.message;btn.disabled=false}
      });li.append(btn);
    }else{
      const flag=document.createElement('small');
      flag.textContent=activity.submission_status==='pending'?'⏳ Σε αναμονή':activity.submission_status==='approved'?'✅ Εγκρίθηκε':'❌ Απορρίφθηκε';
      li.append(flag);
    }
    activitiesList.append(li);
  }
  const approvalsList=document.getElementById('approvals');approvalsList.replaceChildren();
  for(const completion of pending){
    const li=document.createElement('li'),label=document.createElement('span');
    label.textContent=completion.child_name+' — '+completion.habit_name+' ('+completion.points+' πόντοι) ';
    li.append(label);
    for(const decision of ['approved','rejected']){
      const btn=document.createElement('button');btn.className=decision==='rejected'?'secondary':'';
      btn.textContent=decision==='approved'?'Έγκριση':'Απόρριψη';
      btn.addEventListener('click',async()=>{
        li.querySelectorAll('button').forEach(b=>b.disabled=true);
        try{
          const r=await fetch('/api/approvals/review',{method:'POST',credentials:'same-origin',
           headers:{'content-type':'application/json'},
           body:JSON.stringify({completion_id:completion.id,decision})});
          if(!r.ok)throw Error('Η απόφαση δεν αποθηκεύτηκε. Δοκιμάστε ανανέωση.');
          document.getElementById('approvalNote').textContent=decision==='approved'?'Η έγκριση καταχωρήθηκε και οι πόντοι ενημερώθηκαν.':'Η δραστηριότητα απορρίφθηκε.';
          await refreshActivityWorkflow();
        }catch(e){document.getElementById('approvalNote').textContent=e.message;li.querySelectorAll('button').forEach(b=>b.disabled=false)}
      });li.append(btn);
    }
    approvalsList.append(li);
  }
  document.getElementById('noApprovals').hidden=pending.length>0;
  document.getElementById('pendingApprovalSummary').textContent='✅ Εγκρίσεις: '+pending.length;
  const balanceList=document.getElementById('balances');balanceList.replaceChildren();
  for(const child of balances){
   const li=document.createElement('li');li.textContent='🏅 '+child.child_name+': '+child.points+' πόντοι';balanceList.append(li);
  }
 }
 document.getElementById('habitForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=document.getElementById('habitSave'),status=document.getElementById('habitStatus');
  button.disabled=true;
  try{
   const payload={name:document.getElementById('habitName').value,
    child_id:document.getElementById('habitChild').value,
    frequency:document.getElementById('habitFrequency').value,
    points:Number(document.getElementById('habitPoints').value)};
   const response=await fetch('/api/habits',{method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
   if(!response.ok)throw Error('Η αποθήκευση απέτυχε. Παρακαλώ δοκιμάστε ξανά.');
   status.textContent='Η συνήθεια δημιουργήθηκε και ανατέθηκε!';
   document.getElementById('habitName').value='';
   await refreshHabits();await refreshActivityWorkflow();
  }catch(e){status.textContent=e.message}finally{button.disabled=false}
 });
 document.getElementById('form').addEventListener('submit',async ev=>{
  ev.preventDefault();const btn=document.getElementById('save'),note=document.getElementById('formStatus');btn.disabled=true;
  try{
   const r=await fetch('/api/children',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},
     body:JSON.stringify({name:document.getElementById('name').value,age_band:document.getElementById('age').value||null})});
   if(!r.ok)throw Error('Δεν αποθηκεύτηκε το προφίλ. Ελέγξτε τα στοιχεία.');
   document.getElementById('form').reset();note.textContent='Το παιδί προστέθηκε!';await refresh();
  }catch(e){note.textContent=e.message}finally{btn.disabled=false}
 });
 document.getElementById('createPair').addEventListener('click',async()=>{
  const btn=document.getElementById('createPair'),note=document.getElementById('deviceStatus');
  btn.disabled=true;document.getElementById('pairResult').hidden=true;
  try{
   const r=await fetch('/api/child/pairing',{method:'POST',credentials:'same-origin',
     headers:{'content-type':'application/json'},
     body:JSON.stringify({child_id:document.getElementById('deviceChild').value})});
   if(!r.ok)throw Error('Δεν δημιουργήθηκε ο κωδικός.');
   const data=await r.json();
   document.getElementById('pairCode').value=data.pairing_code;
   document.getElementById('pairResult').hidden=false;
   note.textContent='Κωδικός μίας χρήσης. Ισχύει 10 λεπτά.';
  }catch(e){note.textContent=e.message}finally{btn.disabled=false}
 });
 document.getElementById('copyPair').addEventListener('click',async()=>{
  const input=document.getElementById('pairCode');
  try{await navigator.clipboard.writeText(input.value);
   document.getElementById('deviceStatus').textContent='Ο κωδικός αντιγράφηκε.';
  }catch{input.select();document.getElementById('deviceStatus').textContent='Επιλέχθηκε ο κωδικός. Αντιγράψτε τον.'}
 });
 document.getElementById('revokeDevice').addEventListener('click',async()=>{
  if(!confirm('Να αποσυνδεθούν όλες οι συσκευές αυτού του παιδιού;'))return;
  const btn=document.getElementById('revokeDevice');btn.disabled=true;
  try{
   const r=await fetch('/api/child/revoke',{method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json'},
    body:JSON.stringify({child_id:document.getElementById('deviceChild').value})});
   if(!r.ok)throw Error('Δεν ολοκληρώθηκε η ανάκληση.');
   document.getElementById('pairResult').hidden=true;
   document.getElementById('deviceStatus').textContent='Η πρόσβαση ανακλήθηκε.';
  }catch(e){document.getElementById('deviceStatus').textContent=e.message}finally{btn.disabled=false}
 });
 async function refreshProgress(){
  const response=await fetch('/api/progress',{credentials:'same-origin',cache:'no-store'});
  if(!response.ok){document.getElementById('progressMessage').textContent='Η πρόοδος δεν είναι διαθέσιμη.';return}
  const data=await response.json(),list=document.getElementById('progressList');list.replaceChildren();
  for(const child of data.children){
   const item=document.createElement('li');
   item.textContent='🌟 '+child.child_name+' · '+child.approved_last_30_days+' ολοκληρώσεις · '+child.active_days_last_30_days+
    ' ενεργές ημέρες · '+child.current_streak_days+' ημέρες σερί · '+child.earned_last_30_days+' πόντοι κερδισμένοι';
   const rank=document.createElement('p');rank.className='subtle';
   rank.textContent='🦸 Επίπεδο '+child.level+' · '+child.lifetime_approved+' συνολικές αποστολές · '+child.lifetime_points_earned+' συνολικοί κερδισμένοι πόντοι';
   item.append(rank);
   if(child.badges.length){
    const badges=document.createElement('p');badges.textContent=child.badges.map(b=>b.emoji+' '+b.name).join(' · ');item.append(badges);
   }
   const details=document.createElement('details');
   const summary=document.createElement('summary');summary.textContent='Πρόσφατες δραστηριότητες';details.append(summary);
   const history=document.createElement('ul');
   for(const activity of child.recent_activity){
    const record=document.createElement('li');
    const state=activity.status==='approved'?'✅ Εγκρίθηκε':activity.status==='rejected'?'❌ Απορρίφθηκε':'⏳ Αναμονή';
    record.textContent=activity.habit_name+' · '+state+' · '+activity.occurrence_date;
    history.append(record);
   }
   if(!child.recent_activity.length){
    const empty=document.createElement('li');empty.textContent='Δεν υπάρχουν καταχωρήσεις.';history.append(empty);
   }
   details.append(history);item.append(details);
   list.append(item);
  }
  document.getElementById('progressPanel').hidden=false;
 }
 async function refreshRewards(){
  const [catalogResponse,requestsResponse]=await Promise.all([
    fetch('/api/rewards',{credentials:'same-origin',cache:'no-store'}),
    fetch('/api/rewards/redemptions',{credentials:'same-origin',cache:'no-store'})
  ]);
  if(!catalogResponse.ok||!requestsResponse.ok)throw Error('Δεν ήταν δυνατή η φόρτωση των επάθλων.');
  const catalog=(await catalogResponse.json()).rewards,requests=(await requestsResponse.json()).redemptions;
  const catalogList=document.getElementById('rewardsList');catalogList.replaceChildren();
  for(const reward of catalog){
    const item=document.createElement('li');
    item.textContent=(reward.emoji||'🎁')+' '+reward.name+' · '+reward.points_cost+' πόντοι · '+reward.children.map(child=>child.name).join(', ');
    if(reward.active){
      const edit=document.createElement('button');edit.className='secondary';edit.textContent='Επεξεργασία';
      edit.addEventListener('click',async()=>{
        const name=prompt('Όνομα επάθλου',reward.name);if(name===null)return;
        const description=prompt('Περιγραφή',reward.description||'');if(description===null)return;
        const costRaw=prompt('Κόστος πόντων',String(reward.points_cost));if(costRaw===null)return;
        const points_cost=Number(costRaw);
        if(!name.trim()||!Number.isInteger(points_cost)||points_cost<1||points_cost>100000){
          document.getElementById('rewardStatus').textContent='Ελέγξτε το όνομα και τους πόντους.';return;
        }
        edit.disabled=true;
        try{
          const response=await fetch('/api/rewards/update',{method:'POST',credentials:'same-origin',
            headers:{'content-type':'application/json'},body:JSON.stringify({
              reward_id:reward.id,name,description,points_cost,recurring:reward.recurring})});
          if(!response.ok)throw Error('Δεν ενημερώθηκε το έπαθλο.');
          document.getElementById('rewardStatus').textContent='Το έπαθλο ενημερώθηκε.';
          await refreshRewards();
        }catch(e){document.getElementById('rewardStatus').textContent=e.message;edit.disabled=false}
      });item.append(edit);
      const assign=document.createElement('button');assign.className='secondary';assign.textContent='Ανάθεση σε παιδί';
      assign.addEventListener('click',async()=>{
        const choices=Array.from(document.getElementById('rewardChild').options)
          .filter(option=>!reward.children.some(child=>child.id===option.value));
        if(!choices.length){
          document.getElementById('rewardStatus').textContent='Το έπαθλο έχει ανατεθεί σε όλα τα παιδιά.';return;
        }
        const selection=prompt('Επιλέξτε αριθμό παιδιού:\\n'+choices.map((option,i)=>(i+1)+'. '+option.textContent).join('\\n'));
        if(selection===null)return;
        const index=Number(selection)-1;
        if(!Number.isInteger(index)||index<0||index>=choices.length){
         document.getElementById('rewardStatus').textContent='Μη έγκυρη επιλογή.';return;
        }
        assign.disabled=true;
        try{
          const response=await fetch('/api/rewards/assign',{method:'POST',credentials:'same-origin',
           headers:{'content-type':'application/json'},body:JSON.stringify({
            reward_id:reward.id,child_id:choices[index].value})});
          if(!response.ok)throw Error('Η ανάθεση απέτυχε.');
          document.getElementById('rewardStatus').textContent='Το έπαθλο ανατέθηκε.';
          await refreshRewards();
        }catch(e){document.getElementById('rewardStatus').textContent=e.message;assign.disabled=false}
      });item.append(assign);
      const archive=document.createElement('button');archive.className='secondary';archive.textContent='Αρχειοθέτηση';
      archive.addEventListener('click',async()=>{
        if(!confirm('Να κρυφτεί το έπαθλο από τα παιδιά; Οι παλιές αιτήσεις παραμένουν.'))return;
        archive.disabled=true;
        try{
          const response=await fetch('/api/rewards/archive',{method:'POST',credentials:'same-origin',
            headers:{'content-type':'application/json'},body:JSON.stringify({reward_id:reward.id})});
          if(!response.ok)throw Error('Δεν αρχειοθετήθηκε το έπαθλο.');
          document.getElementById('rewardStatus').textContent='Το έπαθλο αρχειοθετήθηκε.';
          await refreshRewards();
        }catch(e){document.getElementById('rewardStatus').textContent=e.message;archive.disabled=false}
      });item.append(archive);
    }else{
      const archived=document.createElement('small');archived.textContent=' · Αρχειοθετημένο';item.append(archived);
    }
    catalogList.append(item);
  }
  document.getElementById('noRewards').hidden=catalog.length>0;
  const requestsList=document.getElementById('redemptionsList');requestsList.replaceChildren();
  for(const request of requests){
    const item=document.createElement('li'),label=document.createElement('span');
    label.textContent=request.child_name+' → '+request.reward_name+' · '+request.points_spent+' πόντοι · '+request.status+' ';
    item.append(label);
    const options=request.status==='requested'?[
      ['approved','Έγκριση'],['rejected','Απόρριψη']
    ]:request.status==='approved'?[['fulfilled','Παραδόθηκε']]:[];
    for(const [decision,text] of options){
      const button=document.createElement('button');button.textContent=text;
      if(decision==='rejected')button.className='secondary';
      button.addEventListener('click',async()=>{
        item.querySelectorAll('button').forEach(b=>b.disabled=true);
        try{
          const response=await fetch('/api/rewards/review',{method:'POST',credentials:'same-origin',
             headers:{'content-type':'application/json'},body:JSON.stringify({redemption_id:request.id,decision})});
          if(!response.ok)throw Error('Η ενέργεια απέτυχε. Ελέγξτε τους διαθέσιμους πόντους.');
          document.getElementById('redemptionStatus').textContent='Το αίτημα ενημερώθηκε.';
          await refreshRewards();await refreshActivityWorkflow();
        }catch(e){document.getElementById('redemptionStatus').textContent=e.message;item.querySelectorAll('button').forEach(b=>b.disabled=false)}
      });
      item.append(button);
    }
    requestsList.append(item);
  }
  document.getElementById('noRedemptions').hidden=requests.length>0;
  document.getElementById('pendingRedemptionSummary').textContent='🎁 Αιτήματα: '+requests.filter(item=>item.status==='requested').length;
 }
 document.getElementById('pointsForm').addEventListener('submit',async event=>{
  event.preventDefault();
  const button=document.getElementById('pointsSave'),status=document.getElementById('pointsStatus');
  const delta=Number(document.getElementById('pointsDelta').value);
  if(!Number.isInteger(delta)||delta===0||delta< -1000||delta>1000){
   status.textContent='Επιλέξτε ακέραιο αριθμό από -1000 έως +1000 (όχι μηδέν).';return;
  }
  button.disabled=true;
  try{
   const response=await fetch('/api/points/adjust',{method:'POST',credentials:'same-origin',
    headers:{'content-type':'application/json'},body:JSON.stringify({
     child_id:document.getElementById('pointsChild').value,delta,request_id:crypto.randomUUID()})});
   if(!response.ok)throw Error('Η αλλαγή απέτυχε. Ελέγξτε το διαθέσιμο υπόλοιπο.');
   status.textContent='Η διόρθωση καταχωρήθηκε στο ιστορικό πόντων.';
   document.getElementById('pointsDelta').value='';
   await refreshActivityWorkflow();await refreshProgress();
  }catch(e){status.textContent=e.message}finally{button.disabled=false}
 });
 document.getElementById('rewardForm').addEventListener('submit',async event=>{
  event.preventDefault();const save=document.getElementById('rewardSave');save.disabled=true;
  const status=document.getElementById('rewardStatus');
  try{
    const payload={name:document.getElementById('rewardName').value,
      description:document.getElementById('rewardDescription').value,
      points_cost:Number(document.getElementById('rewardCost').value),
      child_id:document.getElementById('rewardChild').value,
      recurring:document.getElementById('rewardRecurring').checked};
    const response=await fetch('/api/rewards',{method:'POST',credentials:'same-origin',
      headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    if(!response.ok)throw Error('Δεν δημιουργήθηκε το έπαθλο.');
    document.getElementById('rewardName').value='';
    document.getElementById('rewardDescription').value='';
    status.textContent='Το έπαθλο δημιουργήθηκε.';await refreshRewards();
  }catch(e){status.textContent=e.message}finally{save.disabled=false}
 });
 document.getElementById('logout').addEventListener('click',async()=>{
  await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});
  location.replace('/habit-hero/original-preview/');
 });
 refresh();
 </script></body></html>`;
 return new Response(html,{status:200,headers:{
  'content-type':'text/html; charset=utf-8','cache-control':'no-store, private',
  'referrer-policy':'no-referrer','x-content-type-options':'nosniff',
  'content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"
 }});
}
