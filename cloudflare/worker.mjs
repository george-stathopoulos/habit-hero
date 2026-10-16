import {begin,callback,me,logout} from './google-auth.mjs';
// Habit Hero Cloudflare Worker: static PWA + protected API foundation.
// Never expose family data until a fully authenticated, tenant-scoped API is implemented.
const JSON_HEADERS = { 'cache-control': 'no-store', 'content-type': 'application/json; charset=utf-8' };
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      return Response.redirect(new URL('/habit-hero/', url), 302);
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
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return json({ detail: 'Habit Hero API functionality is not available yet.' }, 503);
    }
    return env.ASSETS.fetch(request);
  }
};
