// Relative to the comfortable starting pose; rotate axes with the screen.
export function tiltVector(beta,gamma,baseline,angle=0){
 if(!Number.isFinite(beta)||!Number.isFinite(gamma))return null;
 const radians=angle*Math.PI/180,x=gamma-baseline.gamma,y=beta-baseline.beta;
 const clamp=value=>Math.max(-1,Math.min(1,value/22));
 return {x:clamp(x*Math.cos(radians)+y*Math.sin(radians)),y:clamp(y*Math.cos(radians)-x*Math.sin(radians))};
}
export function enableTilt({button,motion,onMove,notify,isActive}){
 const orientation=globalThis.DeviceOrientationEvent;
 if(!orientation||!isSecureContext||!matchMedia('(any-pointer: coarse)').matches)return;
 const preferenceKey='hh3-device-tilt';
 const saved=()=>{try{return localStorage.getItem(preferenceKey)}catch{return null}};
 const remember=value=>{try{localStorage.setItem(preferenceKey,value)}catch{}};
 let enabled=false,baseline=null,smooth={x:0,y:0},resuming=false,gestureArmed=false;
 const needsPermission=typeof orientation.requestPermission==='function';
 const reset=()=>{baseline=null;smooth={x:0,y:0};};
 const updateButton=()=>{button.hidden=motion.matches;button.setAttribute('aria-pressed',String(enabled));button.textContent=enabled?'Κλίση: ενεργή':'Κίνηση με κλίση';};
 const listener=event=>{
  if(!enabled||motion.matches||!isActive()||document.visibilityState!=='visible')return;
  if(!Number.isFinite(event.beta)||!Number.isFinite(event.gamma))return;
  if(!baseline)baseline={beta:event.beta,gamma:event.gamma};
  const angle=screen.orientation?.angle??globalThis.orientation??0;
  const target=tiltVector(event.beta,event.gamma,baseline,angle);
  smooth.x+=(target.x-smooth.x)*.18;smooth.y+=(target.y-smooth.y)*.18;
  onMove(smooth.x,smooth.y);
 };
 const removeResume=()=>{document.removeEventListener('pointerdown',resumeFromGesture,true);gestureArmed=false;};
 const start=()=>{if(motion.matches)return;enabled=true;reset();removeEventListener('deviceorientation',listener);addEventListener('deviceorientation',listener,{passive:true});removeResume();updateButton();};
 const stop=()=>{enabled=false;removeEventListener('deviceorientation',listener);removeResume();reset();onMove(0,0);updateButton();};
 async function request(interactive=false){
  if(resuming||motion.matches)return;resuming=true;
  try{
   if(needsPermission&&(await orientation.requestPermission())!=='granted'){
    if(interactive)notify('Η συσκευή δεν επέτρεψε την κλίση. Η κύλιση παραμένει διαθέσιμη.');
    return;
   }
   remember('on');start();
  }catch{
   // A remembered browser grant may still need a normal page gesture on iOS.
   // Reconnect on that gesture instead of demanding another tilt-button tap.
   if(saved()==='on'&&!gestureArmed){document.addEventListener('pointerdown',resumeFromGesture,true);gestureArmed=true;}
   if(interactive)notify('Δεν ενεργοποιήθηκε η κλίση. Δοκίμασε από Safari ή συνέχισε με κύλιση.');
  }finally{resuming=false;updateButton();}
 }
 function resumeFromGesture(event){if(event.target?.closest?.('#enableTilt'))return;removeResume();void request(false);}
 button.onclick=async()=>{if(enabled){remember('off');stop();return;}await request(true);};
 addEventListener('orientationchange',reset,{passive:true});screen.orientation?.addEventListener?.('change',reset);
 document.addEventListener('visibilitychange',reset);
 motion.addEventListener('change',()=>{if(motion.matches)stop();else if(saved()!=='off')void request(false);updateButton();});
 updateButton();
 // Asking without a gesture cannot show a new permission prompt. An existing
 // grant resolves immediately; only first-time consent needs the explicit button.
 if(!motion.matches&&saved()!=='off')void request(false);
}
