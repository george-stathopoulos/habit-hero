// Google OpenID Connect Authorization Code + PKCE, Cloudflare Worker implementation.
// Only parent identity and session routes. No child/family CRUD enabled yet.
const encoder = new TextEncoder();
const issuer = 'https://accounts.google.com';
const base = 'https://habit-hero-cloudflare.george-stathopoulos.workers.dev';
const redirectUri = base + '/api/auth/google/callback';
const appCallback = base + '/habit-hero/welcome/';
const sessionCookie = '__Host-hh_session';
const flowCookie = '__Host-hh_oauth';
const noStore = {'cache-control':'no-store','content-type':'application/json; charset=utf-8'};
const json = (obj,status=200,extra={}) => new Response(JSON.stringify(obj), {status,headers:{...noStore,...extra}});
const err = (status=401) => json({detail: status===503?'Authentication unavailable':'Authentication failed'},status);
const random = (n=32) => crypto.getRandomValues(new Uint8Array(n));
function b64(bytes) {return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function decode64(data) {const padded=data.replace(/-/g,'+').replace(/_/g,'/');return Uint8Array.from(atob(padded+'='.repeat((4-padded.length%4)%4)),c=>c.charCodeAt(0));}
const hash = async value => b64(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(value))));
const clearFlow = flowCookie+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
const clearSession = sessionCookie+'=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
const sessionFlags = '; Path=/; HttpOnly; Secure; SameSite=Lax';
function cookies(request) {
 const out={};
 for(const part of (request.headers.get('cookie')||'').split(';')) {
  const pos=part.indexOf('=');if(pos>0)out[part.slice(0,pos).trim()]=part.slice(pos+1).trim();
 }
 return out;
}
function errorPage() {
 return new Response('<!doctype html><html lang="el"><meta charset="utf-8"><title>Habit Hero</title><body><p>Δεν ολοκληρώθηκε η σύνδεση. Κλείστε αυτή τη σελίδα και δοκιμάστε ξανά.</p><a href="/habit-hero/original-preview/">Επιστροφή στο Habit Hero</a></body></html>',{status:401,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','referrer-policy':'no-referrer','content-security-policy':"default-src 'none'; style-src 'unsafe-inline'"}});
}
const exactOrigin = request => new URL(request.url).origin===base;
function required(env) {return !!(env.DB && env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);}
async function begin(request,env) {
 if(!required(env))return err(503);
 const state=b64(random()),nonce=b64(random()),verifier=b64(random());
 const challenge=await hash(verifier);
 const now=new Date(),expire=new Date(now.getTime()+600000);
 try {
  await env.DB.prepare(`INSERT INTO oauth_flows
   (id,state_hash,nonce_hash,verifier_hash,provider,created_at,expires_at)
   VALUES (?,?,?,?, 'google',?,?)`)
   .bind(crypto.randomUUID(),await hash(state),await hash(nonce),await hash(verifier),now.toISOString(),expire.toISOString()).run();
 }catch{return err(503)}
 const v=b64(encoder.encode(JSON.stringify({state,nonce,verifier})));
 const q=new URLSearchParams({client_id:env.GOOGLE_CLIENT_ID,redirect_uri:redirectUri,response_type:'code',scope:'openid email profile',
   state,nonce,code_challenge:challenge,code_challenge_method:'S256',prompt:'select_account'});
 return new Response(null,{status:302,headers:{location:'https://accounts.google.com/o/oauth2/v2/auth?'+q,
  'set-cookie':flowCookie+'='+v+sessionFlags+'; Max-Age=600',
  'cache-control':'no-store','referrer-policy':'no-referrer'}});
}
async function idTokenClaims(jwt, clientId, expectedNonce) {
 const parts=jwt.split('.');if(parts.length!==3 || parts.some(p=>p.length>12000))throw Error('Invalid token');
 const header=JSON.parse(new TextDecoder().decode(decode64(parts[0])));
 const claims=JSON.parse(new TextDecoder().decode(decode64(parts[1])));
 if(header.alg!=='RS256'||typeof header.kid!=='string'||!header.kid)throw Error('Invalid alg');
 const keysResponse=await fetch('https://www.googleapis.com/oauth2/v3/certs',{headers:{accept:'application/json'}});
 if(!keysResponse.ok)throw Error('Key endpoint unavailable');
 const {keys}=await keysResponse.json();
 const jwk=keys.find(k=>k.kid===header.kid&&k.kty==='RSA'&&k.use==='sig'&&k.alg==='RS256');
 if(!jwk)throw Error('Signing key unavailable');
 const key=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
 const signature=decode64(parts[2]);
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',key,signature,encoder.encode(parts[0]+'.'+parts[1])))throw Error('Invalid signature');
 const now=Math.floor(Date.now()/1000);
 if(!['https://accounts.google.com','accounts.google.com'].includes(claims.iss) || claims.aud!==clientId ||
    (claims.azp && claims.azp!==clientId) || typeof claims.exp!=='number'||claims.exp<=now||
    typeof claims.iat!=='number'||claims.iat>now+60||claims.iat<now-86400||
    claims.nonce!==expectedNonce||claims.email_verified!==true||
    typeof claims.sub!=='string'||!claims.sub||typeof claims.email!=='string'|| !claims.email.includes('@'))throw Error('Invalid claims');
 return {sub:claims.sub,email:claims.email.trim().toLowerCase(),name:(String(claims.name||'Parent')).slice(0,120)};
}
async function callback(request,env) {
 if(!required(env)||!exactOrigin(request))return errorPage();
 const u=new URL(request.url);
 if(u.searchParams.has('error'))return errorPage();
 const code=u.searchParams.get('code'),state=u.searchParams.get('state'),stored=cookies(request)[flowCookie];
 if(!code||!state||!stored||code.length>4096||state.length>256)return errorPage();
 let flow;
 try{
  flow=JSON.parse(new TextDecoder().decode(decode64(stored)));
  if(flow.state!==state || !flow.verifier || !flow.nonce)return errorPage();
  const now=new Date().toISOString();
  // Atomic consume, never reuse an OAuth flow.
  const claim=await env.DB.prepare(`UPDATE oauth_flows SET consumed_at = ?
   WHERE state_hash=? AND nonce_hash=? AND verifier_hash=? AND provider='google'
   AND consumed_at IS NULL AND expires_at > ?`)
   .bind(now,await hash(state),await hash(flow.nonce),await hash(flow.verifier),now).run();
  if(claim.meta?.changes!==1)return errorPage();
  const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',
    headers:{'content-type':'application/x-www-form-urlencoded'},
    body:new URLSearchParams({code,client_id:env.GOOGLE_CLIENT_ID,client_secret:env.GOOGLE_CLIENT_SECRET,
       redirect_uri:redirectUri,grant_type:'authorization_code',code_verifier:flow.verifier})});
  if(!res.ok)return errorPage();
  const tokens=await res.json();
  if(typeof tokens.id_token!=='string')return errorPage();
  const profile=await idTokenClaims(tokens.id_token,env.GOOGLE_CLIENT_ID,flow.nonce);
  const identity=await env.DB.prepare('SELECT parent_id FROM parent_identities WHERE issuer=? AND subject=?')
    .bind(issuer,profile.sub).first();
  let parentId=identity?.parent_id;
  if(!parentId) {
   // Never link an existing account by email alone; prevents cross-provider account takeover.
   const emailAccount=await env.DB.prepare('SELECT id FROM parent_users WHERE email_normalized=?').bind(profile.email).first();
   if(emailAccount)return errorPage();
   const parent=crypto.randomUUID(),family=crypto.randomUUID(),when=new Date().toISOString();
   await env.DB.batch([
     env.DB.prepare('INSERT INTO parent_users (id,email_normalized,display_name,created_at,updated_at) VALUES (?,?,?,?,?)').bind(parent,profile.email,profile.name,when,when),
     env.DB.prepare('INSERT INTO families (id,display_name,created_at,updated_at) VALUES (?,?,?,?)').bind(family,'Η οικογένειά μου',when,when),
     env.DB.prepare("INSERT INTO family_memberships (family_id,parent_id,role,created_at) VALUES (?,?,'owner',?)").bind(family,parent,when),
     env.DB.prepare('INSERT INTO parent_identities (id,parent_id,issuer,subject,email_at_link,linked_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),parent,issuer,profile.sub,profile.email,when),
   ]);
   parentId=parent;
  } else {
   await env.DB.prepare('UPDATE parent_identities SET last_login_at=? WHERE issuer=? AND subject=?')
      .bind(new Date().toISOString(),issuer,profile.sub).run();
  }
  const token=b64(random()),sessionNow=new Date(),expires=new Date(sessionNow.getTime()+7*86400000);
  await env.DB.prepare(`INSERT INTO auth_sessions (id,parent_id,role,token_hash,created_at,expires_at,household_mode)
      VALUES (?,?,'parent',?,?,?,CASE WHEN EXISTS(SELECT 1 FROM parent_users WHERE id=? AND pin_hash IS NOT NULL) THEN 1 ELSE 0 END)`)
    .bind(crypto.randomUUID(),parentId,await hash(token),sessionNow.toISOString(),expires.toISOString(),parentId).run();
  const headers=new Headers({'location':appCallback,'cache-control':'no-store','referrer-policy':'no-referrer'});
  headers.append('set-cookie',sessionCookie+'='+token+sessionFlags+'; Max-Age=604800');
  headers.append('set-cookie',clearFlow);
  return new Response(null,{status:303,headers});
 }catch{return errorPage();}
}
async function me(request,env){
 if(!env.DB)return err(503);
 const token=cookies(request)[sessionCookie];
 if(!token||token.length>256)return err();
 try{
  const now=new Date().toISOString();
  const row=await env.DB.prepare(`SELECT p.id,p.display_name,p.email_normalized,m.family_id
  FROM auth_sessions s JOIN parent_users p ON p.id=s.parent_id
  JOIN family_memberships m ON m.parent_id=p.id AND (s.family_id IS NULL OR s.family_id=m.family_id) AND NOT EXISTS(SELECT 1 FROM family_membership_revocations rv WHERE rv.family_id=m.family_id AND rv.parent_id=m.parent_id) JOIN families f ON f.id=m.family_id
  WHERE s.token_hash=? AND s.role='parent' AND s.revoked_at IS NULL AND s.expires_at>?
  AND p.disabled_at IS NULL AND f.deleted_at IS NULL ORDER BY m.created_at LIMIT 1`)
   .bind(await hash(token),now).first();
  if(!row)return err();
  return json({user_id:row.id,name:row.display_name,email:row.email_normalized,family_id:row.family_id,role:'parent'});
 }catch{return err(503)}
}
async function logout(request,env){
 // Same-origin protection against cross-site logout requests.
 if(request.headers.get('origin')!==base)return json({detail:'Forbidden'},403);
 const token=cookies(request)[sessionCookie];
 if(token&&env.DB)try{
  await env.DB.prepare('UPDATE auth_sessions SET revoked_at=? WHERE token_hash=?')
    .bind(new Date().toISOString(),await hash(token)).run();
 }catch{return err(503)}
 return json({ok:true},200,{'set-cookie':clearSession});
}
export {begin,callback,me,logout,idTokenClaims};
