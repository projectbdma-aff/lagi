export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() });
    }

    const url = new URL(request.url);

    // Filter Path
    if (!url.pathname.startsWith('/proxy/')) {
      return new Response('Path harus dimulai dengan /proxy/', { status: 404 });
    }

    // Build target URL
    const targetPath = url.pathname.replace('/proxy/', '');
    const targetUrl = `https://api.koboillm.com/v1/${targetPath}`;

    try {
      // Forward request
      const response = await fetch(targetUrl, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': request.headers.get('Authorization') || '',
        },
        // Meneruskan body secara langsung (lebih aman untuk stream/large data)
        body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.arrayBuffer() : undefined,
      });

      // Salin headers response dan tambahkan CORS
      const newHeaders = new Headers(response.headers);
      Object.entries(corsHeaders()).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders
      });

    } catch (error) {
      // Jika terjadi error saat fetch ke target
      return new Response(JSON.stringify({ 
        error: "Gagal menghubungi API Target", 
        detail: error.message 
      }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
