// Signaling mailbox only (offer/answer/ICE). Game data goes phone -> PC peer-to-peer over WebRTC.
const U = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const T = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = (cmds) => fetch(U + '/pipeline', {
  method: 'POST', headers: { Authorization: 'Bearer ' + T }, body: JSON.stringify(cmds)
}).then(r => r.json());

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const q = req.method === 'GET' ? req.query : (req.body || {});
  const room = String(q.room || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  const box = String(q.box || '').replace(/[^\w-]/g, '').slice(0, 24);
  if (!U || !T) return res.status(500).json({ error: 'Redis env vars missing' });
  if (!room || !box) return res.status(400).json({ error: 'room and box required' });
  const key = `pm:${room}:${box}`;
  if (req.method === 'POST') {
    await redis([['RPUSH', key, JSON.stringify(q.msg)], ['EXPIRE', key, 300]]);
    return res.json({ ok: 1 });
  }
  const r = await redis([['LPOP', key, 100]]); // atomic read+clear, one command
  res.json({ msgs: (r[0].result || []).map(s => JSON.parse(s)) });
};
