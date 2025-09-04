export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-publishable-api-key');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  const { path, ...query } = req.query;
  const backendUrl = 'https://gmbackend.medusajs.app';
  
  if (!path) {
    res.status(400).json({ error: 'Path parameter is required' });
    return;
  }
  
  const queryString = Object.keys(query).length > 0 
    ? '?' + new URLSearchParams(query).toString() 
    : '';
  
  const targetUrl = `${backendUrl}${path}${queryString}`;
  
  console.log('Proxying request to:', targetUrl);
  
  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'x-publishable-api-key': req.headers['x-publishable-api-key'] || 'pk_c72299351bae1998e24ec0e9fc6fe27c454752d3c03b69ccf56509e35096a070',
        'Accept': 'application/json',
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Failed to proxy request', details: error.message });
  }
}