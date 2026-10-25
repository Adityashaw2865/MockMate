# Demo, resume and interview kit

## 1. Two-minute demo video script
Record with two browser windows side by side (one logged in as the interviewer, one as the candidate in a private window). Use QuickTime (Mac) or OBS.

| Time | What you do | What you say |
|---|---|---|
| 0:00 | Landing page | "This is MockMate, a real-time mock interview platform I built with Next.js, Yjs and WebRTC." |
| 0:10 | Log in with Google, create a room | "The interviewer creates a room and gets an invite link, or sends it by email." |
| 0:25 | Join as the candidate in the second window | "Roles are enforced on the server: the room creator is the interviewer." |
| 0:35 | Pick a question, starter code appears in both windows | "The interviewer picks from a question bank or writes their own." |
| 0:50 | Type in both windows at once | "The editor is synced with Yjs, a CRDT, so there are no conflicts." |
| 1:05 | Click Run, show the output | "Code runs in a sandbox through Judge0." |
| 1:15 | Show video call, chat, timer, whiteboard tab | "Video is WebRTC. Chat, timer and whiteboard share the same Yjs document." |
| 1:35 | Fill the scorecard, click AI feedback | "Claude analyses the code and the notes and writes a feedback report." |
| 1:50 | Open the shareable report and the replay page | "Candidates get a public report link, and I can replay how the code was written." |
| 2:00 | Show the GitHub README | "Everything is tested, dockerised and deployed with CI." |

## 2. Screenshots for the README
Take these and save them in `docs/screenshots/`, then add them to the README:
1. `home.png` login page
2. `room.png` room with code, video and question
3. `board.png` whiteboard tab
4. `report.png` shareable report
5. `replay.png` session replay

## 3. Resume bullets (pick 3)
- Built **MockMate**, a real-time interview platform (Next.js, TypeScript, Express, PostgreSQL) with collaborative code editing using Yjs CRDTs over WebSockets.
- Implemented peer-to-peer video calls with WebRTC (PeerJS) and optional group calls with LiveKit.
- Integrated the Claude API to generate structured interview feedback; validated model output with Zod and a safe fallback.
- Designed server-side role-based access control, rate limiting and input validation; added unit tests (Vitest), Docker and GitHub Actions CI.
- Added session replay, shareable reports and a question bank, deployed on Vercel, Railway and Neon.

## 4. LinkedIn post (edit the details)
> I just shipped MockMate, a real-time mock interview platform.
> Two people join a room and get a shared code editor, video call, whiteboard, timer and chat. The interviewer scores the candidate and gets an AI-written feedback report, and the candidate gets a shareable report link.
> Stack: Next.js, TypeScript, Yjs, WebRTC, Express, PostgreSQL, Prisma, Claude API.
> The hardest part was keeping the editor in sync for two people typing at once. That is where CRDTs (Yjs) helped.
> Live demo: <your link> | Code: <your GitHub link>

## 5. Questions interviewers will ask (and short answers)
- **Why Yjs instead of plain WebSockets?** Two people can edit at the same time. A CRDT merges edits without conflicts, so I do not write my own merge logic.
- **Why PostgreSQL, not MongoDB?** The data is relational (users, rooms, scorecards, feedback) and I wanted foreign keys and transactions.
- **How do you stop a candidate from reading the scorecard?** Every interviewer-only endpoint checks that the logged-in user is the room host on the server. Hiding buttons in the UI is not security.
- **How is untrusted code run safely?** I do not run it on my server. It goes to Judge0, which runs it in an isolated sandbox with limits.
- **What if the AI returns bad JSON?** The reply is parsed and validated with Zod. If it fails, the app falls back to showing the raw text.
- **How would you scale it?** Move Yjs rooms to a separate service with Redis pub/sub, use LiveKit for calls, and add a TURN server.
- **What would you improve?** Cloud recording storage, calendar integration, and end-to-end tests with Playwright.
