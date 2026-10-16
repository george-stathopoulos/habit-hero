import {parentProgress,childProgress} from './progress-api.mjs';
import {parentRewards,createReward,childRewards,childRequestReward,parentRedemptions,reviewReward,editReward,archiveReward} from './rewards-api.mjs';
import {childPage} from './child-page.mjs';
import {makePairing,pairDevice,childMe,childActivities,childSubmit,childLogout,revokeChildDevices} from './child-auth.mjs';
import {listActivities,submitActivity,listApprovals,reviewActivity,listBalances} from './activity-api.mjs';
import {listHabits,createHabit,updateHabit,archiveHabit,assignHabit} from './habits-api.mjs';
import {parentPage} from './parent-page.mjs';
import {familyOverview,createChild,editChild} from './family-api.mjs';
import {begin,callback,me,logout} from './google-auth.mjs';
// Habit Hero Cloudflare Worker: static PWA + protected API foundation.
// Never expose family data until a fully authenticated, tenant-scoped API is implemented.
const JSON_HEADERS = { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });


// Explicit Worker-owned SSO landing route. Expo's static export does not emit
// a physical deep-link HTML page for every client-side route, so Cloudflare
// must not pass the OAuth return URL to static assets (which returns 404).
// Never interpolate identity data into HTML; the page reads /api/auth/me and
// renders it using textContent (rather than innerHTML).
function googleLanding() {
  const html = `<!doctype html>
<html lang="el"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer"><title>Habit Hero — Google sign-in</title>
<style>
*{box-sizing:border-box}body{min-height:100vh;margin:0;background:#f5f8ff;color:#18334f;font-family:system-ui,-apple-system,sans-serif;display:grid;place-items:center;padding:24px}
main{max-width:500px;width:100%;border-radius:20px;padding:32px;background:white;box-shadow:0 10px 40px #19345118;text-align:center}
h1{font-size:29px;margin:10px 0}p{line-height:1.6}a,button{display:inline-block;background:#4a90e2;color:white;text-decoration:none;padding:12px 20px;border:0;border-radius:10px;font:inherit;cursor:pointer;margin:8px}
.secondary{background:#eef3fa;color:#214a76}small{color:#66758b}
</style></head><body><main><div style="font-size:54px">🏆</div><h1>Habit Hero</h1>
<p id="message" role="status">Επαλήθευση σύνδεσης...</p>
<p id="actions"><a class="secondary" href="/habit-hero/original-preview/">Επιστροφή στην εφαρμογή</a></p>
<small>Η διαχείριση οικογένειας θα ενεργοποιηθεί σε επόμενο βήμα.</small></main>
<script>
(async()=>{
 const message=document.getElementById('message'),actions=document.getElementById('actions');
 try {
  const r=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
  if(!r.ok)throw Error('unauthenticated');
  const me=await r.json();
  message.textContent='Καλώς ήρθατε, '+(me.name||'')+'! Η σύνδεση με Google ολοκληρώθηκε επιτυχώς.';
  const logout=document.createElement('button');
  logout.textContent='Αποσύνδεση';
  logout.addEventListener('click',async()=>{
   await fetch('/api/auth/logout',{method:'POST',credentials:'same-origin'}).catch(()=>{});
   window.location.assign('/habit-hero/original-preview/');
  });
  const enter=document.createElement('a');
  enter.href='/habit-hero/parent/';enter.textContent='Μετάβαση στην οικογένειά μου';
  actions.replaceChildren(enter,logout);
 }catch{
  message.textContent='Δεν βρέθηκε ενεργή σύνδεση. Παρακαλώ δοκιμάστε ξανά.';
  const retry=document.createElement('a');
  retry.href='/api/auth/google/start';retry.textContent='Σύνδεση με Google';
  actions.prepend(retry);
 }
})();
</script></body></html>`;
  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, private',
      'referrer-policy': 'no-referrer',
      'x-content-type-options': 'nosniff',
      'content-security-policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      return Response.redirect(new URL('/habit-hero/', url), 302);
    }
    if (url.pathname === '/habit-hero/original-preview/auth/google-callback' ||
        url.pathname === '/habit-hero/original-preview/auth/google-callback/') {
      if (request.method !== 'GET') return json({detail:'Method not allowed'},405);
      return googleLanding();
    }
    if (url.pathname === '/habit-hero/parent' || url.pathname === '/habit-hero/parent/') {
      if (request.method !== 'GET') return json({detail:'Method not allowed'},405);
      return parentPage();
    }
    if (url.pathname === '/habit-hero/child' || url.pathname === '/habit-hero/child/') {
      if(request.method!=='GET')return json({detail:'Method not allowed'},405);
      return childPage();
    }
    if (url.pathname === '/_health') {
      return json({ service: 'habit-hero-edge', status: 'ok', apiConfigured: false });
    }
    // Safe, read-only connectivity probe. Never return database errors, names, rows or identifiers.
    if (url.pathname === '/api/health' && request.method === 'GET') {
      if (!env.DB) return json({ status: 'unavailable' }, 503);
      try {
        const result = await env.DB.prepare('SELECT 1 AS ready').first();
        if (result?.ready === 1) {
          return json({ service: 'habit-hero-api', status: 'ok', database: 'connected', featuresEnabled: false });
        }
      } catch {
        // Deliberately omit error details to avoid exposing the database setup.
      }
      return json({ status: 'unavailable' }, 503);
    }
    if (url.pathname === '/api/auth/google/start' && request.method === 'GET') {
      return begin(request,env);
    }
    if (url.pathname === '/api/auth/google/callback' && request.method === 'GET') {
      return callback(request,env);
    }
    if (url.pathname === '/api/auth/me' && request.method === 'GET') {
      return me(request,env);
    }
    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      return logout(request,env);
    }
    if (url.pathname === '/api/family/overview' && request.method === 'GET') {
      return familyOverview(request,env);
    }
    if (url.pathname === '/api/children' && request.method === 'POST') {
      return createChild(request,env);
    }
    if (url.pathname === '/api/children/update' && request.method === 'POST') return editChild(request,env);
    if (url.pathname === '/api/habits' && request.method === 'GET') {
      return listHabits(request,env);
    }
    if (url.pathname === '/api/habits' && request.method === 'POST') {
      return createHabit(request,env);
    }
    if (url.pathname === '/api/habits/update' && request.method === 'POST') return updateHabit(request,env);
    if (url.pathname === '/api/habits/archive' && request.method === 'POST') return archiveHabit(request,env);
    if (url.pathname === '/api/habits/assign' && request.method === 'POST') return assignHabit(request,env);
    if (url.pathname === '/api/activities' && request.method === 'GET') return listActivities(request,env);
    if (url.pathname === '/api/activities' && request.method === 'POST') return submitActivity(request,env);
    if (url.pathname === '/api/approvals' && request.method === 'GET') return listApprovals(request,env);
    if (url.pathname === '/api/approvals/review' && request.method === 'POST') return reviewActivity(request,env);
    if (url.pathname === '/api/points' && request.method === 'GET') return listBalances(request,env);
    if (url.pathname === '/api/progress' && request.method === 'GET') return parentProgress(request,env);
    if (url.pathname === '/api/child/progress' && request.method === 'GET') return childProgress(request,env);
    if (url.pathname === '/api/child/pairing' && request.method === 'POST') return makePairing(request,env);
    if (url.pathname === '/api/child/revoke' && request.method === 'POST') return revokeChildDevices(request,env);
    if (url.pathname === '/api/child/pair' && request.method === 'POST') return pairDevice(request,env);
    if (url.pathname === '/api/child/me' && request.method === 'GET') return childMe(request,env);
    if (url.pathname === '/api/child/activities' && request.method === 'GET') return childActivities(request,env);
    if (url.pathname === '/api/child/activities' && request.method === 'POST') return childSubmit(request,env);
    if (url.pathname === '/api/child/logout' && request.method === 'POST') return childLogout(request,env);
    if (url.pathname === '/api/rewards' && request.method === 'GET') return parentRewards(request,env);
    if (url.pathname === '/api/rewards' && request.method === 'POST') return createReward(request,env);
    if (url.pathname === '/api/rewards/update' && request.method === 'POST') return editReward(request,env);
    if (url.pathname === '/api/rewards/archive' && request.method === 'POST') return archiveReward(request,env);
    if (url.pathname === '/api/rewards/redemptions' && request.method === 'GET') return parentRedemptions(request,env);
    if (url.pathname === '/api/rewards/review' && request.method === 'POST') return reviewReward(request,env);
    if (url.pathname === '/api/child/rewards' && request.method === 'GET') return childRewards(request,env);
    if (url.pathname === '/api/child/rewards/request' && request.method === 'POST') return childRequestReward(request,env);
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return json({ detail: 'Habit Hero API functionality is not available yet.' }, 503);
    }
    return env.ASSETS.fetch(request);
  }
};
