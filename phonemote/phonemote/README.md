# PhoneMote
Phone = Wii-style pointer controller, PC browser = game console. Phone-to-PC data is peer-to-peer (WebRTC).
Vercel only runs a tiny signaling mailbox (api/signal.js) backed by Upstash Redis.

## Deploy
1. Push this folder to GitHub, import it in Vercel (no build settings needed).
2. Vercel dashboard > Storage / Marketplace > add Upstash Redis and connect it to the project
   (sets KV_REST_API_URL / KV_REST_API_TOKEN, both are supported). Redeploy.
3. Open your Vercel URL on the PC, scan the QR with the phone, tap Connect.

## Add a game
Add an object to `scenes` in index.html with init/update/draw, plus an entry in `tiles`.
Per player: p.x, p.y (0..1 pointer), p.k (held buttons), p.pr (pressed this frame), rumble(p).
