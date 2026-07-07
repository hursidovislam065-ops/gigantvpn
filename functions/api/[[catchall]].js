export async function onRequest(context) {
  const { request, params } = context;
  const url = new URL(request.url);

  // Proxy /api/* to Render backend
  const backendUrl = `https://gigantvpn-1.onrender.com${url.pathname}${url.search}`;

  const headers = new Headers(request.headers);
  headers.set('Host', 'gigantvpn-1.onrender.com');

  const proxyRequest = new Request(backendUrl, {
    method: request.method,
    headers,
    body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : undefined,
  });

  try {
    const response = await fetch(proxyRequest);
    const proxyHeaders = new Headers(response.headers);
    proxyHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: proxyHeaders,
    });
  } catch (error) {
    return new Response(JSON.stringify({ detail: 'Backend unavailable' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
