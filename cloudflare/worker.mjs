// Original Habit Hero front-end at /habit-hero/ and optional API gateway at /api/*.
// The original FastAPI backend remains separate. Never put DB keys or session secrets in client assets.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/') {
      return Response.redirect(new URL('/habit-hero/', url), 302);
    }
    if (url.pathname === '/_health') {
      return Response.json({ service: 'habit-hero-edge', status: 'ok', apiConfigured: Boolean(env.API_ORIGIN) }, {
        headers: { 'cache-control': 'no-store' }
      });
    }
    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      if (!env.API_ORIGIN) {
        return Response.json({ detail: 'Habit Hero API is not configured yet.' }, {
          status: 503, headers: { 'cache-control': 'no-store' }
        });
      }
      let origin;
      try {
        origin = new URL(env.API_ORIGIN);
        if (origin.protocol !== 'https:' || origin.pathname !== '/' || origin.search || origin.hash ||
            origin.host === url.host || origin.username || origin.password) throw Error('Invalid API origin');
      } catch {
        return Response.json({ detail: 'Invalid API upstream configuration.' }, {
          status: 503, headers: { 'cache-control': 'no-store' }
        });
      }
      const upstream = new URL(url.pathname + url.search, origin);
      const headers = new Headers(request.headers);
      headers.delete('host');
      headers.delete('cf-connecting-ip');
      const upstreamRequest = new Request(upstream.toString(), {
        method: request.method,
        headers,
        body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
        redirect: 'manual'
      });
      try {
        const response = await fetch(upstreamRequest);
        const responseHeaders = new Headers(response.headers);
        responseHeaders.set('cache-control', 'no-store');
        return new Response(response.body, { status: response.status, statusText: response.statusText, headers: responseHeaders });
      } catch {
        return Response.json({ detail: 'Habit Hero API is temporarily unavailable.' }, {
          status: 502, headers: { 'cache-control': 'no-store' }
        });
      }
    }
    return env.ASSETS.fetch(request);
  }
};
