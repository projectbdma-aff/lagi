export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Handle CORS Preflight (Penting agar tidak error saat dipanggil dari web)
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 2. Filter agar hanya memproses path yang dimulai dengan /proxy/
    if (!url.pathname.startsWith('/proxy/')) {
      // Jika bukan path proxy, biarkan Cloudflare Pages mencari file statis di folder /public
      return env.ASSETS.fetch(request);
    }

    // 3. Bangun URL Target
    // Contoh: /proxy/chat/completions -> https://api.koboillm.com/v1/chat/completions
    const targetPath = url.pathname.replace('/proxy/', '');
    const targetUrl = `https://api.koboillm.com/v1/${targetPath}`;

    try {
      // 4. Lakukan Fetch ke API tujuan
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
          // Tambahkan header lain jika API target membutuhkannya
        },
        // Meneruskan body hanya jika bukan request GET/HEAD
        body: (request.method !== 'GET' && request.method !== 'HEAD') 
              ? await request.clone().arrayBuffer() 
              : null,
      });

      // 5. Modifikasi response untuk menambahkan header CORS
      const newHeaders = new Headers(response.headers);
      newHeaders.set('Access-Control-Allow-Origin', '*');
      newHeaders.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      newHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });

    } catch (err) {
      // 6. Tangkap error jika API target down atau URL salah
      return new Response(JSON.stringify({
        error: "Proxy Error",
        message: err.message,
        target: targetUrl
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }
  },
};
