export default {
  async fetch(request, env) {

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders()
      });
    }

    const url = new URL(request.url);

    // Only allow /proxy/* path
    if (!url.pathname.startsWith('/proxy/')) {
      return new Response('Not found', { status: 404 });
    }

    // Build target URL: /proxy/chat/completions → https://api.koboillm.com/v1/chat/completions
    const targetPath = url.pathname.replace('/proxy/', '');
    const targetUrl = `https://api.koboillm.com/v1/${targetPath}`;

    // Forward request body & headers
    const body = request.method !== 'GET' ? await request.text() : undefined;

    // Get API key from request header
    const authHeader = request.headers.get('Authorization') || '';

    const response = await fetch(targetUrl, {
      method: request.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: body,
    });

    // Read response
    const responseData = await response.text();

    return new Response(responseData, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
        ...corsHeaders()
      }
    });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}
