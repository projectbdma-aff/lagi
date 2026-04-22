export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Proxy logic
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

      return new Response(response.body, {
        status: response.status,
        headers: newHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { status: 502 });
    }
  },
};
