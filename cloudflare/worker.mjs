// Habit Hero Cloudflare-native edge entry point.
// Step 7: static assets only. API routes deliberately fail closed until D1-backed
// handlers with session authentication and family authorization are implemented.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      return Response.redirect(new URL('/habit-hero/', url), 302);
    }
    if (url.pathname === '/_health') {
      return Response.json({
        service: 'habit-hero-edge',
        status: 'ok',
        apiConfigured: false
      }, { headers: { 'cache-control': 'no-store' } });
    }
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      return Response.json({ detail: 'Habit Hero API is not configured yet.' }, {
        status: 503,
        headers: { 'cache-control': 'no-store' }
      });
    }
    return env.ASSETS.fetch(request);
  }
};
