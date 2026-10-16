// Habit Hero v2: independent, mobile-first presentation layer.
// Existing protected APIs remain the source of truth. No untrusted HTML injection.
export function v2Page(role='child'){
 const child=role==='child';
 const html=`<!doctype html><html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#111b35"><meta name="apple-mobile-web-app-capable" content="yes"><link rel="manifest" href="/habit-hero/app/parent.webmanifest"><title>Habit Hero V2</title>
 <style>
 *{box-sizing:border-box}html{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}body{margin:0;background:#f4f7fb;color:#162443}button,input,select{font:inherit}button{cursor:pointer;border:0}button:focus-visible{outline:3px solid #fbbf24;outline-offset:3px}[hidden]{display:none!important}
 body[data-theme="adventure"]{--accent:#fbbf59;--surface:#191c3c;--ink:#fff;--muted:#c5c8e5;--bg:linear-gradient(165deg,#141633,#413469 65%,#202854);--glow:#eda35a}
 body[data-theme="playful"]{--accent:#8d6df6;--surface:#fff;--ink:#24244f;--muted:#777898;--bg:linear-gradient(150deg,#e6deff,#d7f5ff 65%,#fff1d9);--glow:#9a7bed}
 body[data-theme="minimal"]{--accent:#358f85;--surface:#fff;--ink:#202d39;--muted:#677782;--bg:linear-gradient(160deg,#f7f8f5,#e7f2ee);--glow:#7db8a9}
 body[data-theme="youth"]{--accent:#36a8ff;--surface:#162237;--ink:#f3f8ff;--muted:#a6b6cd;--bg:linear-gradient(155deg,#091529,#152442 65%,#11182a);--glow:#378dfa}
 body{background:var(--bg);min-height:100dvh;color:var(--ink);transition:background .35s}
 .shell{max-width:940px;margin:auto;padding:calc(env(safe-area-inset-top) + 17px) 18px calc(env(safe-area-inset-bottom) + 104px)}
 .top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:22px}.top h1{font-size:clamp(24px,6vw,34px);letter-spacing:-1px;margin:4px 0}.eyebrow{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:var(--muted);font-weight:800}
 .controls{display:flex;align-items:center;gap:7px}.iconbtn{width:45px;height:45px;border-radius:16px;background:color-mix(in srgb,var(--surface),transparent 14%);color:var(--ink);font-size:21px;position:relative}.count{position:absolute;right:-3px;top:-5px;background:#fb5472;color:white;border-radius:100px;padding:2px 6px;font-size:11px}.ringing{animation:ring 1.5s infinite}
 @keyframes ring{0%,70%,100%{transform:rotate(0)}80%{transform:rotate(13deg)}90%{transform:rotate(-10deg)}}
 .panel{background:var(--surface);border:1px solid color-mix(in srgb,var(--ink),transparent 92%);border-radius:26px;padding:21px;margin-bottom:16px;box-shadow:0 15px 35px #08132a12;color:var(--ink)}
 .stage{min-height:330px;border-radius:30px;overflow:hidden;position:relative;padding:30px 20px;display:grid;align-content:end;background:radial-gradient(circle at 70% 26%,#a59bff8c,transparent 40%),linear-gradient(150deg,#364779,#1e2257 80%);color:white}
 body[data-theme="playful"] .stage{background:radial-gradient(circle at 75% 30%,#fff5b5,transparent 40%),linear-gradient(140deg,#aa91f6,#83cce9)}
 body[data-theme="minimal"] .stage{background:linear-gradient(145deg,#e2e9ea,#cddfd9);color:#1c514f}
 body[data-theme="youth"] .stage{background:radial-gradient(circle at 75% 20%,#148fc966,transparent 35%),linear-gradient(140deg,#101e37,#273d5f)}
 .hero-art{font-size:105px;position:absolute;right:10%;top:38px;filter:drop-shadow(0 16px 15px #0003);animation:float 4s ease-in-out infinite}.stage h2{font-size:29px;letter-spacing:-1px;margin:0}.stage p{opacity:.9;margin:7px 0 0}
 @keyframes float{50%{transform:translateY(-13px)}}.progress{height:11px;background:#ffffff50;border-radius:99px;overflow:hidden;margin:15px 0 0}.fill{height:100%;width:0;background:linear-gradient(90deg,#88f1bb,#fada71);border-radius:99px;transition:width .6s}
 .heading{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:24px 0 12px}.heading h2{font-size:21px;margin:0}.muted{color:var(--muted);font-size:13px}.mission{width:100%;display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:center;text-align:left;gap:12px;margin:9px 0;background:var(--surface);color:var(--ink);padding:13px;border-radius:20px;border:1px solid #8882;min-height:79px}.mission .emoji{width:51px;height:51px;background:color-mix(in srgb,var(--accent),transparent 80%);border-radius:16px;display:grid;place-items:center;font-size:28px}.mission strong{display:block;overflow-wrap:anywhere}.mission small{display:block;margin-top:5px;color:var(--muted)}
 .pill{padding:7px 10px;border-radius:22px;background:color-mix(in srgb,var(--accent),transparent 80%);color:var(--ink);font-size:12px;font-weight:800}.primary{background:var(--accent);color:#132033;padding:15px 20px;border-radius:17px;font-weight:800;min-height:50px}.secondary{background:color-mix(in srgb,var(--accent),transparent 80%);color:var(--ink);padding:13px 16px;border-radius:16px}
 .nav{position:fixed;bottom:0;left:0;right:0;padding:10px 12px calc(env(safe-area-inset-bottom) + 10px);display:flex;justify-content:space-evenly;gap:6px;max-width:940px;margin:auto;background:color-mix(in srgb,var(--surface),transparent 5%);backdrop-filter:blur(18px);border-radius:22px 22px 0 0;z-index:20}.nav button{flex:1;color:var(--muted);background:transparent;padding:8px 1px;border-radius:14px;font-size:11px;min-width:0}.nav button span{display:block;font-size:21px;margin-bottom:4px}.nav button[aria-selected="true"]{color:var(--accent);background:color-mix(in srgb,var(--accent),transparent 89%)}
 .themes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.theme{border-radius:20px;padding:22px 10px;color:white;font-weight:800;min-height:85px}.theme[aria-pressed="true"]{outline:3px solid var(--accent);outline-offset:3px}.theme[data-value="adventure"]{background:linear-gradient(140deg,#1f214e,#6c437c)}.theme[data-value="playful"]{background:linear-gradient(140deg,#aa79e6,#8ad9cf)}.theme[data-value="minimal"]{background:linear-gradient(140deg,#8bb3a7,#647f7b)}.theme[data-value="youth"]{background:linear-gradient(140deg,#0a172a,#2c558b)}
 .dialog{position:fixed;inset:0;z-index:40;background:#050b23ba;display:grid;place-items:center;padding:16px}.sheet{background:var(--surface);color:var(--ink);padding:24px;border-radius:26px;width:min(100%,520px);max-height:88dvh;overflow:auto}.sheet h2{margin:0 0 14px}.sheet p{line-height:1.65}.sheet .actions{display:flex;flex-wrap:wrap;gap:9px}.message{padding:15px;border-radius:18px;background:color-mix(in srgb,var(--accent),transparent 88%);margin:10px 0}
 .field{display:grid;gap:6px;margin:10px 0}.field input,.field select,.field textarea{width:100%;padding:13px;border:1px solid #8885;border-radius:13px;color:var(--ink);background:var(--surface)}
 .notice{padding:14px;border-radius:15px;background:color-mix(in srgb,var(--accent),transparent 85%);margin:12px 0}
 @media(min-width:700px){.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}.stage{min-height:405px}}@media(max-width:370px){.shell{padding-left:10px;padding-right:10px}.stage{min-height:280px}.hero-art{font-size:77px}.nav button{font-size:10px}}
 @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
 </style></head><body data-theme="minimal"><main class="shell">
 <header class="top"><div><div class="eyebrow">HABIT HERO · V2</div><h1 id="greeting">Η περιπέτειά σου</h1></div><div class="controls"><button id="bell" class="iconbtn" aria-label="Μηνύματα">🔔<span id="bellCount" class="count" hidden></span></button><button id="switchUser" class="iconbtn" aria-label="Αλλαγή χρήστη">⇄</button></div></header>
 <section id="homeTab"><div class="stage"><div id="heroArt" class="hero-art">🦸</div><div style="position:relative;max-width:66%"><div class="eyebrow">TODAY'S ADVENTURE</div><h2 id="heroHeading">Κάθε μικρή νίκη μετράει.</h2><p id="heroSubtitle">Ο κόσμος σου μεγαλώνει μαζί σου.</p></div><div class="progress"><div id="progressFill" class="fill"></div></div><div id="progressLabel" style="margin-top:10px;font-weight:700">—</div></div><div class="heading"><h2>Οι αποστολές μου</h2><span id="missionTotal" class="muted"></span></div><div id="missionList"></div></section>
 <section id="messagesTab" hidden><h2>🔔 Μηνύματα</h2><div id="messagesList"></div></section>
 <section id="rewardsTab" hidden><h2>🎁 Έπαθλα</h2><div id="rewardsList"></div></section>
 <section id="profileTab" hidden><div class="panel"><h2>🎨 Διάλεξε τον κόσμο σου</h2><div id="themeChoices" class="themes"></div></div><div id="profileInfo" class="panel"></div></section>
 <nav class="nav" id="tabs" aria-label="Πλοήγηση"></nav><p id="error" role="status" class="muted"></p></main><div id="modal" class="dialog" hidden><div class="sheet"><button id="closeModal" class="secondary" style="float:right">✕</button><div id="modalBody"></div></div></div>
 <script>
 const ROLE=${JSON.stringify(role)},$=id=>document.getElementById(id);
 const tabs=ROLE==='child'?[['home','🏠','Αρχική'],['rewards','🎁','Έπαθλα'],['profile','🦸','Ο ήρωας'],['messages','🔔','Μηνύματα']]:[['home','🏠','Αρχική'],['rewards','🎁','Έπαθλα'],['profile','⚙️','Εμφάνιση'],['messages','🔔','Μηνύματα']];
 let actor=null,activities=[],messages=[],rewards=[],balance=0;
 const esc=s=>String(s??'');
 const themeList=[['playful','🌈 Playful'],['adventure','⚔️ Hero Adventure'],['minimal','✦ Minimal'],['youth','⚡ Pro Youth']];
 const themeKey=()=> 'hh2-theme-'+ROLE+'-'+(actor?.id||'default');
 function theme(v){if(!themeList.some(x=>x[0]===v))v='minimal';document.body.dataset.theme=v;
  for(const b of document.querySelectorAll('.theme'))b.setAttribute('aria-pressed',String(b.dataset.value===v));
  try{localStorage.setItem(themeKey(),v)}catch{}}
 function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=esc(text);if(cls)el.className=cls;return el}
 function openTab(name){for(const [id] of tabs){$(id+'Tab').hidden=id!==name}for(const b of $('tabs').children)b.setAttribute('aria-selected',String(b.dataset.tab===name))}
 function showModal(title,content){$('modalBody').replaceChildren(node('h2',title),content);$('modal').hidden=false}
 $('closeModal').onclick=()=>{$('modal').hidden=true};$('modal').addEventListener('click',e=>{if(e.target===$('modal'))$('modal').hidden=true});
 for(const [id,icon,label] of tabs){const b=node('button');b.dataset.tab=id;b.append(node('span',icon),node('span',label));b.onclick=()=>openTab(id);$('tabs').append(b)}openTab('home');
 for(const [id,label] of themeList){const b=node('button',label,'theme');b.dataset.value=id;b.onclick=()=>theme(id);$('themeChoices').append(b)}
 $('bell').onclick=()=>{openTab('messages');try{localStorage.setItem('hh2-seen-'+(actor?.id||'default'),messages[0]?.id||'')}catch{};updateBell()};
 $('switchUser').onclick=async()=>{try{await fetch('/api/household/exit',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:'{}'})}catch{}location.replace('/habit-hero/welcome/')};
 function updateBell(){const seen=(()=>{try{return localStorage.getItem('hh2-seen-'+(actor?.id||'default'))||''}catch{return ''}})();const unread=!!messages.length&&messages[0].id!==seen;$('bellCount').hidden=!unread;$('bellCount').textContent=unread?String(messages.length):'';$('bell').classList.toggle('ringing',unread)}
 function renderMissions(){const list=$('missionList');list.replaceChildren();const completed=activities.filter(x=>x.submission_status==='approved'||x.submission_status==='pending').length,total=activities.length;
  $('progressFill').style.width=(total?100*completed/total:0)+'%';$('progressLabel').textContent=completed+' / '+total+' αποστολές';$('missionTotal').textContent=total+' σήμερα';
  if(total&&completed===total){list.append(node('div','🏆 Όλα έτοιμα! Απόλαυσε τον ελεύθερο χρόνο σου.','notice'));return}
  if(!total){list.append(node('div','✨ Οι επόμενες αποστολές σου θα εμφανιστούν εδώ.','notice'));return}
  for(const m of activities){const b=node('button',undefined,'mission');b.append(node('span',m.emoji||'⭐','emoji'));const t=node('div');t.append(node('strong',m.habit_name),node('small',(m.slot_total>1?m.slot_index+'/'+m.slot_total+' · ':'')+(m.submission_status==='pending'?'Σε έγκριση':m.submission_status==='approved'?'Ολοκληρώθηκε':m.points+' πόντοι')));b.append(t,node('span',m.submission_status?'✓':'›','pill'));b.onclick=()=>detail(m);list.append(b)}}
 function detail(m){const wrap=node('div');const info=node('p',m.description_el||'Αποστολή: '+m.habit_name);const why=node('div',m.why_important_el?'💡 Γιατί έχει σημασία: '+m.why_important_el:'Κάθε προσπάθεια σε βοηθά να αναπτυχθείς.','notice');wrap.append(info,why);
  const actions=node('div',undefined,'actions');
  const help=node('button','🙋 Χρειάζομαι βοήθεια','secondary');help.onclick=async()=>{help.disabled=true;try{const r=await fetch('/api/child/help',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({habit_id:m.habit_id})});if(!r.ok&&r.status!==409)throw Error();help.textContent='💌 Στάλθηκε στο γονέα'}catch{help.disabled=false;help.textContent='Δοκίμασε ξανά'}};
  const done=node('button',m.submission_status?'✓ '+m.submission_status:'Το έκανα!','primary');done.disabled=!!m.submission_status;done.onclick=async()=>{done.disabled=true;try{const r=await fetch('/api/child/activities',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({habit_id:m.habit_id,slot_index:m.slot_index||1})});if(!r.ok)throw Error((await r.json()).detail||'Αποτυχία');$('modal').hidden=true;await loadChild();showModal('🌟 Φοβερή προσπάθεια!',node('p','Η αποστολή σου στάλθηκε για έγκριση!'))}catch(e){done.disabled=false;wrap.append(node('p',e.message))}};
  actions.append(help,done);wrap.append(actions);showModal(m.habit_name,wrap)}
 function renderMessages(){const list=$('messagesList');list.replaceChildren();if(!messages.length){list.append(node('div','💌 Τα μηνύματά σου θα εμφανίζονται εδώ.','panel'));return}for(const m of messages){const card=node('div',undefined,'panel');card.append(node('strong','💜 Μήνυμα από γονέα'),node('p',m.parent_message));list.append(card)}}
 async function loadChild(){
  const me=await fetch('/api/child/me',{credentials:'same-origin',cache:'no-store'});if(!me.ok){$('error').textContent='Χρειάζεται σύνδεση παιδιού από την οικογενειακή αρχική.';return}
  actor=await me.json();$('greeting').textContent='Γεια σου, '+actor.name+'!';$('heroArt').textContent=actor.avatar_id==='unicorn'?'🦄':actor.avatar_id==='robot'?'🤖':'🦸';
  try{theme(localStorage.getItem(themeKey())||'playful')}catch{theme('playful')}
  const [a,h,r]=await Promise.all([fetch('/api/child/activities',{credentials:'same-origin'}),fetch('/api/child/help',{credentials:'same-origin'}),fetch('/api/child/rewards',{credentials:'same-origin'})]);
  if(a.ok)activities=(await a.json()).activities||[];
  if(h.ok)messages=((await h.json()).requests||[]).filter(x=>x.parent_message);
  if(r.ok){const v=await r.json();rewards=v.rewards||[];balance=v.balance||0}
  renderMissions();renderMessages();updateBell();$('rewardsList').replaceChildren(node('div','⭐ '+balance+' διαθέσιμοι πόντοι','panel'));
  for(const reward of rewards){const card=node('div',undefined,'panel');card.append(node('h3',(reward.emoji||'🎁')+' '+reward.name),node('p',reward.points_cost+' πόντοι'));$('rewardsList').append(card)}
  $('profileInfo').replaceChildren(node('h2','Ο δικός σου κόσμος'),node('p','Μικρά βήματα, μεγάλη περιπέτεια.'));
 }
 async function loadParent(){
  const r=await fetch('/api/family/overview',{credentials:'same-origin'});if(!r.ok){$('error').textContent='Ξεκλείδωσε πρώτα το προφίλ γονέα.';return}
  const data=await r.json();actor={id:data.parent.id,name:data.parent.name};$('greeting').textContent='Η οικογένειά μου';$('heroArt').textContent='🏡';theme('minimal');
  $('heroHeading').textContent='Μαζί χτίζουμε καλές συνήθειες.';$('heroSubtitle').textContent=(data.children||[]).length+' μικροί ήρωες στην οικογένεια.';
  $('missionList').replaceChildren();for(const child of data.children||[]){const b=node('button',undefined,'mission');b.append(node('span','🦸','emoji'),node('strong',child.display_name||child.name));$('missionList').append(b)}
  $('profileInfo').append(node('p','Πλήρης διαχείριση προτύπων και προσαρμοσμένων συνηθειών:'));const link=node('a','Άνοιγμα εργαλείων γονέα →');link.href='/habit-hero/welcome/parent/';$('profileInfo').append(link);
  $('rewardsList').append(node('p','Οι επιβραβεύσεις βρίσκονται στο εργαλείο γονέα.'));$('messagesList').append(node('p','Τα αιτήματα βοήθειας βρίσκονται στο εργαλείο γονέα.'));
 }
 (ROLE==='child'?loadChild():loadParent()).catch(e=>{$('error').textContent='Προσωρινό πρόβλημα: '+e.message});
 </script></body></html>`;
 return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store, private','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}});
}
