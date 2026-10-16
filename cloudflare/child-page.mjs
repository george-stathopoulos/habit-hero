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
 nav.quick-nav{display:none!important;position:sticky;top:0;z-index:20;display:flex;gap:8px;overflow-x:auto;
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
 [data-tab][data-active="true"]:not([hidden]){animation:tabBloom .35s cubic-bezier(.2,.75,.2,1) both}
 @keyframes tabBloom{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
 @media(prefers-reduced-motion:reduce){[data-tab][data-active="true"]{animation:none!important}}
 [data-tab]:not([data-active="true"]){display:none!important}
 nav.quick-nav{display:none}
 .hero-particles{position:absolute;inset:0;pointer-events:none;overflow:hidden}
 .hero-particles span{position:absolute;top:50%;left:50%;font-size:26px;animation:heroBurst 1.45s ease-out forwards;animation-delay:var(--delay)}
 .hero-particles .hero-smoke{filter:grayscale(1);opacity:.6;font-size:35px}
 @keyframes heroBurst{0%{opacity:0;transform:translate(-50%,-50%) rotate(var(--angle)) translateY(0) scale(.25)}
  25%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) rotate(var(--angle)) translateY(-230px) scale(1.7)}}
 @media(prefers-reduced-motion:reduce){.hero-particles{display:none}}
 .mission-toast{position:fixed;inset:0;z-index:100;display:grid;place-items:center;background:#21195db8;padding:20px;animation:fadeHero .25s ease}
 .mission-toast-content{border-radius:30px;background:#fff;padding:32px 25px;max-width:420px;text-align:center;box-shadow:0 30px 100px #1d164966}
 .mission-toast-emoji{font-size:74px;display:block;animation:heroPop .45s ease}
 .mission-toast h2{color:#5144bc;margin:14px 0}.mission-toast p{color:#596477}
 @keyframes heroPop{from{transform:scale(.4) rotate(-15deg);opacity:0}to{transform:scale(1);opacity:1}}
 @keyframes fadeHero{from{opacity:0}to{opacity:1}}
 @media(prefers-reduced-motion:reduce){.mission-toast,.mission-toast-emoji{animation:none}}
 body[data-world="forest"]{background:linear-gradient(155deg,#d6f9df,#f6fff5 62%,#e5f5ff);--purple:#249464;--violet:#155f45}
 body[data-world="space"]{background:linear-gradient(150deg,#dcd7ff,#eaf0ff 60%,#ede9ff);--purple:#5644c5;--violet:#2c235d}
 body[data-world="ocean"]{background:linear-gradient(145deg,#c8f8ff,#e1f8ff 65%,#e9efff);--purple:#0782a4;--violet:#105b78}
 body[data-world="sunset"]{background:linear-gradient(155deg,#ffe9ca,#fff5ef 65%,#ffdcf5);--purple:#c95f8e;--violet:#8c426b}
 .theme-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
 .theme-choices button{min-width:0;min-height:85px;white-space:normal;border:3px solid transparent;background:var(--purple,#6658e8);color:white;font-weight:800;border-radius:20px}
 .theme-choices button[aria-pressed="true"]{border-color:#f5c651;box-shadow:0 0 0 3px #7161aa44}
 .egg-stage{font-size:76px;display:grid;place-items:center;min-height:140px;border-radius:25px;background:#ffffffb8;animation:questFloat 3.5s ease-in-out infinite}
 @media(prefers-reduced-motion:reduce){.egg-stage{animation:none}}
 body[data-world="noir"]{background:#151925;color:#e9edf9;--purple:#303848;--violet:#1c2637}body[data-world="noir"] section:not(#questOverview){background:#252d3e;color:#f2f4ff}
 body[data-world="paper"]{background:#faf9f5;color:#293442;--purple:#475569;--violet:#26354a}body[data-world="paper"] section{box-shadow:0 2px 12px #17283a12}
 body[data-world="neon"]{background:linear-gradient(140deg,#120b36,#25134d);color:#f4efff;--purple:#ae37dc;--violet:#43219a}body[data-world="neon"] section:not(#questOverview){background:#28204d;color:#fff}
 #notificationBell{position:relative;background:#ffffff25;font-size:25px;min-width:46px;min-height:46px}#unreadCount{position:absolute;right:-4px;top:-5px;background:#f14a7e;color:white;border-radius:999px;font-size:11px;padding:2px 6px}
 #notificationBell.ringing{animation:bellWiggle 1.5s ease-in-out infinite}@keyframes bellWiggle{0%,70%,100%{transform:rotate(0)}78%{transform:rotate(-13deg)}87%{transform:rotate(11deg)}94%{transform:rotate(-6deg)}}@media(prefers-reduced-motion:reduce){#notificationBell.ringing{animation:none}}
 #switchFamily{font-size:25px;min-width:46px;min-height:46px}
 .reward-tile{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;
  border:2px solid #f3deff!important;border-radius:25px;background:linear-gradient(135deg,#fff4fc,#f2f0ff)!important;
  padding:24px 16px!important;margin-bottom:15px;box-shadow:0 10px 23px #603c8915}
 .reward-gift{font-size:62px;display:block;animation:giftWiggle 4s ease-in-out infinite}
 .reward-tile strong{font-size:22px}.reward-cost{font-size:14px;font-weight:800;background:#fff;border-radius:99px;padding:9px 15px;color:#6251b3}
 .reward-tile button{width:90%;border-radius:15px}
 @keyframes giftWiggle{0%,83%,100%{transform:rotate(0) scale(1)}88%{transform:rotate(-9deg) scale(1.07)}93%{transform:rotate(9deg) scale(1.07)}}
 @media(prefers-reduced-motion:reduce){.reward-gift{animation:none}}
 .quest-card{perspective:1000px;position:relative;min-width:0;border:0!important;background:transparent!important;padding:0!important;margin:14px 0;list-style:none}
 .quest-card-inner{display:grid;grid-template-columns:minmax(0,1fr);width:100%;min-width:0;transform-style:preserve-3d;transition:transform .7s cubic-bezier(.2,.8,.2,1)}
 .quest-card.flipped .quest-card-inner{transform:rotateY(180deg)}
 .quest-card-face{grid-area:1/1;position:relative;min-width:0;min-height:290px;backface-visibility:hidden;-webkit-backface-visibility:hidden;border-radius:25px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:26px 18px;text-align:center;overflow-wrap:anywhere}
 .quest-card-face button{position:relative;max-width:100%;white-space:normal;flex-shrink:0}
 .quest-card-face p{margin:8px 0;max-width:38ch;line-height:1.5}
 .quest-card-face strong{display:block;max-width:100%;line-height:1.25}
 .quest-card:focus-within{outline-offset:3px}
 .quest-card:not(.flipped) .quest-back{visibility:hidden;pointer-events:none}
 .quest-card.flipped .quest-front{visibility:hidden;pointer-events:none}
 .quest-front{background:linear-gradient(145deg,#fff,#eceaff);border:2px solid #e2dcff;box-shadow:0 14px 25px #29236a17}
 .quest-back{background:linear-gradient(145deg,#5448bf,#8c69ed);color:white;transform:rotateY(180deg)}
 .quest-card-title{font-size:clamp(18px,5vw,23px)}.quest-card-emoji{font-size:57px;filter:drop-shadow(0 9px 9px #2c1c6029);animation:questFloat 3s ease-in-out infinite}
 .quest-card-points{background:#ffeac1;color:#8a540d;font-weight:800;padding:7px 15px;border-radius:22px}
 .quest-flip{background:#6955db;min-height:42px}.quest-back .secondary{background:#ffffff30;color:white}
 .quest-done{background:linear-gradient(140deg,#e8fff3,#d7f8e7)}
 @keyframes questFloat{50%{transform:translateY(-8px) rotate(5deg)}}
 @media(prefers-reduced-motion:reduce){.quest-card-inner{transition:none}.quest-card-emoji{animation:none}}
 #questOverview{background:linear-gradient(135deg,#5144bc,#8b6ef4);color:white;border:0}
 .quest-head{display:flex;align-items:center;gap:14px}.quest-emoji{font-size:46px}
 .quest-kicker{font-size:11px;letter-spacing:1.1px;font-weight:850;opacity:.78;margin:0}
 #questGreeting{margin:6px 0;color:white}
 .quest-meter{height:16px;border-radius:30px;background:#ffffff40;overflow:hidden;margin:22px 0 11px}
 #questMeterFill{height:100%;background:#ffc870;border-radius:30px;width:0;transition:width .5s ease}
 .quest-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13px}
 .quest-footer strong{font-size:20px}
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
 <button id="lockProfile" class="secondary" hidden>🔒 Κλείδωμα</button> <button id="switchFamily" class="secondary" hidden aria-label="Αλλαγή χρήστη" title="Αλλαγή χρήστη">⇄</button> <button id="logout" class="secondary" hidden>Αποσύνδεση παιδιού</button> <button id="notificationBell" type="button" aria-label="Μηνύματα" title="Μηνύματα" hidden>🔔<span id="unreadCount" hidden></span></button></section>
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
 <section id="questOverview" data-tab="quests" hidden>
 <div class="quest-head"><span class="quest-emoji">🚀</span><div><p class="quest-kicker">Η ΣΗΜΕΡΙΝΗ ΣΟΥ ΠΕΡΙΠΕΤΕΙΑ</p><h2 id="questGreeting">Έτοιμος για αποστολές;</h2></div></div>
 <div class="quest-meter"><div id="questMeterFill"></div></div>
 <div class="quest-footer"><strong id="questCount">0 από 0</strong><span id="questMotivation">Κάθε προσπάθεια μετράει! ⭐</span></div>
 </section>
 <section id="allDonePanel" data-tab="quests" hidden style="background:linear-gradient(135deg,#fef5da,#e8e0ff);text-align:center;border:2px solid #f8d98d">
 <div style="font-size:68px;animation:questFloat 3s ease-in-out infinite" aria-hidden="true">🏆🌈</div>
 <h2>Όλες οι αποστολές ολοκληρώθηκαν!</h2>
 <p>Έκανες υπέροχη προσπάθεια σήμερα! Ώρα για παιχνίδι, ξεκούραση και νέες περιπέτειες. 💜</p>
 <p class="muted">Οι πόντοι από τις προσπάθειές σου προστίθενται όταν τις εγκρίνει ο γονέας σου.</p>
 </section>
 <section id="activitiesPanel" data-tab="quests" hidden><h2>🌟 Οι δραστηριότητές μου</h2>
 <p class="muted">Πάτησε «Το έκανα!» όταν ολοκληρώσεις μια δραστηριότητα. Οι πόντοι προστίθενται μετά από έγκριση γονέα.</p>
 <ul id="activities"></ul><p id="feedback" role="status"></p></section>
 <section id="parentMessages" data-tab="messages" hidden><h2>💌 Μηνύματα από τους γονείς</h2><ul id="helpReplies"></ul></section>
 <section id="heroThemes" data-tab="hero" hidden><h2>🎨 Ο κόσμος του ήρωά μου</h2><p class="muted">Διάλεξε τον κόσμο που σου αρέσει!</p>
 <div id="themeChoices" class="theme-choices"></div>
 <h3>🥚 Το μαγικό μου αυγό</h3><div id="companionEgg" class="egg-stage" aria-live="polite">🥚</div>
 <p id="eggMessage" class="muted">Μείνε συνεπής στις αποστολές σου για να μεγαλώσει!</p>
 </section>
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
 <button type="button" data-child-tab="messages" role="tab" aria-selected="false"><span>🔔</span><span>Μηνύματα</span></button>
 </nav>
 </main><script>
 const childTitles={quests:'Οι αποστολές μου 🎯',rewards:'Τα έπαθλά μου 🎁',hero:'Ο ήρωάς μου 🦸',messages:'Τα μηνύματά μου 🔔'};
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
 const inAppMode=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 if(!inAppMode&&/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){
  const banner=document.createElement('aside');banner.style.cssText='background:#fff3d8;color:#372e50;border-radius:18px;padding:15px;margin:12px 0';
  const instruction=document.createElement('p');
  instruction.textContent='📲 Για εμπειρία χωρίς μπάρες browser, άνοιξε το Habit Hero από το εγκατεστημένο εικονίδιο στην αρχική οθόνη. '+(/iPhone|iPad/i.test(navigator.userAgent)?'Safari → Κοινοποίηση → Προσθήκη στην Αρχική Οθόνη.':'Chrome → ⋮ → Εγκατάσταση εφαρμογής.');
  const close=document.createElement('button');close.textContent='Εντάξει';close.type='button';close.addEventListener('click',()=>banner.remove());
  banner.append(instruction,close);document.querySelector('main').prepend(banner);
 }
 function celebrateMission(){
  const overlay=document.createElement('div');overlay.className='mission-toast';overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Αποστολή ολοκληρώθηκε');
  const card=document.createElement('div');card.className='mission-toast-content';
  const star=document.createElement('span');star.className='mission-toast-emoji';star.textContent='🌟';
  const title=document.createElement('h2');title.textContent='Υπέροχη προσπάθεια!';
  const description=document.createElement('p');description.textContent='Η αποστολή σου στάλθηκε για έγκριση. Οι πόντοι σου περιμένουν! 🚀';
  const close=document.createElement('button');close.textContent='Συνέχισε την περιπέτεια!';close.type='button';
  close.addEventListener('click',()=>overlay.remove());card.append(star,title,description,close);
  const particles=document.createElement('div');particles.className='hero-particles';particles.setAttribute('aria-hidden','true');
  for(let i=0;i<15;i++){
   const puff=document.createElement('span');puff.className=i%3===0?'hero-smoke':'hero-spark';
   puff.style.setProperty('--angle',String(i*24)+'deg');puff.style.setProperty('--delay',String((i%5)*50)+'ms');
   puff.textContent=i%3===0?'☁️':i%2===0?'✨':'⭐';particles.append(puff);
  }
  overlay.append(particles,card);document.body.append(overlay);close.focus();
 }
 const worlds=[['space','🌌','Διάστημα'],['forest','🌳','Μαγικό δάσος'],['ocean','🐬','Βυθός'],['sunset','🌅','Ηλιοβασίλεμα'],['noir','◼','Studio Noir'],['paper','✦','Minimal'],['neon','⚡','Neon Arcade']];
 const themeChoices=document.getElementById('themeChoices');
 let activeWorld='space';
 try{activeWorld=localStorage.getItem('habitHero:world:'+ (sessionStorage.getItem('habitHero:activeChild')||'default'))||'space'}catch{}
 function chooseWorld(id){
  activeWorld=worlds.some(x=>x[0]===id)?id:'space';document.body.dataset.world=activeWorld;
  for(const button of themeChoices.querySelectorAll('button'))button.setAttribute('aria-pressed',String(button.dataset.world===activeWorld));
  try{localStorage.setItem('habitHero:world:'+ (sessionStorage.getItem('habitHero:activeChild')||'default'),activeWorld)}catch{}
 }
 for(const [id,emoji,title] of worlds){
  const button=document.createElement('button');button.type='button';button.dataset.world=id;button.textContent=emoji+' '+title;
  button.addEventListener('click',()=>chooseWorld(id));themeChoices.append(button);
 }
 chooseWorld(activeWorld);
 document.getElementById('notificationBell').addEventListener('click',()=>openChildTab('messages'));
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
   document.getElementById('questOverview').hidden=true;
   document.getElementById('heroThemes').hidden=true;
   document.getElementById('allDonePanel').hidden=true;
   document.getElementById('rewardsPanel').hidden=true;
   document.getElementById('progressPanel').hidden=true;
   document.getElementById('rewards').replaceChildren();
   document.getElementById('redemptionHistory').replaceChildren();
   document.getElementById('progressStats').textContent='';
   document.getElementById('activityHistory').replaceChildren();
   document.getElementById('heroBadges').replaceChildren();
   document.getElementById('logout').hidden=!needsPin;
   document.getElementById('switchFamily').hidden=true;
   document.getElementById('lockProfile').hidden=true;
   status.textContent=needsPin?'Εισαγωγή προσωπικού PIN.':'Χρειάζεται σύνδεση με κωδικό γονέα.';
   return;
  }
  const profile=await me.json();
  try{const previous=sessionStorage.getItem('habitHero:activeChild');if(previous!==profile.id){sessionStorage.setItem('habitHero:activeChild',profile.id);chooseWorld(localStorage.getItem('habitHero:world:'+profile.id)||'space')}}catch{}
  const icons={hero:'🦸',unicorn:'🦄',robot:'🤖',dragon:'🐉',astronaut:'🧑‍🚀',cat:'🐱',ninja:'🥷',wizard:'🧙'};
  status.textContent=(icons[profile.avatar_id]||'🦸')+' Γεια σου, '+profile.name+'!';
  document.getElementById('pairPanel').hidden=true;
  document.getElementById('pinPanel').hidden=true;
  document.getElementById('quickNav').hidden=false;
  document.getElementById('childTabs').hidden=false;
  document.getElementById('questOverview').hidden=false;
  document.getElementById('heroThemes').hidden=false;
  document.getElementById('childTabTitle').hidden=false;
  document.getElementById('logout').hidden=true;
  document.getElementById('switchFamily').hidden=false;
  document.getElementById('lockProfile').hidden=true;
  document.getElementById('logout').hidden=true;
  document.getElementById('notificationBell').hidden=false;
  const res=await fetch('/api/child/activities',{credentials:'same-origin',cache:'no-store'});
  if(!res.ok){status.textContent='Οι δραστηριότητες δεν είναι διαθέσιμες αυτή τη στιγμή.';return}
  const data=await res.json();
  const total=data.activities.length;
  const completed=data.activities.filter(item=>['pending','approved'].includes(item.submission_status)).length;
  document.getElementById('allDonePanel').hidden=!(total>0&&completed===total);
  document.getElementById('questGreeting').textContent='Πάμε δυνατά, '+profile.name+'! 🌈';
  document.getElementById('questCount').textContent=completed+' από '+total+' αποστολές';
  document.getElementById('questMeterFill').style.width=(total?Math.round(100*completed/total):0)+'%';
  document.getElementById('questMotivation').textContent=total===0?'Οι νέες αποστολές έρχονται σύντομα!':completed===total?'Μπράβο! Τα κατάφερες! 🏆':completed?'Συνέχισε έτσι! ⭐':'Η περιπέτεια ξεκινά! ✨';
  document.getElementById('activitiesPanel').hidden=false;
  await refreshHelpReplies();
  await refreshRewards();
  await refreshProgress();
  const list=document.getElementById('activities');list.replaceChildren();
  if(!data.activities.length){const li=document.createElement('li');li.textContent='Δεν υπάρχουν ακόμη δραστηριότητες.';list.append(li)}
  for(const item of data.activities){
   const li=document.createElement('li');li.className='quest-card';
   const inner=document.createElement('div');inner.className='quest-card-inner';
   const front=document.createElement('div');front.className='quest-card-face quest-front';
   const back=document.createElement('div');back.className='quest-card-face quest-back';
   const emoji=document.createElement('span');emoji.className='quest-card-emoji';emoji.textContent=item.emoji||'⭐';
   const title=document.createElement('strong');title.className='quest-card-title';title.textContent=item.habit_name;
   const points=document.createElement('span');points.className='quest-card-points';points.textContent='✨ +'+item.points+' πόντοι · '+item.slot_index+'/'+item.slot_total;
   const turn=document.createElement('button');turn.type='button';turn.className='quest-flip';turn.textContent='✨ Δες την αποστολή';
   turn.setAttribute('aria-label','Άνοιξε την αποστολή '+item.habit_name);
   turn.addEventListener('click',()=>{li.classList.add('flipped');li.dataset.open='true'});
   front.append(emoji,title,points,turn);
   const backTitle=document.createElement('strong');backTitle.className='quest-card-title';backTitle.textContent='Η αποστολή σου 🎯';
   const backDesc=document.createElement('p');backDesc.textContent=(item.description_el||'Ολοκλήρωσε: '+item.habit_name)+'. '+(item.why_important_el?'Γιατί αξίζει: '+item.why_important_el+'. ':'')+'Οι πόντοι σου απονέμονται μετά την έγκριση του γονέα.';
   back.append(backTitle,backDesc);
   const backButton=document.createElement('button');backButton.className='secondary';backButton.type='button';backButton.textContent='↩ Πίσω';
   backButton.addEventListener('click',()=>{li.classList.remove('flipped');li.dataset.open='false'});
   inner.append(front,back);li.append(inner);
   back.append(backButton);
   const help=document.createElement('button');help.type='button';help.className='secondary';help.textContent='🙋 Χρειάζομαι βοήθεια';
   help.addEventListener('click',async()=>{
    help.disabled=true;
    try{
     const response=await fetch('/api/child/help',{method:'POST',credentials:'same-origin',headers:{'content-type':'application/json'},body:JSON.stringify({habit_id:item.habit_id,slot_index:item.slot_index})});
     if(!response.ok&&response.status!==409)throw Error('Δεν στάλθηκε το αίτημα.');
     help.textContent='💌 Ο γονέας ενημερώθηκε!';
     document.getElementById('feedback').textContent='Ζήτησες βοήθεια. Ο γονέας σου θα δει το μήνυμά σου! 🌟';
    }catch(error){help.disabled=false;document.getElementById('feedback').textContent=error.message}
   });
   back.append(help);
   if(!item.submission_status){
    const button=document.createElement('button');button.textContent='Το έκανα!';
    button.addEventListener('click',async()=>{
     button.disabled=true;
     try{
      const r=await fetch('/api/child/activities',{method:'POST',credentials:'same-origin',
       headers:{'content-type':'application/json'},body:JSON.stringify({habit_id:item.habit_id})});
      if(!r.ok)throw Error('Δεν αποθηκεύτηκε η δραστηριότητα.')
      celebrateMission();;
      document.getElementById('feedback').textContent='Μπράβο! Περιμένουμε την έγκριση του γονέα.';
      await refresh();
     }catch(e){document.getElementById('feedback').textContent=e.message;button.disabled=false}
    });back.append(button);
   }else{const label=document.createElement('small');
    label.textContent=item.submission_status==='pending'?'⏳ Σε αναμονή':item.submission_status==='approved'?'✅ Εγκρίθηκε':'❌ Απορρίφθηκε';
    back.append(label);front.classList.add('quest-done');
   }
   list.append(li);
  }
 }
 async function refreshHelpReplies(){
  const response=await fetch('/api/child/help',{credentials:'same-origin',cache:'no-store'});
  if(!response.ok)return;
  const result=await response.json(),box=document.getElementById('parentMessages'),list=document.getElementById('helpReplies');
  list.replaceChildren();
  const requests=(result.requests||[]).filter(r=>r.parent_message);
  document.getElementById('unreadCount').hidden=!requests.length;
  document.getElementById('unreadCount').textContent=String(requests.length);
  document.getElementById('notificationBell').classList.toggle('ringing',requests.length>0);
  box.hidden=!requests.length;
  for(const item of requests){
   const li=document.createElement('li');li.textContent='💜 '+item.parent_message;list.append(li);
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
  const streak=Number(progress.current_streak_days)||0;
  document.getElementById('companionEgg').textContent=streak>=30?'🐉':streak>=21?'🐣':streak>=10?'🥚✨':'🥚';
  document.getElementById('eggMessage').textContent=streak>=30?'Το αυγό σου εκκολάφθηκε! 30 ημέρες συνέπειας! 🏆':streak>=21?'Είναι σχεδόν έτοιμο! Συνέχισε για 30 μέρες.':'Χρειάζονται 30 ημέρες συνεχόμενης συνέπειας για να εκκολαφθεί. Τώρα: '+streak+'/30 ημέρες.';
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
    const item=document.createElement('li');item.className='reward-tile';
    const gift=document.createElement('span');gift.className='reward-gift';gift.textContent=reward.emoji||'🎁';
    const label=document.createElement('strong');label.textContent=reward.name;
    const cost=document.createElement('span');cost.className='reward-cost';cost.textContent='⭐ '+reward.points_cost+' πόντοι';
    item.append(gift,label,cost);
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
 document.getElementById('switchFamily').addEventListener('click',async()=>{
  const response=await fetch('/api/household/exit',{method:'POST',credentials:'same-origin'});
  if(!response.ok)await fetch('/api/child/logout',{method:'POST',credentials:'same-origin'});
  location.replace('/habit-hero/welcome/');
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
