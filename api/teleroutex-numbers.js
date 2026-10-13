const API_BASE = 'https://server.teleroutex.com/api';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.TELEROUTEX_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Numbers service is not configured' });
  const url = new URL(`${API_BASE}/number/my-numbers-by-api-key`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('pageSize', '500');
  url.searchParams.set('page', '1');
  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    const payload = await upstream.json();
    if (!upstream.ok || payload.success === false) return res.status(upstream.status || 502).json({ error: payload?.data?.message || 'Numbers provider error' });
    const docs = Array.isArray(payload?.data?.docs) ? payload.data.docs : [];
    const numbers = docs.filter((x) => String(x.number || '').replace(/\D/g, '').startsWith('251')).map((x) => ({ number: `+${String(x.number).replace(/\D/g, '')}` }));
    return res.status(200).json({ numbers, count: numbers.length, updatedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({ error: 'Could not reach numbers provider' });
  }
}
