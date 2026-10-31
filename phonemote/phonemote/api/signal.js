// Signaling mailbox only (offer/answer/ICE). Game data goes phone -> PC peer-to-peer over WebRTC.
// Uses REDIS_URL (Vercel Redis) if set, otherwise Upstash REST env vars.
const RURL = process.env.REDIS_URL;
const U = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const T = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
let client;

async function cmd(args) {
  if (RURL) {
    try {
      if (!client) {
        const { createClient } = require('redis');
        client = createClient({ url: RURL });
        client.on('error', () => {});
        await client.connect();
      }
      return await client.sendCommand(args);
    } catch (e) {
      try { client && client.disconnect(); } catch (_) {}
      client = null;
      throw e;
    }
  }
  const r = await fetch(U, { method: 'POST', headers: { Authorization: 'Bearer ' + T }, body: JSON.stringify(args) }).then(r => r.json());
  return r.result;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const q = req.method === 'GET' ? req.query : (req.body || {});
  const room = String(q.room || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const box = String(q.box || '').replace(/[^\w-]/g, '').slice(0, 24);
  if (!RURL && (!U || !T)) return res.status(500).json({ error: 'Redis env vars missing' });
  if (!room || !box) return res.status(400).json({ error: 'room and box required' });
  const key = `pm:${room}:${box}`;
  try {
    if (req.method === 'POST') {
      await cmd(['RPUSH', key, JSON.stringify(q.msg)]);
      await cmd(['EXPIRE', key, '300']);
      return res.json({ ok: 1 });
    }
    const r = await cmd(['LPOP', key, '100']); // atomic read+clear
    res.json({ msgs: (r || []).map(s => JSON.parse(s)) });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
};
