const API_BASE = 'https://server.teleroutex.com/api';
const IRAQ_TERMINATION = 'IRAQ_EQ_MIX_964_Korek_C1_08SEP26';
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.TELEROUTEX_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Numbers service is not configured' });
  const url = new URL(`${API_BASE}/number/my-numbers-by-api-key`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('termination', IRAQ_TERMINATION);
  url.searchParams.set('pageSize', '500');
  url.searchParams.set('page', '1');
  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    const payload = await upstream.json();
    if (!upstream.ok || payload.success === false) return res.status(upstream.status || 502).json({ error: payload?.data?.message || 'Numbers provider error' });
    const docs = Array.isArray(payload?.data?.docs) ? payload.data.docs : [];
    const seen = new Set();
    const numbers = docs.map((x) => String(x.number || '').replace(/\D/g, '')).filter((n) => n.startsWith('964') && !seen.has(n) && seen.add(n)).map((n) => ({ number: `+${n}` }));
    return res.status(200).json({ numbers, count: numbers.length, updatedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({ error: 'Could not reach numbers provider' });
  }
}
