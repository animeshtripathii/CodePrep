# CodePrep

CodePrep is a full-stack interview prep platform for DSA practice, AI interviews, peer collaboration, and progress tracking.

## What You Get
- DSA problem solving with Monaco editor, run, submit, and Judge0 execution.
- Explore page with filters, search, and solved-status indicator.
- Dashboard with solved breakdown, streak/activity visuals, and recent submissions.
- AI mock interview (CV-based context, voice/text interaction, report generation).
- Peer mock interview with shareable room link, live code sync, chat, whiteboard, and WebRTC audio/video.
- Real-time discussion rooms using Socket.io.
- Subscription plans and token purchase flow via Razorpay.

## Token System (Short)
- Tokens are the platform credit for premium actions.
- `@CodeBot` discussion messages consume tokens.
- AI interview interactions consume tokens.
- Discussion access requires a minimum token balance.
- Purchasing a plan credits base tokens + bonus tokens.
- Backend validates deductions to prevent negative/invalid spends.

## Tech Stack
- Frontend: React, Vite, Redux Toolkit, React Router, Socket.io Client.
- Backend: Node.js, Express, Socket.io, BullMQ workers.
- Data: MongoDB + Redis.
- Integrations: Judge0, Gemini, Razorpay, Brevo Email.

## Quick Start
```bash
# Backend
cd Backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

## Required Env
Backend `.env`:
- `PORT`, `MONGO_URI`, `JWT_Secret_Key`
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`
- `JUDGE0_API`, `ChatBot_API`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`
- `EMAIL_USER`, `BREVO_API_KEY`

Frontend `.env`:
- `VITE_API_URL`
- `VITE_TURN_URLS`, `VITE_TURN_USERNAME`, `VITE_TURN_CREDENTIAL`

## Deployment Notes
- Recommended: frontend on Vercel, backend on Render.
- For production peer video/audio, TURN env vars are required.