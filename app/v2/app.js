// Habit Hero v2 — independent client app; protected APIs remain authoritative.

 const ROLE=document.body.dataset.role,$=id=>document.getElementById(id);
 const tabs=ROLE==='child'?[['home','🏠','Αρχική'],['rewards','🎁','Έπαθλα'],['profile','🦸','Ο ήρωας'],['messages','🔔','Μηνύματα']]:[['home','🏠','Αρχική'],['children','🦸','Παιδιά'],['missions','🎯','Αποστολές'],['rewards','✅','Εγκρίσεις'],['profile','⚙️','Ρυθμίσεις']];
 let actor=null,activities=[],messages=[],rewards=[],balance=0,progressData=null;
 const esc=s=>String(s??'');
 const themeList=[['playful','🌈 Playful'],['adventure','⚔️ Hero Adventure'],['minimal','✦ Minimal'],['youth','⚡ Pro Youth']];
 const themeKey=()=> 'hh2-theme-'+ROLE+'-'+(actor?.id||'default');
 function theme(v){if(!themeList.some(x=>x[0]===v))v='minimal';document.body.dataset.theme=v;
  if(ROLE==='child')try{pickHero(localStorage.getItem(heroKey())||(actor?.avatar_id==='hero-girl'?'girl':'boy'))}catch{}
  $('worldCaption').textContent=({playful:'🌈 DREAM GARDEN',adventure:'⚔️ SKY KINGDOM',minimal:'✦ CALM STUDIO',youth:'⚡ NEON ACADEMY'})[v];
  for(const b of document.querySelectorAll('.theme'))b.setAttribute('aria-pressed',String(b.dataset.value===v));
  try{localStorage.setItem(themeKey(),v)}catch{}}
 const heroTypes=[['boy','🦸 Ήρωας'],['girl','🦸‍♀️ Ηρωίδα']];
 const heroKey=()=> 'hh2-hero-'+(actor?.id||'default');
 function pickHero(choice){
  if(!heroTypes.some(x=>x[0]===choice))choice='boy';
  $('heroArt').src='/habit-hero/app/v2-hero-'+choice+'-'+document.body.dataset.theme+'.svg';
  for(const b of $('heroChoices').querySelectorAll('button')){b.setAttribute('aria-pressed',String(b.dataset.hero===choice));b.querySelector('img').src='/habit-hero/app/v2-hero-'+b.dataset.hero+'-'+document.body.dataset.theme+'.svg'}
  try{localStorage.setItem(heroKey(),choice)}catch{}
 }
 for(const [kind,label] of heroTypes){
  const button=document.createElement('button');button.type='button';button.className='hero-choice';button.dataset.hero=kind;
  const picture=document.createElement('img');picture.src='/habit-hero/app/v2-hero-'+kind+'-'+document.body.dataset.theme+'.svg';picture.alt='';
  const name=document.createElement('strong');name.textContent=label;button.append(picture,name);
  button.onclick=()=>pickHero(kind);$('heroChoices').append(button);
 }
 function node(tag,text,cls){const el=document.createElement(tag);if(text!==undefined)el.textContent=esc(text);if(cls)el.className=cls;return el}
 function openTab(name){for(const id of ['home','children','missions','rewards','profile','messages']){const view=$(id+'Tab');if(view)view.hidden=id!==name}for(const b of $('tabs').children)b.setAttribute('aria-selected',String(b.dataset.tab===name))}
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
  actor=await me.json();$('greeting').textContent='Γεια σου, '+actor.name+'!';try{pickHero(localStorage.getItem(heroKey())|| (actor.avatar_id==='hero-girl'?'girl':'boy'))}catch{pickHero('boy')}
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
     $('eggArt').src='/habit-hero/app/v2-egg-'+(streak>=30?'hatched':streak>=10?'cracking':'dormant')+'.svg';
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
 const parentGoals=[
  ['outdoor','🌳','Παιχνίδι έξω','Παίζω έξω για 20 λεπτά'],
  ['habits','🌟','Καθημερινές συνήθειες','Στρώνω το κρεβάτι μου'],
  ['responsibility','🎒','Υπευθυνότητα','Ετοιμάζω την τσάντα μου'],
  ['autonomy','🦸','Αυτονομία','Ετοιμάζω τα ρούχα μου'],
  ['skills','🧩','Νέες δεξιότητες','Μαθαίνω κάτι καινούριο'],
  ['reading','📚','Διάβασμα','Διαβάζω για 15 λεπτά'],
  ['creativity','🎨','Δημιουργικότητα','Δημιουργώ κάτι με τα χέρια μου'],
  ['sports','⚽','Άθληση','Κινούμαι για 20 λεπτά'],
  ['nature','🦋','Φύση','Παρατηρώ τη φύση'],
  ['kindness','💗','Καλοσύνη','Κάνω μια καλή πράξη'],
  ['teamwork','🤝','Συνεργασία','Βοηθώ στο σπίτι'],
  ['hygiene','🪥','Υγιεινή','Βουρτσίζω τα δόντια μου'],
  ['sleep','🌙','Ύπνος','Ετοιμάζομαι για ύπνο'],
  ['nutrition','🍎','Διατροφή','Τρώω ένα υγιεινό σνακ'],
  ['confidence','💪','Αυτοπεποίθηση','Δοκιμάζω κάτι δύσκολο'],
  ['emotions','🧠','Συναισθήματα','Μιλάω για το πώς νιώθω'],
  ['focus','🎯','Συγκέντρωση','Εξασκούμαι χωρίς περισπασμούς'],
  ['screens','📵','Λιγότερες οθόνες','Παίζω χωρίς οθόνη'],
  ['money','🐷','Χρήματα','Αναγνωρίζω ανάγκες και επιθυμίες'],
  ['community','🌍','Κοινότητα','Κάνω κάτι καλό για τη γειτονιά']
 ];
 const selectedGoals=new Set();
 try{for(const value of JSON.parse(localStorage.getItem('hh2-family-goals')||'[]'))selectedGoals.add(value)}catch{}
 function goalPicker(){
  const list=$('goalList');list.replaceChildren();
  for(const [id,emoji,label] of parentGoals){
   const button=node('button',emoji+' '+label,'secondary');button.type='button';
   button.setAttribute('aria-pressed',String(selectedGoals.has(id)));
   button.onclick=()=>{selectedGoals.has(id)?selectedGoals.delete(id):selectedGoals.add(id);
    try{localStorage.setItem('hh2-family-goals',JSON.stringify([...selectedGoals]))}catch{}
    goalPicker()};
   list.append(button);
  }
  const suggestions=$('goalSuggestions');suggestions.replaceChildren();
  if(selectedGoals.size)suggestions.append(node('h3','✨ Προτάσεις για την οικογένειά σου'));
  for(const [id,emoji,label,habit] of parentGoals.filter(x=>selectedGoals.has(x[0]))){
   const b=node('button',emoji+' '+habit+' →','mission');b.onclick=()=>openHabitBuilder(habit);
   suggestions.append(b)
  }
 }
 function openChildBuilder(){
  const form=node('form');
  const name=field('Όνομα παιδιού'),age=field('Ηλικία','select'),pin=field('Προσωπικό PIN (4 ψηφία)','text'),repeat=field('Επιβεβαίωση PIN','text');
  const hero=field('Εμφάνιση ήρωα','select'),world=field('Αρχικός κόσμος','select');
  name.input.required=true;name.input.maxLength=80;
  pin.input.required=true;pin.input.inputMode='numeric';pin.input.maxLength=4;pin.input.pattern='[0-9]{4}';
  repeat.input.required=true;repeat.input.inputMode='numeric';repeat.input.maxLength=4;repeat.input.pattern='[0-9]{4}';
  for(const [id,label] of [['6-8','6–8 ετών'],['9-11','9–11 ετών'],['12-14','12–14 ετών']]){const option=node('option',label);option.value=id;age.input.append(option)}
  for(const [id,label] of heroTypes){const option=node('option',label);option.value=id;hero.input.append(option)}
  for(const [id,label] of themeList){const option=node('option',label);option.value=id;world.input.append(option)}
  for(const x of [name,age,pin,repeat,hero,world])form.append(x.wrap);
  const preview=node('img');preview.src='/habit-hero/app/v2-hero-boy-'+document.body.dataset.theme+'.svg';preview.alt='Προεπισκόπηση ήρωα';preview.style.cssText='height:160px;width:100%;object-fit:contain';
  hero.input.onchange=()=>{preview.src='/habit-hero/app/v2-hero-'+hero.input.value+'-'+document.body.dataset.theme+'.svg'};form.append(preview);
  const submit=node('button','Δημιουργία προφίλ','primary');submit.type='submit';form.append(submit);
  form.onsubmit=async event=>{
   event.preventDefault();if(pin.input.value!==repeat.input.value){form.append(node('p','Τα PIN δεν ταιριάζουν.'));return}
   submit.disabled=true;
   try{
    const child=await api('/api/children','POST',{name:name.input.value,age_band:age.input.value,pin:pin.input.value});
    await api('/api/children/update','POST',{child_id:child.id,name:name.input.value,age_band:age.input.value,avatar_id:'hero-'+hero.input.value});
    try{localStorage.setItem('hh2-theme-child-'+child.id,world.input.value);
        localStorage.setItem('hh2-hero-'+child.id,hero.input.value)}catch{}
    $('modal').hidden=true;await loadParent();showModal('🌟 Καλώς ήρθες!',node('p','Ο νέος ήρωας απέκτησε το δικό του προφίλ!'));
   }catch(error){submit.disabled=false;form.append(node('p',error.message))}
  };
  showModal('🦸 Δημιουργία μικρού ήρωα',form);
 }
 function openHabitBuilder(suggestedName=''){
  const form=node('form');
  const title=field('Όνομα αποστολής'),child=field('Ανάθεση σε παιδί','select');
  const frequency=field('Πότε;','select'),count=field('Πόσες φορές ανά περίοδο;','number','1'),delay=field('Διάλειμμα σε λεπτά','number','30');
  const points=field('Πόντοι','number','10'),steps=field('Τι πρέπει να κάνει το παιδί;','textarea'),benefits=field('Γιατί είναι σημαντικό;','textarea');
  title.input.required=true;title.input.maxLength=100;title.input.value=suggestedName;count.input.min=1;count.input.max=5;delay.input.min=0;delay.input.max=1440;points.input.min=1;points.input.max=1000;
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
  $('parentQuickActions').hidden=false;$('goalPicker').hidden=false;goalPicker();$('newHabit').onclick=()=>openHabitBuilder();$('newChild').onclick=openChildBuilder;
  $('addChildFromTab').onclick=openChildBuilder;$('addMissionFromTab').onclick=()=>openHabitBuilder();
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
   messages=approvals.map(item=>({id:'approval-'+item.id,kind:'approval',created:item.submitted_at,text:'Για έγκριση: '+item.child_name+' · '+item.habit_name}));
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
   for(const item of requests)messages.push({id:'help-'+item.id,kind:'help',created:item.created_at,text:'Χρειάζεται βοήθεια: '+item.child_name+' · '+item.habit_name});
   messages.sort((a,b)=>String(b.created||'').localeCompare(String(a.created||'')));
   updateBell();
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
 document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible') (ROLE==='child'?loadChild():loadParent()).catch(()=>{});
 });
 setInterval(()=>{if(document.visibilityState==='visible'&&actor)(ROLE==='child'?loadChild():loadParent()).catch(()=>{})},60000);
 (ROLE==='child'?loadChild():loadParent()).catch(e=>{$('error').textContent='Προσωρινό πρόβλημα: '+e.message});
 
