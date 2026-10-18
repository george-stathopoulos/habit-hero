const prefix='hh3-offline-';
export function clearOffline(){try{for(const key of ['parent','child'])localStorage.removeItem(prefix+key)}catch{}}
export function saveOffline(role,data){try{if(localStorage.getItem(prefix+'enabled')==='yes')localStorage.setItem(prefix+role,JSON.stringify({at:new Date().toISOString(),data}));return true}catch{return false}}
export function readOffline(role){try{const value=JSON.parse(localStorage.getItem(prefix+role)||'null');if(!value||Date.now()-Date.parse(value.at)>24*3600000){localStorage.removeItem(prefix+role);return null}return value}catch{return null}}
export function offlineControls(role,getData){
 const wrap=document.createElement('div');wrap.className='actions';const enable=document.createElement('button'),disable=document.createElement('button'),status=document.createElement('p');enable.textContent='Διαθέσιμα για ανάγνωση χωρίς σύνδεση';disable.textContent='Διαγραφή αντιγράφων στη συσκευή';status.setAttribute('role','status');
 enable.onclick=async()=>{enable.disabled=true;try{if(!('serviceWorker'in navigator))throw Error('Ο browser δεν υποστηρίζει offline λειτουργία.');await navigator.serviceWorker.register('/habit-hero/v3/notification-sw.js',{scope:'/habit-hero/'});await navigator.serviceWorker.ready;localStorage.setItem(prefix+'enabled','yes');if(!saveOffline(role,getData()))throw Error('Δεν υπάρχει διαθέσιμος χώρος στη συσκευή.');status.textContent='Αποθηκεύτηκε αντίγραφο για 24 ώρες σε αυτή τη συσκευή. Χρησιμοποιήστε το μόνο σε έμπιστη συσκευή. Οι αλλαγές και ο έλεγχος ανακλήσεων πρόσβασης απαιτούν σύνδεση.'}catch(e){status.textContent=e.message}finally{enable.disabled=false}};
 disable.onclick=()=>{clearOffline();try{localStorage.removeItem(prefix+'enabled')}catch{}status.textContent='Διαγράφηκαν τα οικογενειακά αντίγραφα από τη συσκευή.'};wrap.append(enable,disable,status);return wrap;
}
export const offlineFailure=error=>!navigator.onLine||(error instanceof TypeError&&!error.status);
