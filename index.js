export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Handle CORS Preflight (Agar browser tidak memblokir request)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // 2. LOGIKA PROXY (Untuk fitur Generate)
    if (url.pathname.startsWith('/proxy/')) {
      const targetPath = url.pathname.replace('/proxy/', '');
      const targetUrl = `https://api.koboillm.com/v1/${targetPath}`;

      try {
        const response = await fetch(targetUrl, {
          method: request.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
          },
          body: (request.method !== 'GET' && request.method !== 'HEAD') 
                ? await request.clone().arrayBuffer() : null,
        });

        const newHeaders = new Headers(response.headers);
        newHeaders.set('Access-Control-Allow-Origin', '*');
        newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

        return new Response(response.body, { 
          status: response.status, 
          headers: newHeaders 
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Gagal kontak API", detail: err.message }), { 
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 3. TAMPILAN WEB (Mengambil file index.html dari folder public)
    // env.ASSETS adalah fitur Cloudflare untuk membaca folder [site] bucket di wrangler.toml
    return env.ASSETS.fetch(request);
  }
};
