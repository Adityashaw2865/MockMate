# Deployment guide

Three free services are enough: **Neon** (database), **Railway** (API + WebSocket), **Vercel** (web app).

## 1. Database: Neon
1. Create a project at neon.tech and copy the connection string.
2. Use it as `DATABASE_URL` below. Tables are created automatically on server start (`prisma db push`).

## 2. API + WebSocket: Railway (or Render)
1. New project -> Deploy from GitHub repo.
2. Set the Dockerfile path to `apps/server/Dockerfile` (build context = repo root).
3. Environment variables:
   - `DATABASE_URL` - Neon connection string
   - `JWT_SECRET` - long random string
   - `WEB_ORIGIN` - your Vercel URL, e.g. `https://mockmate.vercel.app`
   - `JUDGE0_URL` - `https://ce.judge0.com`
   - `ANTHROPIC_API_KEY` - from console.anthropic.com (enables AI feedback)
   - `RESEND_API_KEY`, `EMAIL_FROM` - optional, enables email invites (resend.com)
   - `GOOGLE_CLIENT_ID` - optional, enables Google sign-in
   - `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` - optional, enables LiveKit group calls
4. Generate a public domain. Check `https://<your-api>/health` returns `{"ok":true}`.

## 3. Web app: Vercel
1. Import the repo, set **Root Directory** to `apps/web`.
2. Environment variables:
   - `NEXT_PUBLIC_API` = `https://<your-api-domain>`
   - `NEXT_PUBLIC_WS` = `wss://<your-api-domain>`
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - optional (add your Vercel URL as an authorized JavaScript origin in Google Cloud)
   - `NEXT_PUBLIC_LIVEKIT_URL` - optional, e.g. `wss://your-project.livekit.cloud`
3. Deploy. Open the URL in two browsers to test live editing and the video call.

## Notes
- Video calls use PeerJS' free public signalling server. For production-grade reliability, switch to LiveKit or add a TURN server.
- The camera and microphone only work on `https://` (or `localhost`).
