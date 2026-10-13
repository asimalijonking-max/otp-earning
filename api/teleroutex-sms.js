const API_BASE = 'https://server.teleroutex.com/api';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const number = String(req.query?.number || '').replace(/\D/g, '');
  if (!/^251\d{9}$/.test(number)) return res.status(400).json({ error: 'Invalid Ethiopia number' });
  const apiKey = process.env.TELEROUTEX_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'SMS service is not configured' });

  const url = new URL(`${API_BASE}/message-data-record/viewstats`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('number', number);
  url.searchParams.set('pageSize', '10');
  url.searchParams.set('page', '1');

  try {
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    const payload = await upstream.json();
    if (!upstream.ok || payload.success === false) {
      return res.status(upstream.status || 502).json({ error: payload?.data?.message || 'SMS provider error' });
    }
    const docs = Array.isArray(payload?.data?.docs) ? payload.data.docs : [];
    return res.status(200).json({
      number: `+${number}`,
      messages: docs.slice(0, 10).map((item) => ({
        message: String(item.message || ''),
        cli: String(item.cli || ''),
        createdAt: item.createdAt || null,
      })),
    });
  } catch (error) {
    return res.status(502).json({ error: 'Could not reach SMS provider' });
  }
}
