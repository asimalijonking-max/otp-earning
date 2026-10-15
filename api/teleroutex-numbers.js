import { LEGACY_PAKISTAN } from './legacy-pakistan.js';
const API_BASE = 'https://server.teleroutex.com/api';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const apiKey = process.env.TELEROUTEX_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Numbers service is not configured' });
  const endpoint = `${API_BASE}/number/my-numbers-by-api-key`;
  const getDocs = async (termination = '') => {
    const url = new URL(endpoint);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('pageSize', '500');
    url.searchParams.set('page', '1');
    if (termination) url.searchParams.set('termination', termination);
    const upstream = await fetch(url, { headers: { Accept: 'application/json' } });
    const payload = await upstream.json();
    if (!upstream.ok || payload.success === false) throw new Error(payload?.data?.message || 'Numbers provider error');
    return Array.isArray(payload?.data?.docs) ? payload.data.docs : [];
  };
  try {
    const [allDocs, iraqDocs] = await Promise.all([getDocs(), getDocs('IRAQ_EQ_MIX_964_Korek_C1_08SEP26')]);
    const livePakistan = allDocs.filter((x) => String(x.number || '').replace(/\D/g, '').startsWith('92')).map((x) => ({ number: String(x.number || '') }));
    const pakistan = [...LEGACY_PAKISTAN.map((number) => ({ number })), ...livePakistan];
    const iraq = iraqDocs.filter((x) => String(x.number || '').replace(/\D/g, '').startsWith('964'));
    const seen = new Set();
    const numbers = [...pakistan, ...iraq].map((x) => String(x.number || '').replace(/\D/g, '')).filter((n) => { if (seen.has(n)) return false; seen.add(n); return true; }).map((n) => ({ number: `+${n}` }));
    return res.status(200).json({ numbers, count: numbers.length, updatedAt: new Date().toISOString() });
  } catch (error) {
    return res.status(502).json({ error: 'Could not reach numbers provider' });
  }
}
