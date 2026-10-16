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
 .stage{background-image:linear-gradient(90deg,#141633bf,#14163333),url("/habit-hero/app/v2-world-adventure.svg");background-size:cover;background-position:center}
 body[data-theme="playful"] .stage{background-image:linear-gradient(90deg,#e4cafa60,#fff2fa10),url("/habit-hero/app/v2-world-playful.svg")}
 body[data-theme="minimal"] .stage{background-image:linear-gradient(90deg,#eaf1eb60,#fff9),url("/habit-hero/app/v2-world-minimal.svg")}
 body[data-theme="youth"] .stage{background-image:linear-gradient(90deg,#061229a1,#0915282e),url("/habit-hero/app/v2-world-youth.svg")}
 .hero-art{position:absolute;right:1%;top:6px;width:min(48%,240px);height:84%;object-fit:contain;object-position:center bottom;filter:drop-shadow(0 16px 15px #0003);animation:float 4s ease-in-out infinite}
 .hero-select{display:flex;flex-wrap:wrap;gap:12px;margin:15px 0}.hero-choice{display:grid;place-items:center;gap:7px;flex:1;min-width:100px;padding:12px;background:color-mix(in srgb,var(--accent),transparent 90%);border-radius:20px;color:var(--ink)}.hero-choice img{height:115px;max-width:100%;object-fit:contain}.hero-choice[aria-pressed="true"]{outline:3px solid var(--accent)}
 .sticker{display:inline-flex;align-items:center;gap:7px;border-radius:99px;background:color-mix(in srgb,var(--accent),transparent 82%);padding:7px 14px;font-size:12px;font-weight:800}.stage h2{font-size:29px;letter-spacing:-1px;margin:0}.stage p{opacity:.9;margin:7px 0 0}
 @keyframes float{50%{transform:translateY(-13px)}}.progress{height:11px;background:#ffffff50;border-radius:99px;overflow:hidden;margin:15px 0 0}.fill{height:100%;width:0;background:linear-gradient(90deg,#88f1bb,#fada71);border-radius:99px;transition:width .6s}
 .heading{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:24px 0 12px}.heading h2{font-size:21px;margin:0}.muted{color:var(--muted);font-size:13px}.mission{width:100%;display:grid;grid-template-columns:52px minmax(0,1fr) auto;align-items:center;text-align:left;gap:12px;margin:9px 0;background:var(--surface);color:var(--ink);padding:13px;border-radius:20px;border:1px solid #8882;min-height:79px}.mission .emoji{width:51px;height:51px;background:color-mix(in srgb,var(--accent),transparent 80%);border-radius:16px;display:grid;place-items:center;font-size:28px}.mission strong{display:block;overflow-wrap:anywhere}.mission small{display:block;margin-top:5px;color:var(--muted)}
 .pill{padding:7px 10px;border-radius:22px;background:color-mix(in srgb,var(--accent),transparent 80%);color:var(--ink);font-size:12px;font-weight:800}.primary{background:var(--accent);color:#132033;padding:15px 20px;border-radius:17px;font-weight:800;min-height:50px}.secondary{background:color-mix(in srgb,var(--accent),transparent 80%);color:var(--ink);padding:13px 16px;border-radius:16px}
 .world-caption{position:absolute;top:17px;left:18px;display:inline-flex;align-items:center;gap:8px;color:white;background:#11193266;padding:8px 12px;border:1px solid #ffffff40;border-radius:99px;backdrop-filter:blur(8px);font-size:11px;font-weight:800;letter-spacing:1px}
 .hero-art{z-index:1}.stage>div:not(.world-caption){z-index:2}.stage{box-shadow:0 22px 55px color-mix(in srgb,var(--glow),transparent 60%);border:1px solid #ffffff35}
 .portrait-progress{display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:18px}.portrait-progress strong{font-size:15px}
 .egg{display:flex;align-items:center;gap:12px;border-radius:22px;background:color-mix(in srgb,var(--accent),transparent 88%);padding:15px;margin:16px 0;overflow:hidden}.egg .egg-icon{font-size:52px;animation:float 4s ease-in-out infinite}.egg h3{margin:0 0 5px}.egg p{margin:0;font-size:13px;color:var(--muted)}
 .reward-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.reward-item{background:var(--surface);border-radius:23px;padding:20px 12px;text-align:center;border:1px solid #8882;min-width:0}.reward-item .big{font-size:54px;display:block;margin-bottom:14px}.reward-item strong{overflow-wrap:anywhere;display:block;min-height:45px}.reward-item p{color:var(--muted);margin:7px}
 .mission-scene{min-height:185px;display:grid;place-items:center;margin:-10px -10px 20px;border-radius:23px;background:radial-gradient(circle at 50% 30%,#fff9,transparent 45%),linear-gradient(140deg,#9fa3ed,#7dc9ce);position:relative;overflow:hidden}.mission-scene img{height:170px;max-width:60%;object-fit:contain}.mission-scene .mission-symbol{font-size:72px;filter:drop-shadow(0 8px 12px #0004);position:absolute;right:17%;top:20px;animation:float 3s infinite}
 .message{border:1px solid color-mix(in srgb,var(--accent),transparent 77%);display:flex;align-items:flex-start;gap:13px}.message-icon{width:47px;height:47px;flex:none;border-radius:14px;background:color-mix(in srgb,var(--accent),transparent 72%);display:grid;place-items:center;font-size:24px}
 .celebrate{text-align:center;padding:26px 10px}.celebrate-icon{display:block;font-size:95px;animation:float 1.5s ease-in-out infinite}
 .nav{position:fixed;bottom:0;left:0;right:0;padding:10px 12px calc(env(safe-area-inset-bottom) + 10px);display:flex;justify-content:space-evenly;gap:6px;max-width:940px;margin:auto;background:color-mix(in srgb,var(--surface),transparent 5%);backdrop-filter:blur(18px);border-radius:22px 22px 0 0;z-index:20}.nav button{flex:1;color:var(--muted);background:transparent;padding:8px 1px;border-radius:14px;font-size:11px;min-width:0}.nav button span{display:block;font-size:21px;margin-bottom:4px}.nav button[aria-selected="true"]{color:var(--accent);background:color-mix(in srgb,var(--accent),transparent 89%)}
 .themes{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.theme{border-radius:20px;padding:22px 10px;color:white;font-weight:800;min-height:85px}.theme[aria-pressed="true"]{outline:3px solid var(--accent);outline-offset:3px}.theme[data-value="adventure"]{background:linear-gradient(140deg,#1f214e,#6c437c)}.theme[data-value="playful"]{background:linear-gradient(140deg,#aa79e6,#8ad9cf)}.theme[data-value="minimal"]{background:linear-gradient(140deg,#8bb3a7,#647f7b)}.theme[data-value="youth"]{background:linear-gradient(140deg,#0a172a,#2c558b)}
 .dialog{position:fixed;inset:0;z-index:40;background:#050b23ba;display:grid;place-items:center;padding:16px}.sheet{background:var(--surface);color:var(--ink);padding:24px;border-radius:26px;width:min(100%,520px);max-height:88dvh;overflow:auto}.sheet h2{margin:0 0 14px}.sheet p{line-height:1.65}.sheet .actions{display:flex;flex-wrap:wrap;gap:9px}.message{padding:15px;border-radius:18px;background:color-mix(in srgb,var(--accent),transparent 88%);margin:10px 0}
 .field{display:grid;gap:6px;margin:10px 0}.field input,.field select,.field textarea{width:100%;padding:13px;border:1px solid #8885;border-radius:13px;color:var(--ink);background:var(--surface)}
 .notice{padding:14px;border-radius:15px;background:color-mix(in srgb,var(--accent),transparent 85%);margin:12px 0}
 @media(min-width:700px){.two{display:grid;grid-template-columns:1fr 1fr;gap:18px}.stage{min-height:405px}}@media(max-width:370px){.shell{padding-left:10px;padding-right:10px}.stage{min-height:280px}.hero-art{font-size:77px}.nav button{font-size:10px}}
 @media(prefers-reduced-motion:reduce){*,*:before,*:after{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
 </style></head><body data-theme="minimal"><main class="shell">
 <header class="top"><div><div class="eyebrow">HABIT HERO · V2</div><h1 id="greeting">Η περιπέτειά σου</h1></div><div class="controls"><button id="bell" class="iconbtn" aria-label="Μηνύματα">🔔<span id="bellCount" class="count" hidden></span></button><button id="switchUser" class="iconbtn" aria-label="Αλλαγή χρήστη">⇄</button></div></header>
 <section id="homeTab"><div class="stage"><div id="worldCaption" class="world-caption">✦ YOUR WORLD</div><img id="heroArt" class="hero-art" src="/habit-hero/app/v2-hero-boy.svg" alt="Ο ήρωάς μου"><div style="position:relative;max-width:66%"><div class="eyebrow">TODAY'S ADVENTURE</div><h2 id="heroHeading">Κάθε μικρή νίκη μετράει.</h2><p id="heroSubtitle">Ο κόσμος σου μεγαλώνει μαζί σου.</p></div><div class="progress"><div id="progressFill" class="fill"></div></div><div id="progressLabel" style="margin-top:10px;font-weight:700">—</div></div><div class="heading"><h2>Οι αποστολές μου</h2><span id="missionTotal" class="muted"></span></div><div id="missionList"></div><div id="parentQuickActions" hidden class="panel"><h2>Δημιούργησε κάτι σπουδαίο</h2><button id="newHabit" class="primary">＋ Νέα αποστολή</button></div><div class="egg"><span class="egg-icon" id="eggArt">🥚</span><div><h3 id="eggTitle">Το μυστηριώδες αυγό</h3><p id="eggProgress">Ο σύντροφός σου μεγαλώνει με την προσπάθειά σου.</p></div></div></section>
 <section id="messagesTab" hidden><h2>🔔 Μηνύματα</h2><div id="messagesList"></div></section>
 <section id="rewardsTab" hidden><h2>🎁 Θησαυροφυλάκιο</h2><p id="balanceTitle" class="notice">⭐ 0 διαθέσιμοι πόντοι</p><div id="rewardsList" class="reward-grid"></div></section>
 <section id="profileTab" hidden><div class="panel"><h2>🦸 Διάλεξε ήρωα</h2><p class="muted">Όλοι μπορούν να επιλέξουν τον ήρωα που τους εκφράζει.</p><div id="heroChoices" class="hero-select"></div></div><div class="panel"><h2>🎨 Διάλεξε τον κόσμο σου</h2><div id="themeChoices" class="themes"></div></div><div id="profileInfo" class="panel"></div></section>
 <nav class="nav" id="tabs" aria-label="Πλοήγηση"></nav><p id="error" role="status" class="muted"></p></main><div id="modal" class="dialog" hidden><div class="sheet"><button id="closeModal" class="secondary" style="float:right">✕</button><div id="modalBody"></div></div></div>
 <script>
 const ROLE=${JSON.stringify(role)},$=id=>document.getElementById(id);
 const tabs=ROLE==='child'?[['home','🏠','Αρχική'],['rewards','🎁','Έπαθλα'],['profile','🦸','Ο ήρωας'],['messages','🔔','Μηνύματα']]:[['home','🏠','Αρχική'],['rewards','🎁','Έπαθλα'],['profile','⚙️','Εμφάνιση'],['messages','🔔','Μηνύματα']];
 let actor=null,activities=[],messages=[],rewards=[],balance=0,progressData=null;
 const esc=s=>String(s??'');
 const themeList=[['playful','🌈 Playful'],['adventure','⚔️ Hero Adventure'],['minimal','✦ Minimal'],['youth','⚡ Pro Youth']];
 const themeKey=()=> 'hh2-theme-'+ROLE+'-'+(actor?.id||'default');
 function theme(v){if(!themeList.some(x=>x[0]===v))v='minimal';document.body.dataset.theme=v;
  $('worldCaption').textContent=({playful:'🌈 DREAM GARDEN',adventure:'⚔️ SKY KINGDOM',minimal:'✦ CALM STUDIO',youth:'⚡ NEON ACADEMY'})[v];
  for(const b of document.querySelectorAll('.theme'))b.setAttribute('aria-pressed',String(b.dataset.value===v));
  try{localStorage.setItem(themeKey(),v)}catch{}}
 const heroTypes=[['boy','🦸 Ήρωας'],['girl','🦸‍♀️ Ηρωίδα']];
 const heroKey=()=> 'hh2-hero-'+(actor?.id||'default');
 function pickHero(choice){
  if(!heroTypes.some(x=>x[0]===choice))choice='boy';
  $('heroArt').src='/habit-hero/app/v2-hero-'+choice+'.svg';
  for(const b of $('heroChoices').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.hero===choice));
  try{localStorage.setItem(heroKey(),choice)}catch{}
 }
 for(const [kind,label] of heroTypes){
  const button=document.createElement('button');button.type='button';button.className='hero-choice';button.dataset.hero=kind;
  const picture=document.createElement('img');picture.src='/habit-hero/app/v2-hero-'+kind+'.svg';picture.alt='';
  const name=document.createElement('strong');name.textContent=label;button.append(picture,name);
  button.onclick=()=>pickHero(kind);$('heroChoices').append(button);
 }
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
 function detail(m){
  const wrap=node('div');
  const scene=node('div',undefined,'mission-scene');
  const art=node('img');art.src=$('heroArt').src;art.alt='';
  scene.append(art,node('span',m.emoji||'⭐','mission-symbol'));wrap.append(scene);
  const kicker=node('div','✨ ΑΠΟΣΤΟΛΗ '+(m.slot_index||1)+' / '+(m.slot_total||1),'eyebrow');wrap.append(kicker);
  const info=node('p',m.description_el||'Αποστολή: '+m.habit_name);
  const why=node('div',m.why_important_el?'💡 Γιατί αξίζει: '+m.why_important_el:'💜 Κάθε προσπάθεια χτίζει τη δύναμή σου.','notice');
  wrap.append(info,why,node('p','🌟 '+m.points+' πόντοι μετά την έγκριση γονέα','sticker'));
  const actions=node('div',undefined,'actions');
  const help=node('button','🙋 Χρειάζομαι βοήθεια','secondary');help.onclick=async()=>{help.disabled=true;try{
   const r=await fetch('/api/child/help',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({habit_id:m.habit_id})});
   if(!r.ok&&r.status!==409)throw Error();help.textContent='💌 Στάλθηκε στον γονέα';
  }catch{help.disabled=false;help.textContent='Δοκίμασε ξανά'}};
  const done=node('button',m.submission_status?'✓ '+m.submission_status:'✓ Το κατάφερα!','primary');
  done.disabled=!!m.submission_status;done.onclick=async()=>{done.disabled=true;try{
   const r=await fetch('/api/child/activities',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({habit_id:m.habit_id,slot_index:m.slot_index||1})});
   if(!r.ok)throw Error((await r.json()).detail||'Αποτυχία');
   $('modal').hidden=true;await loadChild();
   const finish=node('div',undefined,'celebrate');finish.append(node('span','🌟','celebrate-icon'),node('h3','Η προσπάθειά σου μετράει!'),node('p','Η αποστολή στάλθηκε στον γονέα για έγκριση. Πάμε για την επόμενη!'));
   const close=node('button','Συνέχεια στην περιπέτεια','primary');close.onclick=()=>{$('modal').hidden=true};finish.append(close);
   showModal('Αποστολή ολοκληρώθηκε!',finish);
  }catch(e){done.disabled=false;wrap.append(node('p',e.message))}};
  actions.append(help,done);wrap.append(actions);showModal(m.habit_name,wrap)
 }
 function renderMessages(){
  const list=$('messagesList');list.replaceChildren();
  if(!messages.length){list.append(node('div','💌 Δεν έχεις νέα μηνύματα. Όταν οι γονείς σου απαντήσουν, θα τα δεις εδώ.','panel'));return}
  for(const m of messages){const card=node('article',undefined,'message');card.append(node('span',m.kind==='approval'?'🏆':m.kind==='reward'?'🎁':'💌','message-icon'));
   const content=node('div');content.append(node('strong',m.kind==='approval'?'Αποστολή εγκρίθηκε':m.kind==='reward'?'Νέο για το έπαθλό σου':m.status==='try_again'?'💪 Μπορείς να το κάνεις!':'💜 Μήνυμα από γονέα'),node('p',m.text));card.append(content);list.append(card)}
 }
 async function loadChild(){
  const me=await fetch('/api/child/me',{credentials:'same-origin',cache:'no-store'});if(!me.ok){$('error').textContent='Χρειάζεται σύνδεση παιδιού από την οικογενειακή αρχική.';return}
  actor=await me.json();$('greeting').textContent='Γεια σου, '+actor.name+'!';try{pickHero(localStorage.getItem(heroKey())||'boy')}catch{pickHero('boy')}
  try{theme(localStorage.getItem(themeKey())||'playful')}catch{theme('playful')}
  const [a,h,r]=await Promise.all([fetch('/api/child/activities',{credentials:'same-origin'}),fetch('/api/child/help',{credentials:'same-origin'}),fetch('/api/child/rewards',{credentials:'same-origin'})]);
  if(a.ok)activities=(await a.json()).activities||[];
  if(h.ok)messages=((await h.json()).requests||[]).filter(x=>x.parent_message).map(x=>({id:x.id,status:x.status,text:x.parent_message,kind:'help',created:x.created_at}));
  if(r.ok){const v=await r.json();rewards=v.rewards||[];balance=v.balance||0;
   for(const event of v.redemption_history||[]){if(event.status==='approved'||event.status==='fulfilled')messages.push({id:'reward-'+event.id,status:event.status,kind:'reward',text:'Το έπαθλο «'+event.reward_name+'» '+(event.status==='fulfilled'?'παραδόθηκε!':'εγκρίθηκε!'),created:event.resolved_at||event.requested_at})}}
  try{const rp=await fetch('/api/child/progress',{credentials:'same-origin',cache:'no-store'});if(rp.ok){progressData=(await rp.json()).progress;
   for(const event of progressData?.recent_activity||[]){if(event.status==='approved')messages.push({id:'approved-'+event.id,kind:'approval',text:'Μπράβο! Η αποστολή «'+(event.habit_name||'')+'» εγκρίθηκε! ⭐',created:event.reviewed_at||event.submitted_at})}}
  }catch{}
  messages.sort((a,b)=>String(b.created||'').localeCompare(String(a.created||'')));
  renderMissions();renderMessages();updateBell();$('balanceTitle').textContent='⭐ '+balance+' διαθέσιμοι πόντοι';$('rewardsList').replaceChildren();
  for(const reward of rewards){
   const card=node('div',undefined,'reward-item');card.append(node('span',reward.emoji||'🎁','big'),node('strong',reward.name),node('p','⭐ '+reward.points_cost+' πόντοι'));
   const redeem=node('button',balance>=reward.points_cost?'Ξεκλείδωμα':'🔒 '+Math.max(0,reward.points_cost-balance)+' ακόμα','primary');redeem.disabled=balance<reward.points_cost;
   redeem.onclick=async()=>{redeem.disabled=true;try{const response=await fetch('/api/child/rewards/request',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({reward_id:reward.id})});
    if(!response.ok)throw Error('Δεν ήταν δυνατό να ζητήσεις το έπαθλο.');
    showModal('🎁 Αίτημα επάθλου',node('p','Ο γονέας θα εξετάσει το αίτημά σου!'));await loadChild();
   }catch(e){redeem.disabled=false;showModal('Δοκίμασε ξανά',node('p',e.message))}};card.append(redeem);$('rewardsList').append(card)}
  if(!rewards.length)$('rewardsList').append(node('p','Οι θησαυροί σου θα εμφανιστούν εδώ!'));
  $('profileInfo').replaceChildren(node('h2','Ο δικός σου κόσμος'),node('p','Μικρά βήματα, μεγάλη περιπέτεια.'));
  try{const progress=progressData;
   if(progress){const streak=Number(progress.current_streak_days)||0;
     $('eggArt').textContent=streak>=30?'🐲':streak>=21?'🐣':streak>=10?'🥚✨':'🥚';
     $('eggProgress').textContent=streak+' / 30 ημέρες συνέπειας για να εκκολαφθεί!';
     $('profileInfo').append(node('div','🏅 Επίπεδο '+progress.level+'  ·  🔥 '+streak+' ημέρες σερί','notice'));
    }
  }catch{}
 }
 async function api(path,method='GET',payload){
  const response=await fetch(path,{method,credentials:'same-origin',cache:'no-store',
   ...(payload?{headers:{'content-type':'application/json'},body:JSON.stringify(payload)}:{})});
  if(!response.ok){const result=await response.json().catch(()=>({}));throw Error(result.detail||'Προσωρινό πρόβλημα')}
  return response.json();
 }
 let familyChildren=[];
 function field(label,type='text',value=''){
  const wrap=node('label',undefined,'field');wrap.append(node('span',label));
  const input=node(type==='textarea'?'textarea':type==='select'?'select':'input');
  if(type!=='textarea'&&type!=='select')input.type=type;
  if(type!=='select')input.value=value;
  wrap.append(input);return {wrap,input};
 }
 function openHabitBuilder(){
  const form=node('form');
  const title=field('Όνομα αποστολής'),child=field('Ανάθεση σε παιδί','select');
  const frequency=field('Πότε;','select'),count=field('Πόσες φορές ανά περίοδο;','number','1'),delay=field('Διάλειμμα σε λεπτά','number','30');
  const points=field('Πόντοι','number','10'),steps=field('Τι πρέπει να κάνει το παιδί;','textarea'),benefits=field('Γιατί είναι σημαντικό;','textarea');
  title.input.required=true;title.input.maxLength=100;count.input.min=1;count.input.max=5;delay.input.min=0;delay.input.max=1440;points.input.min=1;points.input.max=1000;
  for(const person of familyChildren){const option=node('option',person.name);option.value=person.id;child.input.append(option)}
  for(const [id,label] of [['daily','Κάθε μέρα'],['weekly','Κάθε εβδομάδα'],['monthly','Κάθε μήνα'],['once','Μία φορά']]){const option=node('option',label);option.value=id;frequency.input.append(option)}
  for(const x of [title,child,frequency,count,delay,points,steps,benefits])form.append(x.wrap);
  const submit=node('button','Δημιουργία αποστολής','primary');submit.type='submit';form.append(submit);
  form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;try{
   await api('/api/habits','POST',{name:title.input.value,child_id:child.input.value,frequency:frequency.input.value,
    frequency_count:Number(count.input.value),retry_delay_minutes:Number(delay.input.value),points:Number(points.input.value),
    description:steps.input.value,benefit:benefits.input.value});
   $('modal').hidden=true;await loadParent();showModal('✨ Νέα αποστολή!',node('p','Η αποστολή δημιουργήθηκε με επιτυχία.'));
  }catch(error){form.append(node('p',error.message));submit.disabled=false}};
  showModal('✍️ Δημιουργία δικής σου αποστολής',form);
 }
 async function loadParent(){
  const r=await fetch('/api/family/overview',{credentials:'same-origin'});
  if(!r.ok){$('error').textContent='Ξεκλείδωσε πρώτα το προφίλ γονέα.';return}
  const data=await r.json();actor={id:data.parent.id,name:data.parent.name};
  $('greeting').textContent='Γεια σου, '+actor.name+'!';$('heroArt').src='/habit-hero/app/v2-hero-girl.svg';
  try{theme(localStorage.getItem(themeKey())||'minimal')}catch{theme('minimal')}
  $('heroHeading').textContent='Μαζί χτίζουμε καλές συνήθειες.';
  $('heroSubtitle').textContent=(data.children||[]).length+' μικροί ήρωες στην οικογένεια.';
  familyChildren=(data.children||[]).map(c=>({id:c.id,name:c.name||c.display_name}));
  $('parentQuickActions').hidden=false;$('newHabit').onclick=openHabitBuilder;
  $('missionList').replaceChildren();
  for(const child of familyChildren){const card=node('div',undefined,'mission');card.append(node('span','🦸','emoji'),node('strong',child.name));$('missionList').append(card)}
  $('profileInfo').replaceChildren(node('h2','Ο προσωπικός σου χώρος'),node('p','Άλλαξε εμφάνιση ανεξάρτητα από τα παιδιά.'));
  const release=node('button','🔄 Έλεγχος τελευταίας έκδοσης','secondary');
  const versionResult=node('p','','muted');release.onclick=async()=>{
   release.disabled=true;versionResult.textContent='Ελέγχουμε το GitHub και το Cloudflare…';
   try{const v=await api('/api/version');versionResult.textContent='Έκδοση: '+String(v.current).slice(0,8)+' · '+(v.check_available?(v.update_available?'Νεότερη έκδοση στο GitHub':'Η τελευταία έκδοση!'):'Δεν ήταν δυνατός ο έλεγχος');}
   catch(error){versionResult.textContent=error.message}finally{release.disabled=false}
  };
  $('profileInfo').append(release,versionResult);
  $('rewardsList').classList.remove('reward-grid');$('rewardsList').replaceChildren();
  const approvalTitle=node('h2','✅ Εγκρίσεις');$('rewardsList').append(approvalTitle);
  try{
   const approvals=(await api('/api/approvals')).pending||[];
   if(!approvals.length)$('rewardsList').append(node('div','Όλες οι προσπάθειες έχουν εξεταστεί. 🌟','notice'));
   for(const item of approvals){
    const row=node('div',undefined,'panel');row.append(node('strong',item.child_name+' · '+item.habit_name),node('p','⭐ '+item.points+' πόντοι'));
    const actions=node('div',undefined,'actions');
    for(const [decision,label] of [['approved','✓ Έγκριση'],['rejected','Δοκίμασε ξανά']]){
     const button=node('button',label,decision==='approved'?'primary':'secondary');
     button.onclick=async()=>{button.disabled=true;try{await api('/api/approvals/review','POST',{completion_id:item.id,decision});await loadParent()}catch(error){row.append(node('p',error.message));button.disabled=false}};
     actions.append(button);
    }row.append(actions);$('rewardsList').append(row)}
  }catch(error){$('rewardsList').append(node('p',error.message))}
  $('messagesList').replaceChildren(node('h2','🙋 Αιτήματα βοήθειας'));
  try{
   const requests=(await api('/api/parent/help')).requests||[];
   if(!requests.length)$('messagesList').append(node('div','Κανένα νέο αίτημα. 💜','panel'));
   for(const item of requests){
    const row=node('div',undefined,'panel');row.append(node('strong',item.child_name+' · '+item.habit_name));
    for(const [status,label] of [['helping','💜 Θα σε βοηθήσω'],['try_again','💪 Δοκίμασε ξανά']]){
     const b=node('button',label,status==='helping'?'primary':'secondary');
     b.onclick=async()=>{b.disabled=true;try{await api('/api/parent/help/reply','POST',{request_id:item.id,status});await loadParent()}catch(e){row.append(node('p',e.message));b.disabled=false}};row.append(b)
    }$('messagesList').append(row)}
  }catch(error){$('messagesList').append(node('p',error.message))}
  $('balanceTitle').textContent='Προσπάθειες προς έγκριση';
 }
 (ROLE==='child'?loadChild():loadParent()).catch(e=>{$('error').textContent='Προσωρινό πρόβλημα: '+e.message});
 </script></body></html>`;
 return new Response(html,{headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store, private','content-security-policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'"}});
}
