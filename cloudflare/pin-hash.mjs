// Child PIN verifier. Never persist raw four-digit codes.
const b64=a=>btoa(String.fromCharCode(...a)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
export async function createPinVerifier(pin){
 if(typeof pin!=='string'||!/^\d{4}$/.test(pin))throw Error('Invalid PIN');
 const salt=crypto.getRandomValues(new Uint8Array(16));
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
 const hash=await crypto.subtle.deriveBits({name:'PBKDF2',salt,iterations:160000,hash:'SHA-256'},key,256);
 return 'pbkdf2-sha256-160000$'+b64(salt)+'$'+b64(new Uint8Array(hash));
}
