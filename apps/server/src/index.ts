import 'dotenv/config'
import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import http from 'http'
import { WebSocketServer } from 'ws'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import rateLimit from 'express-rate-limit'
import { PrismaClient } from '@prisma/client'
import { AccessToken } from 'livekit-server-sdk'
import { average, buildPrompt, parseFeedback, customStarter, escapeHtml, FEEDBACK_SYSTEM } from './lib'
import { QUESTIONS } from './questions'
// @ts-ignore (no types shipped)
import { setupWSConnection } from 'y-websocket/bin/utils'

const prisma = new PrismaClient()
const app = express()
const SECRET = process.env.JWT_SECRET || 'dev'
app.use(cors({ origin: process.env.WEB_ORIGIN || '*' }))
app.use(express.json({ limit: '200kb' }))
app.use(rateLimit({ windowMs: 60_000, limit: 240 }))

const sign = (id: string) => jwt.sign({ id }, SECRET, { expiresIn: '7d' })
const uidOf = (req: Request): string => (req as any).uid
const auth = (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = (req.headers.authorization || '').replace('Bearer ', '')
    ;(req as any).uid = (jwt.verify(t, SECRET) as any).id
    next()
  } catch { res.status(401).json({ error: 'Unauthorized' }) }
}
const wrap = (fn: any) => (req: Request, res: Response) =>
  Promise.resolve(fn(req, res)).catch((e) => res.status(e instanceof z.ZodError ? 400 : 500).json({ error: e.message }))

const findRoom = (code: string): Promise<any> => prisma.room.findUnique({ where: { code: code.toUpperCase() } })
/** Role-based access: loads the room and only continues if the caller is the interviewer (host). */
async function hostRoom(req: Request, res: Response): Promise<any | null> {
  const room = await findRoom(req.params.code)
  if (!room) { res.status(404).json({ error: 'Room not found' }); return null }
  if (room.hostId !== uidOf(req)) { res.status(403).json({ error: 'Only the interviewer can do this' }); return null }
  return room
}

app.get('/health', (_req, res) => res.json({ ok: true }))

// ---------- Auth ----------
app.post('/auth/register', wrap(async (req: Request, res: Response) => {
  const b = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) }).parse(req.body)
  if (await prisma.user.findUnique({ where: { email: b.email } })) return res.status(409).json({ error: 'Email already used' })
  const u = await prisma.user.create({ data: { ...b, password: await bcrypt.hash(b.password, 10) } })
  res.json({ token: sign(u.id), user: { id: u.id, name: u.name } })
}))
app.post('/auth/login', wrap(async (req: Request, res: Response) => {
  const b = z.object({ email: z.string().email(), password: z.string() }).parse(req.body)
  const u = await prisma.user.findUnique({ where: { email: b.email } })
  if (u && !u.password) return res.status(401).json({ error: 'This account uses Google sign-in' })
  if (!u || !(await bcrypt.compare(b.password, u.password))) return res.status(401).json({ error: 'Wrong email or password' })
  res.json({ token: sign(u.id), user: { id: u.id, name: u.name } })
}))
// Google sign-in: the browser sends a Google ID token, we verify it with Google.
app.post('/auth/google', wrap(async (req: Request, res: Response) => {
  const { credential } = z.object({ credential: z.string() }).parse(req.body)
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) return res.status(503).json({ error: 'Google login is not configured (set GOOGLE_CLIENT_ID)' })
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(credential))
  const g: any = await r.json()
  if (!r.ok || g.aud !== clientId || String(g.email_verified) !== 'true') return res.status(401).json({ error: 'Invalid Google token' })
  const u: any = (await prisma.user.findUnique({ where: { email: g.email } })) ??
    (await prisma.user.create({ data: { email: g.email, name: g.name || g.email.split('@')[0] } }))
  res.json({ token: sign(u.id), user: { id: u.id, name: u.name } })
}))

// ---------- Rooms ----------
const code6 = () => Math.random().toString(36).slice(2, 8).toUpperCase()
app.post('/rooms', auth, wrap(async (req: Request, res: Response) => {
  const { language } = z.object({ language: z.string().default('javascript') }).parse(req.body)
  res.json(await prisma.room.create({ data: { code: code6(), language, hostId: uidOf(req) } }))
}))
app.get('/rooms/:code', auth, wrap(async (req: Request, res: Response) => {
  const r = await findRoom(req.params.code)
  if (!r) return res.status(404).json({ error: 'Room not found' })
  const isHost = r.hostId === uidOf(req)
  res.json({ code: r.code, language: r.language, createdAt: r.createdAt, isHost, shareToken: isHost ? r.shareToken : undefined })
}))

// Interviewer-only: scorecard
const score = z.number().int().min(1).max(5)
app.post('/rooms/:code/scorecard', auth, wrap(async (req: Request, res: Response) => {
  const b = z.object({ problemSolving: score, communication: score, codeQuality: score, notes: z.string().max(5000).default('') }).parse(req.body)
  const room = await hostRoom(req, res)
  if (!room) return
  res.json(await prisma.scorecard.create({ data: { ...b, roomId: room.id } }))
}))

// Interviewer-only: AI feedback (Claude API). Stricter rate limit because each call costs money.
app.post('/rooms/:code/feedback', auth, rateLimit({ windowMs: 60_000, limit: 10 }), wrap(async (req: Request, res: Response) => {
  const b = z.object({
    code: z.string().max(50_000), language: z.string(),
    problemSolving: score, communication: score, codeQuality: score, notes: z.string().max(5000).default(''),
  }).parse(req.body)
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) return res.status(503).json({ error: 'AI feedback is not configured. Set ANTHROPIC_API_KEY on the server.' })
  const room = await hostRoom(req, res)
  if (!room) return
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5', max_tokens: 1000,
      system: FEEDBACK_SYSTEM, messages: [{ role: 'user', content: buildPrompt(b) }],
    }),
  })
  const d: any = await r.json()
  if (!r.ok) return res.status(502).json({ error: d?.error?.message || 'AI request failed' })
  res.json(await prisma.feedback.create({ data: { roomId: room.id, ...parseFeedback(d.content?.[0]?.text ?? '') } }))
}))

// ---------- Question bank ----------
// Built-in questions + the interviewer's own custom questions
app.get('/questions', auth, wrap(async (req: Request, res: Response) => {
  const mine: any[] = await prisma.customQuestion.findMany({ where: { ownerId: uidOf(req) }, orderBy: { createdAt: 'desc' } })
  res.json([
    ...mine.map((m) => ({ id: m.id, title: m.title, difficulty: m.difficulty, topic: m.topic, description: m.description, starter: customStarter(m.title), custom: true })),
    ...QUESTIONS,
  ])
}))
app.post('/questions', auth, wrap(async (req: Request, res: Response) => {
  const b = z.object({
    title: z.string().min(3).max(100).regex(/^[^\r\n]+$/),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    description: z.string().min(10).max(2000),
  }).parse(req.body)
  res.json(await prisma.customQuestion.create({ data: { ...b, ownerId: uidOf(req) } }))
}))
app.delete('/questions/:id', auth, wrap(async (req: Request, res: Response) => {
  await prisma.customQuestion.deleteMany({ where: { id: req.params.id, ownerId: uidOf(req) } })
  res.json({ ok: true })
}))

// Interviewer-only: email invite (Resend)
app.post('/rooms/:code/invite', auth, rateLimit({ windowMs: 60_000, limit: 10 }), wrap(async (req: Request, res: Response) => {
  const { email } = z.object({ email: z.string().email() }).parse(req.body)
  const key = process.env.RESEND_API_KEY
  if (!key) return res.status(503).json({ error: 'Email invites are not configured (set RESEND_API_KEY)' })
  const room = await hostRoom(req, res)
  if (!room) return
  const u: any = await prisma.user.findUnique({ where: { id: uidOf(req) } })
  const link = `${process.env.WEB_ORIGIN || 'http://localhost:3000'}/room/${room.code}`
  const name = escapeHtml(u?.name ?? 'Someone')
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'MockMate <onboarding@resend.dev>', to: [email],
      subject: `${u?.name ?? 'Someone'} invited you to a mock interview`,
      html: `<p>${name} invited you to a mock interview on MockMate.</p><p><a href="${link}">Join the room</a> (room code: <b>${room.code}</b>)</p>`,
    }),
  })
  if (!r.ok) return res.status(502).json({ error: 'Could not send the email' })
  res.json({ ok: true })
}))

// ---------- Session replay ----------
app.post('/rooms/:code/snapshots', auth, wrap(async (req: Request, res: Response) => {
  const { code } = z.object({ code: z.string().max(50_000) }).parse(req.body)
  const room = await findRoom(req.params.code)
  if (!room) return res.status(404).json({ error: 'Room not found' })
  const last = await prisma.snapshot.findFirst({ where: { roomId: room.id }, orderBy: { createdAt: 'desc' } })
  if (last?.code === code || (await prisma.snapshot.count({ where: { roomId: room.id } })) >= 600) return res.json({ skipped: true })
  await prisma.snapshot.create({ data: { roomId: room.id, code } })
  res.json({ ok: true })
}))
app.get('/rooms/:code/snapshots', auth, wrap(async (req: Request, res: Response) => {
  const room = await hostRoom(req, res)
  if (!room) return
  const snaps = await prisma.snapshot.findMany({ where: { roomId: room.id }, orderBy: { createdAt: 'asc' }, select: { code: true, createdAt: true } })
  res.json(snaps)
}))

// ---------- Shareable report (public, unguessable token) ----------
app.get('/public/report/:token', wrap(async (req: Request, res: Response) => {
  const r: any = await prisma.room.findUnique({
    where: { shareToken: req.params.token },
    include: { scorecards: { orderBy: { createdAt: 'desc' }, take: 1 }, feedbacks: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  if (!r) return res.status(404).json({ error: 'Report not found' })
  const s = r.scorecards[0], f = r.feedbacks[0]
  res.json({
    code: r.code, language: r.language, createdAt: r.createdAt,
    scores: s ? { problemSolving: s.problemSolving, communication: s.communication, codeQuality: s.codeQuality, average: average(s.problemSolving, s.communication, s.codeQuality) } : null,
    feedback: f ? { summary: f.summary, strengths: f.strengths, improvements: f.improvements } : null,
  }) // interviewer's private notes are never exposed here
}))

// ---------- Dashboard ----------
app.get('/interviews', auth, wrap(async (req: Request, res: Response) => {
  const rooms = await prisma.room.findMany({
    where: { hostId: uidOf(req) }, orderBy: { createdAt: 'desc' }, take: 50,
    include: { scorecards: { orderBy: { createdAt: 'desc' }, take: 1 }, feedbacks: { orderBy: { createdAt: 'desc' }, take: 1 } },
  })
  res.json(rooms.map((r: any) => {
    const s = r.scorecards[0]
    return {
      code: r.code, language: r.language, createdAt: r.createdAt, shareToken: r.shareToken,
      score: s ? average(s.problemSolving, s.communication, s.codeQuality) : null,
      notes: s?.notes ?? '', feedback: r.feedbacks[0] ?? null,
    }
  }))
}))

// ---------- Code execution ----------
const LANG: Record<string, number> = { javascript: 63, python: 71, cpp: 54, java: 62 }
app.post('/run', auth, wrap(async (req: Request, res: Response) => {
  const b = z.object({ language: z.string(), code: z.string().max(50_000) }).parse(req.body)
  const r = await fetch(`${process.env.JUDGE0_URL}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ language_id: LANG[b.language] ?? 63, source_code: b.code }),
  })
  const d: any = await r.json()
  res.json({ output: [d.stdout, d.stderr, d.compile_output, d.message].filter(Boolean).join('\n') || '(no output)' })
}))

// ---------- LiveKit (optional group calls) ----------
app.post('/rooms/:code/livekit-token', auth, wrap(async (req: Request, res: Response) => {
  const { LIVEKIT_API_KEY: k, LIVEKIT_API_SECRET: s } = process.env
  if (!k || !s) return res.status(503).json({ error: 'LiveKit is not configured' })
  const room = await findRoom(req.params.code)
  if (!room) return res.status(404).json({ error: 'Room not found' })
  const u: any = await prisma.user.findUnique({ where: { id: uidOf(req) } })
  const at = new AccessToken(k, s, { identity: uidOf(req), name: u?.name })
  at.addGrant({ roomJoin: true, room: 'mockmate-' + room.code, canPublish: true, canSubscribe: true })
  res.json({ token: await at.toJwt() })
}))

const server = http.createServer(app)
const wss = new WebSocketServer({ server })
wss.on('connection', (ws, req) => setupWSConnection(ws, req)) // Yjs real-time sync
const port = Number(process.env.PORT) || 4000
server.listen(port, () => console.log(`API + WS on :${port}`))
