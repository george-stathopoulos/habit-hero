// Salted parent/child PIN verifier. Cloudflare Workers limits PBKDF2 to 100,000 iterations.
// Never persist raw PINs; four-digit PINs are only for a trusted household device.
const b64=a=>btoa(String.fromCharCode(...a)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
export async function createPinVerifier(pin){
 if(typeof pin!=='string'||!/^\d{4}$/.test(pin))throw Error('Invalid PIN');
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
 const hash=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:100000,hash:'SHA-256'},key,256);
 return 'pbkdf2-sha256-100000$'+b64(salt)+'$'+b64(new Uint8Array(hash));
}

export async function verifyPin(pin,verifier){
 if(typeof pin!=='string'||!/^\d{4}$/.test(pin)||typeof verifier!=='string')return false;
 const [method,salt,expected]=verifier.split('$');
 if(method!=='pbkdf2-sha256-100000'||!salt||!expected)return false;
 try{
  const padded=salt.replaceAll('-','+').replaceAll('_','/');
  const saltBytes=Uint8Array.from(atob(padded+'='.repeat((4-padded.length%4)%4)),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
  const raw=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:saltBytes,iterations:100000,hash:'SHA-256'},key,256));
  const actual=b64(raw);
  if(actual.length!==expected.length)return false;
  let difference=0;for(let i=0;i<actual.length;i++)difference|=actual.charCodeAt(i)^expected.charCodeAt(i);
  return difference===0;
 }catch{return false}
}
