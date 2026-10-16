export function householdPage(){
 const html=`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
 <meta name="referrer" content="no-referrer"><meta name="theme-color" content="#6456e8"><title>Habit Hero — Καλώς ήρθατε</title>
 <style>*{box-sizing:border-box}body{margin:0;min-height:100dvh;background:radial-gradient(circle at top left,#d5dcff,#f3eeff 45%,#fff4dd);font:16px system-ui,sans-serif;color:#2c285d;display:flex;justify-content:center;align-items:center;padding:18px}
 main{width:min(100%,540px);text-align:center}h1{font-size:clamp(36px,7vw,54px);margin:0 0 7px;letter-spacing:-2px}p{line-height:1.5;color:#625c81}
 .panel{background:#fff;border-radius:28px;padding:26px;margin:18px 0;box-shadow:0 18px 65px #3a327326}
 .profiles{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}
 button,.action{border:0;border-radius:19px;background:#6456e8;color:white;font:inherit;font-weight:750;padding:16px;min-height:55px;cursor:pointer}
 button:disabled{opacity:.6}.profile{background:#f2f1ff;color:#383078;display:flex;flex-direction:column;align-items:center;gap:8px;min-height:136px;justify-content:center}
 .profile span:first-child{font-size:42px}.profile[aria-pressed=true]{background:#6556e8;color:white}
 input{font:inherit;font-size:26px;text-align:center;letter-spacing:12px;width:100%;max-width:250px;border-radius:15px;border:2px solid #d6d3f1;padding:13px;background:#faf9ff}
 label{display:block;margin:12px 0;font-weight:700}
 .muted{font-size:14px}#message{min-height:24px}a{color:#6256dc}
 [hidden]{display:none!important}@media(min-width:450px){.profiles{grid-template-columns:repeat(3,minmax(0,1fr))}}
 </style></head><body><main><div style="font-size:58px">🏆</div><h1>Habit Hero</h1><p>Κάθε μέρα, μια νέα περιπέτεια!</p>
 <section class="panel" id="loading"><p>Ετοιμάζουμε την οικογένειά σου…</p></section>
 <section class="panel" id="signup" hidden><h2>🚀 Ξεκινά η περιπέτειά σας!</h2>
 <p>1️⃣ Δημιουργείς οικογενειακό λογαριασμό με Google.</p><p>2️⃣ Ορίζεις το PIN σου.</p><p>3️⃣ Προσθέτεις το πρώτο παιδί με το δικό του PIN.</p><p>4️⃣ Μετά όλοι επιλέγετε προφίλ από την ίδια συσκευή.</p><a class="action" style="display:block;text-decoration:none" href="/api/auth/google/start">Συνέχεια με Google</a></section>
 <section class="panel" id="setup" hidden><h2>✨ Μικρή προετοιμασία</h2><p id="setupText"></p>
 <form id="parentPinSetup" hidden><label for="newPin">Δημιούργησε PIN γονέα</label><input id="newPin" type="text" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off" required>
 <label for="repeatPin">Επιβεβαίωση PIN</label><input id="repeatPin" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="new-password" required>
 <p id="pinMismatch" role="alert" style="color:#a82844;font-weight:700" hidden>Τα δύο PIN δεν ταιριάζουν.</p><p><button id="saveParentPin" type="submit">Αποθήκευση PIN</button></p></form>
 <a id="addChild" class="action" href="/habit-hero/parent/#home" hidden style="display:block;text-decoration:none">Προσθήκη πρώτου παιδιού →</a>
 </section>
 <section class="panel" id="choose" hidden><h2>👋 Ποιος παίζει σήμερα;</h2><p>Επίλεξε το προφίλ σου.</p>
 <div class="profiles" id="profiles"></div></section>
 <section class="panel" id="unlock" hidden><button id="back" type="button" style="background:transparent;color:#6256dc;padding:6px;min-height:0">← Αλλαγή προφίλ</button>
 <h2 id="selectedName"></h2><form id="unlockForm"><label for="entryPin">Πληκτρολόγησε το PIN σου</label>
 <input id="entryPin" type="password" inputmode="numeric" pattern="[0-9]{4}" minlength="4" maxlength="4" autocomplete="off" required>
 <p><button id="unlockButton">Πάμε! 🚀</button></p></form></section><p id="message" role="status"></p>
 </main><script>
 const el=id=>document.getElementById(id);let selected=null;
 const sections=['loading','signup','setup','choose','unlock'];
 const show=id=>{for(const name of sections)el(name).hidden=name!==id;el('message').textContent=''};
 async function api(path,payload){
  const r=await fetch(path,{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
  const json=await r.json().catch(()=>({}));if(!r.ok)throw Error(json.detail||'Δεν ήταν δυνατή η σύνδεση.');return json;
 }
 async function load(){
  show('loading');
  try{
   const r=await fetch('/api/household',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw Error('Πρόβλημα σύνδεσης');
   const data=await r.json();
   if(data.google_required){show('signup');return}
   if(data.setup){
    show('setup');
    el('parentPinSetup').hidden=data.has_parent_pin;
    el('addChild').hidden=!data.has_parent_pin;
    el('setupText').textContent=data.has_parent_pin?'Πρόσθεσε το πρώτο σου παιδί και όρισε το δικό του PIN.':'Πρώτα όρισε ένα τετραψήφιο PIN γονέα.';
    return;
   }
   el('profiles').replaceChildren();
   const items=[{id:null,name:data.parent_name||'Γονέας',avatar:'👨‍👩‍👧',parent:true},...data.children.map(x=>({id:x.id,name:x.display_name,avatar:'🦸',parent:false}))];
   for(const item of items){
    const button=document.createElement('button');button.type='button';button.className='profile';
    const icon=document.createElement('span');icon.textContent=item.avatar;const label=document.createElement('span');label.textContent=item.name;
    button.append(icon,label);button.addEventListener('click',()=>{selected=item;el('selectedName').textContent=item.name;el('entryPin').value='';show('unlock');el('entryPin').focus()});
    el('profiles').append(button);
   }
   show('choose');
  }catch(e){el('message').textContent=e.message;show('signup')}
 }
 el('parentPinSetup').addEventListener('submit',async e=>{
  e.preventDefault();
  if(el('newPin').value!==el('repeatPin').value){
   el('pinMismatch').hidden=false;el('message').textContent='Τα δύο PIN δεν ταιριάζουν.';return;
  }
  el('pinMismatch').hidden=true;
  const save=el('saveParentPin');save.disabled=true;
  try{await api('/api/household/parent-pin',{pin:el('newPin').value});await load()}
  catch(err){el('message').textContent=err.message}
  finally{save.disabled=false}
 });
 ['newPin','repeatPin'].forEach(id=>el(id).addEventListener('input',()=>{
  const a=el('newPin').value,b=el('repeatPin').value;
  el('pinMismatch').hidden=!a||!b||a===b;
  if(a&&b&&a!==b)el('message').textContent='Τα δύο PIN δεν ταιριάζουν.';
  else el('message').textContent='';
 }));
 el('unlockForm').addEventListener('submit',async e=>{
  e.preventDefault();const button=el('unlockButton');button.disabled=true;
  try{const result=await api('/api/household/unlock',{pin:el('entryPin').value,child_id:selected.id});location.replace(result.url)}
  catch(err){el('message').textContent=err.message;el('entryPin').value=''}finally{button.disabled=false}
 });
 el('back').addEventListener('click',()=>show('choose'));
 load();
 </script></body></html>`;
 return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store, private','referrer-policy':'no-referrer','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'"}});
}
