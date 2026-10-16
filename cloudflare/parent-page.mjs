// Small, Worker-owned parent dashboard until the Expo feature screens are migrated.
export function parentPage() {
 const html=`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer">
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
 </style></head><body><main><header><div><h1>🏆 Habit Hero</h1><div class="subtle">Οικογενειακός πίνακας</div></div><button id="logout" class="secondary">Αποσύνδεση</button></header>
 <section class="panel"><h2 id="greeting">Φόρτωση...</h2><p id="status" role="status" class="subtle">Έλεγχος σύνδεσης...</p></section>
 <section class="panel" id="family" hidden><h2>👨‍👩‍👧‍👦 Τα παιδιά μου</h2><p class="subtle">Δημιουργήστε το προφίλ κάθε παιδιού. Δεν απαιτείται Google λογαριασμός για τα παιδιά.</p>
 <ul id="children"></ul><p id="empty" class="subtle">Δεν υπάρχουν ακόμη προφίλ παιδιών.</p></section>
 <section class="panel" id="create" hidden><h2>➕ Προσθήκη παιδιού</h2><form id="form"><label for="name">Όνομα ή ψευδώνυμο</label>
 <input id="name" maxlength="80" autocomplete="off" required placeholder="π.χ. Αλέξης">
 <label for="age">Ηλικιακή ομάδα (προαιρετική)</label><select id="age"><option value="">Δεν θέλω να δηλώσω</option><option value="6-8">6–8</option><option value="9-11">9–11</option><option value="12-14">12–14</option></select>
 <button id="save" type="submit">Προσθήκη παιδιού</button></form><p id="formStatus" role="status" class="subtle"></p></section>
 <section class="panel" id="habitPanel" hidden><h2>✅ Συνήθειες</h2><p class="subtle">Αναθέστε δραστηριότητες στα παιδιά. Οι πόντοι θα ενεργοποιηθούν όταν υλοποιηθούν οι εγκρίσεις.</p>
 <ul id="habits"></ul><p id="noHabits" class="subtle">Δεν υπάρχουν ακόμη συνήθειες.</p>
 <form id="habitForm"><label for="habitName">Όνομα συνήθειας</label><input id="habitName" required maxlength="100" placeholder="π.χ. Βουρτσίζω τα δόντια μου">
 <label for="habitChild">Παιδί</label><select id="habitChild" required></select>
 <label for="habitFrequency">Συχνότητα</label><select id="habitFrequency"><option value="daily">Καθημερινά</option><option value="weekly">Εβδομαδιαία</option><option value="monthly">Μηνιαία</option><option value="once">Μία φορά</option></select>
 <label for="habitPoints">Πόντοι</label><input id="habitPoints" type="number" min="1" max="1000" value="10" required>
 <button id="habitSave" type="submit">Δημιουργία και ανάθεση</button></form><p id="habitStatus" role="status" class="subtle"></p></section>
 <section class="panel"><h2>🚧 Επόμενες λειτουργίες</h2><p class="subtle">Η καταχώριση ολοκληρώσεων, οι πόντοι και οι επιβραβεύσεις θα ενεργοποιηθούν σε επόμενο βήμα.</p></section>
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
   list.replaceChildren();
   for(const child of data.children) {
    const li=document.createElement('li');li.textContent='🌟 '+child.display_name+(child.age_band?' · '+child.age_band:'');list.append(li);
   }
   empty.hidden=data.children.length>0;
   const select=document.getElementById('habitChild');select.replaceChildren();
   for(const child of data.children){
    const option=document.createElement('option');option.value=child.id;option.textContent=child.display_name;select.append(option);
   }
   document.getElementById('habitPanel').hidden=data.children.length===0;
   if(data.children.length)await refreshHabits();
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
   li.textContent=(habit.emoji||'⭐')+' '+habit.name+' · '+habit.points+' πόντοι · '+habit.children.map(c=>c.name).join(', ');
   items.append(li);
  }
  document.getElementById('noHabits').hidden=data.habits.length>0;
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
   await refreshHabits();
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
