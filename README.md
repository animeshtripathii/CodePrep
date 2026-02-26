# CodePrep — Full-Stack DSA Practice Platform

**CodePrep** is a full-stack coding practice platform for Data Structures and Algorithms (DSA). Users solve curated coding problems in an online code editor with real-time execution, track progress on a personalized dashboard, participate in real-time discussions, and interact with AI-powered chatbots. The platform integrates **Razorpay** for payments, **Judge0** for code execution, **Gemini AI** for intelligent tutoring, **Redis** for session management, and **Socket.io** for real-time communication.

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Project Structure](#project-structure)
3. [Environment Variables](#environment-variables)
4. [Getting Started](#getting-started)
5. [Architecture Overview](#architecture-overview)
6. [Backend — Detailed Route Documentation](#backend--detailed-route-documentation)
7. [How Redis Works](#how-redis-works)
8. [How Judge0 Works](#how-judge0-works)
9. [How Nodemailer (Email) Works](#how-nodemailer-email-works)
10. [How Razorpay (Payment) Works](#how-razorpay-payment-works)
11. [How Socket.io (Real-Time Chat) Works](#how-socketio-real-time-chat-works)
12. [How Gemini AI Chatbot Works](#how-gemini-ai-chatbot-works)
13. [Frontend — Detailed Page Documentation](#frontend--detailed-page-documentation)
14. [How Redux Works](#how-redux-works)
15. [Database Models](#database-models)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, Vite, Redux Toolkit, React Router, Tailwind CSS, React Hook Form, Zod, Socket.io Client |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **Cache/Session** | Redis Cloud (token blacklisting) |
| **Code Execution** | Judge0 CE (via RapidAPI) |
| **AI** | Google Gemini 2.5 Flash (`@google/genai`) |
| **Payments** | Razorpay (Orders + Signature Verification) |
| **Email** | Nodemailer (Gmail SMTP) |
| **Real-Time** | Socket.io |
| **File Storage** | Cloudinary (video solutions) |

---

## Project Structure

```
CodePrep-main/
├── Backend/
│   ├── .env                        # Environment variables
│   └── src/
│       ├── app.js                  # Express app setup, middleware, route mounting
│       ├── index.js                # HTTP server + Socket.io initialization
│       ├── config/
│       │   ├── db.js               # MongoDB connection
│       │   ├── redis.js            # Redis client configuration
│       │   └── razorpay.js         # Razorpay instance
│       ├── middleware/
│       │   ├── userMiddleware.js   # JWT verification + Redis blacklist check
│       │   └── adminMiddleware.js  # Admin role verification
│       ├── models/
│       │   ├── user.js             # User schema (auth, tokens, problemSolved, resetPassword)
│       │   ├── problem.js          # Problem schema (testCases, startCode, referenceSolution)
│       │   ├── submission.js       # Code submission records
│       │   ├── plan.js             # Token plans (name, price, tokens, bonusTokens)
│       │   ├── Order.js            # Payment orders (Razorpay integration)
│       │   ├── ChatMessage.js      # Discussion messages
│       │   ├── ChatRoomStats.js    # Dynamic room allocation stats
│       │   └── videoSolution.js    # Cloudinary video references
│       ├── controllers/            # Request handlers (thin layer → delegates to services)
│       ├── services/               # Business logic layer
│       ├── routes/                  # Express route definitions
│       ├── sockets/
│       │   └── chatHandler.js      # Socket.io event handlers
│       ├── utils/
│       │   ├── emailService.js     # Nodemailer transporter + email templates
│       │   └── problemSubmissionUtility.js  # Judge0 API helpers
│       └── webHook/
│           └── paymentHook.js      # Razorpay webhook handler
│
└── frontend/
    └── src/
        ├── App.jsx                 # Root component + React Router
        ├── main.jsx                # Entry point + Redux Provider
        ├── index.css               # Global styles
        ├── app/
        │   ├── store.js            # Redux store configuration
        │   └── features/
        │       └── auth/
        │           └── authSlice.js  # Auth state (user, tokens, isAuthenticated)
        ├── components/
        │   ├── Navbar.jsx          # Top navigation bar
        │   ├── Footer.jsx          # Footer component
        │   └── FloatingChatbot.jsx # AI support chatbot (bottom-right)
        ├── pages/
        │   ├── Home.jsx            # Problem listing with filters/search/pagination
        │   ├── Login.jsx           # Login form
        │   ├── Signup.jsx          # Registration form
        │   ├── Dashboard.jsx       # User stats, heatmap, language chart
        │   ├── CodeEditorPage.jsx  # Monaco editor + test runner + AI tutor
        │   ├── AdminPanel.jsx      # Problem CRUD for admins
        │   ├── Plans.jsx           # Token purchase plans (Razorpay checkout)
        │   ├── DiscussionsPage.jsx # Real-time problem discussions (Socket.io)
        │   ├── ForgotPasswordPage.jsx # Password reset request
        │   └── ResetPasswordPage.jsx  # New password form (via token)
        └── utils/
            └── axiosClient.js      # Axios instance with baseURL + withCredentials
```

---

## Environment Variables

Create a `.env` file in the `Backend/` directory:

```env
# ─── Server ───
PORT=3000

# ─── MongoDB ───
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/CodeBench?retryWrites=true&w=majority

# ─── JWT ───
JWT_Secret_Key=your_jwt_secret_key_here

# ─── Redis (Token Blacklisting) ───
REDIS_HOST=redis-xxxxx.cloud.redislabs.com
REDIS_PORT=14505
REDIS_PASSWORD=your_redis_password

# ─── Judge0 (Code Execution via RapidAPI) ───
JUDGE0_API=your_rapidapi_key_here

# ─── Gemini AI (Chatbot) ───
ChatBot_API=your_google_gemini_api_key

# ─── Cloudinary (Video Storage) ───
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ─── Razorpay (Payments) ───
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# ─── Nodemailer (Email) ───
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> **Note:** For Gmail, you must generate an **App Password** (not your regular password). Go to Google Account → Security → 2FA → App Passwords.

---

## Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/your-repo/CodePrep-main.git
cd CodePrep-main

# 2. Install backend dependencies
cd Backend
npm install

# 3. Configure environment variables
# Create .env file as shown above

# 4. Start backend server
npm run dev
# Server runs on http://localhost:3000

# 5. Install frontend dependencies (new terminal)
cd ../frontend
npm install

# 6. Start frontend dev server
npm run dev
# Frontend runs on http://localhost:5173
```

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                     │
│   ┌─────────┐  ┌──────────┐  ┌────────────┐  ┌───────────┐  │
│   │  Redux   │  │  Router  │  │  Axios     │  │ Socket.io │  │
│   │  Store   │  │  Pages   │  │  Client    │  │  Client   │  │
│   └────┬─────┘  └────┬─────┘  └─────┬──────┘  └─────┬─────┘  │
│        └──────────────┴──────────────┴───────────────┘        │
└──────────────────────────────┬───────────────────────────────┘
                               │ HTTP (REST) + WebSocket
┌──────────────────────────────┴───────────────────────────────┐
│                  BACKEND (Node.js + Express)                  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│   │  Routes  ├──┤Controllers├──┤ Services ├──┤   Models   │  │
│   └──────────┘  └──────────┘  └────┬─────┘  └─────┬──────┘  │
│                                    │               │          │
│   ┌──────────┐  ┌──────────┐  ┌────┴─────┐  ┌─────┴──────┐  │
│   │  Redis   │  │ Judge0   │  │ Gemini   │  │  MongoDB   │  │
│   │(Blacklist)│  │(RapidAPI)│  │   AI     │  │  Atlas     │  │
│   └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│   │Razorpay  │  │Nodemailer│  │Socket.io │                  │
│   │(Payments)│  │ (Email)  │  │ (Chat)   │                  │
│   └──────────┘  └──────────┘  └──────────┘                  │
└──────────────────────────────────────────────────────────────┘
```

---

## Backend — Detailed Route Documentation

### Authentication Routes (`/user`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/user/register` | ❌ | Register a new user. Hashes password with bcrypt, creates JWT token, sets it as HTTP-only cookie. |
| `POST` | `/user/login` | ❌ | Login with email/password. Validates credentials, returns JWT cookie. |
| `POST` | `/user/logout` | ✅ User | Logout. Adds JWT to Redis blacklist so it cannot be reused. |
| `GET` | `/user/check` | ✅ User | Check if user is authenticated. Used by frontend on app load. |
| `GET` | `/user/getProfile` | ❌ | Get user profile by token (reads JWT from cookie). |
| `GET` | `/user/dashboard` | ✅ User | Returns full dashboard stats: solved count, rank, acceptance rate, streak, language stats, heatmap data. |
| `DELETE` | `/user/deleteProfile` | ✅ User | Delete user account and all their submissions. |
| `POST` | `/user/admin/register` | ✅ Admin | Register a new admin (only existing admins can create new admins). |
| `POST` | `/user/forgot-password` | ❌ | Accepts `{ emailId }`. Generates a 32-byte crypto token, SHA-256 hashes it, saves to DB with 15-min expiry, sends reset email. |
| `POST` | `/user/reset-password/:token` | ❌ | Accepts `{ newPassword }` + token from URL. Verifies hashed token + expiry, bcrypt-hashes new password, clears token fields. |

**Request/Response Examples:**

```json
// POST /user/register
// Request:
{ "firstName": "Animesh", "emailId": "user@example.com", "password": "SecureP@ss1" }
// Response (201):
{ "message": "User registered successfully", "user": { ... } }
// Cookie: token=eyJhbGciOiJIUzI... (HttpOnly)

// POST /user/forgot-password
// Request:
{ "emailId": "user@example.com" }
// Response (200):
{ "message": "Password reset link sent to your email." }
```

---

### Problem Routes (`/problem`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/problem/create` | ✅ Admin | Create a new problem. Validates reference solution against test cases via Judge0 before saving. |
| `PUT` | `/problem/update/:id` | ✅ Admin | Update an existing problem. Re-validates reference solution. |
| `DELETE` | `/problem/delete/:id` | ✅ Admin | Delete a problem by ID. |
| `GET` | `/problem/:id` | ✅ User | Get a single problem with all details (test cases, start code, video solution if available). |
| `GET` | `/problem/all` | ✅ User | Get paginated problems list. Supports `?page=1&limit=10&search=&difficulty=&tag=` query params. |
| `GET` | `/problem/solved/all` | ✅ User | Get all problems solved by the authenticated user. |

**Problem Creation Flow:**
1. Admin submits problem with reference solutions in multiple languages
2. Backend sends each reference solution through Judge0 with visible test cases
3. If ANY test case fails → problem is rejected with an error
4. If ALL pass → problem is saved to MongoDB

---

### Submission Routes (`/submission`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/submission/submit/:problemId` | ✅ User | Submit code for grading against **hidden** test cases. Records result (accepted/WA/TLE/CE/RE). |
| `POST` | `/submission/run/:problemId` | ✅ User | Run code against **visible** test cases only (no permanent record). |
| `GET` | `/submission/submissions/:problemId` | ✅ User | Get all past submissions for a specific problem by the authenticated user. |

**Submission Flow:**
1. User submits code + language + problemId
2. Backend maps language to Judge0 language ID (C=50, C++=53, Java=62, Python=71, JS=63)
3. Creates submission batch on Judge0 with hidden test cases
4. Polls for results using tokens
5. Calculates: testCasesPassed, runtime, memory, status
6. Saves submission record to MongoDB
7. If all test cases pass → adds problem to user's `problemSolved` array

---

### Payment Routes (`/payment`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/payment/create-order` | ✅ User | Creates a Razorpay order for a token plan. Returns `razorpayOrderId`, `amount`, `currency`. |
| `POST` | `/payment/verify-user-payment` | ✅ User | Verifies Razorpay payment signature. Credits tokens to user. Sends plan activation email. |
| `POST` | `/payment/verify-payment` | ❌ | Razorpay webhook endpoint for server-side payment confirmation. |

---

### Plan Routes (`/plan`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/plan/all` | ❌ | Get all available token plans (name, price, tokens, bonusTokens). |

---

### Chat Routes (`/chat`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/chat/coding` | ✅ User | DSA Tutor AI. Sends problem context + user code + question to Gemini. Deducts 20 tokens. |
| `POST` | `/chat/website` | ✅ User | Platform Support AI. Answers questions about CodePrep. Has function-calling for live user stats. Deducts 20 tokens. |

---

### Discussion Routes (`/discussion`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/discussion/messages/:roomId` | ✅ User | Get message history for a discussion room. |

---

### Video Routes (`/video`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/video/upload` | ✅ Admin | Upload a video solution to Cloudinary for a problem. |

---

## How Redis Works

Redis is used exclusively for **JWT token blacklisting** to support secure logout.

```
┌─────────────┐        ┌─────────────┐        ┌──────────────┐
│   Client     │──JWT──→│  Middleware  │──check─→│    Redis     │
│  (Cookie)    │        │  userMiddle  │         │   Cloud      │
└─────────────┘        │  ware.js     │         │              │
                       │              │         │ Key: token:xx│
                       │ 1. Verify JWT│         │ Val: "blocked"│
                       │ 2. Check     │←─────── │ TTL: jwt exp │
                       │    Redis     │         └──────────────┘
                       │ 3. If blocked│
                       │    → 401     │
                       └──────────────┘
```

**How it works:**
1. **Login:** JWT is created with 1-hour expiry and set as an HTTP-only cookie.
2. **Each Request:** `userMiddleware.js` verifies the JWT signature, then checks Redis: `EXISTS token:<jwt_string>`. If the key exists, the token is blocked → 401 response.
3. **Logout:** The JWT is added to Redis: `SET token:<jwt_string> "blocked"` with TTL = remaining JWT expiry time. This prevents the token from being reused.

**Config:** `config/redis.js`
```javascript
const redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});
```

---

## How Judge0 Works

Judge0 is a code execution engine accessed via **RapidAPI**. It compiles and runs user-submitted code against test cases.

```
┌──────────┐     ┌───────────┐     ┌───────────┐     ┌──────────┐
│  User    │────→│  Backend  │────→│  Judge0   │────→│  Result  │
│  Code    │     │  Service  │     │  (Rapid   │     │  Status  │
│  + Lang  │     │           │     │   API)    │     │  3=Pass  │
│  + Input │     │ submitBatch│     │           │     │  4=WA    │
└──────────┘     └───────────┘     └───────────┘     │  5=TLE   │
                                                      │  6=CE    │
                                                      └──────────┘
```

**Supported Languages:**

| Language | Judge0 ID |
|----------|-----------|
| C | 50 |
| C++ | 53 |
| Java | 62 |
| Python | 71 |
| JavaScript | 63 |

**Flow (`problemSubmissionUtility.js`):**

1. **`submitBatch(submissions)`** — Sends a POST to `judge029.p.rapidapi.com/submissions/batch?base64_encoded=false&wait=true` with an array of `{ source_code, language_id, stdin, expected_output }`.
2. If `wait=true` works → results are returned immediately.
3. If not → **`submitToken(resultTokens)`** polls `GET /submissions/batch?tokens=...` every 1 second until all submissions have `status.id > 2` (meaning they're done processing).
4. Results are mapped to status codes: `3 = Accepted`, `4 = Wrong Answer`, `5 = TLE`, `6 = Compilation Error`, `>6 = Runtime Error`.

---

## How Nodemailer (Email) Works

The email system uses **Nodemailer** with Gmail SMTP to send two types of emails:

### 1. Password Reset Email (`sendResetPasswordEmail`)

**Trigger:** `POST /user/forgot-password`

**Flow:**
1. User provides their email
2. Backend generates a 32-byte hex token using `crypto.randomBytes(32)`
3. Token is hashed with SHA-256 and saved to the user's `resetPasswordToken` field
4. Expiry is set to `Date.now() + 15 minutes`
5. A styled HTML email is sent with a "Reset Password" button linking to `http://localhost:5173/reset-password/<raw_token>`
6. When user clicks the link and submits a new password, the raw token is re-hashed and compared with the stored hash

### 2. Plan Activation Email (`sendPlanActivationEmail`)

**Trigger:** After successful Razorpay payment verification

**Flow:**
1. Payment is verified via Razorpay signature
2. Tokens are credited to the user's account
3. A styled HTML email is sent with plan details: plan name, base tokens, bonus tokens, total balance, amount paid, and activation timestamp

**Config:** `utils/emailService.js`
```javascript
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,  // Gmail address
        pass: process.env.EMAIL_PASS   // Gmail App Password
    }
});
```

---

## How Razorpay (Payment) Works

```
┌──────────┐     ┌───────────┐     ┌───────────┐     ┌──────────┐
│ Frontend │────→│  Backend  │────→│  Razorpay │────→│  Order   │
│  Plans   │     │  create-  │     │  API      │     │  Created │
│  Page    │     │  order    │     │           │     │          │
└──────────┘     └───────────┘     └───────────┘     └──────────┘
      │                                                     │
      │◄────────────── razorpayOrderId ────────────────────┘
      │
      ▼
┌──────────┐     ┌───────────┐     ┌───────────┐
│ Razorpay │────→│  Backend  │────→│  User     │
│ Checkout │     │  verify-  │     │  tokens   │
│ Modal    │     │  payment  │     │  updated  │
└──────────┘     └───────────┘     │  + email  │
                                   └───────────┘
```

**Step-by-step:**
1. User clicks "Buy Plan" → Frontend calls `POST /payment/create-order` with `{ planId }`
2. Backend creates a Razorpay order via `razorpay.orders.create()`, saves to `Order` collection
3. Frontend receives `razorpayOrderId` and opens Razorpay checkout modal
4. User completes payment (UPI, card, etc.)
5. Frontend calls `POST /payment/verify-user-payment` with `{ razorpay_order_id, razorpay_payment_id, razorpay_signature }`
6. Backend verifies HMAC-SHA256 signature: `createHmac('sha256', RAZORPAY_KEY_SECRET).update(order_id + '|' + payment_id)`
7. If valid → updates order status to "success", credits `plan.tokens + plan.bonusTokens` to user
8. Sends a plan activation email with all details

---

## How Socket.io (Real-Time Chat) Works

Socket.io powers the **Discussions** feature — real-time public chat rooms per problem.

```
┌──────────┐                                ┌──────────┐
│  User A  │──── socket.emit("sendMessage")─→│  Server  │
│          │◄── socket.on("newMessage") ─────│          │
└──────────┘                                │          │
                                            │  io.to   │
┌──────────┐                                │ (roomId) │
│  User B  │◄── socket.on("newMessage") ─────│  .emit   │
└──────────┘                                └──────────┘
```

**Authentication:** Socket.io middleware extracts JWT from `socket.handshake.auth.token`, verifies it, and attaches `socket.user`.

**Room System:**
- Each problem gets a base room ID (e.g., `problem-123`)
- Sub-rooms are created dynamically with max 50 users each (e.g., `problem-123-Room-1`, `problem-123-Room-2`)
- Room stats are tracked in `ChatRoomStats` MongoDB collection

**Events:**

| Event | Direction | Description |
|-------|-----------|-------------|
| `join_problem_room` | Client → Server | Join a problem discussion room (requires 20+ tokens) |
| `join_dm` | Client → Server | Join a direct message room (sorted user IDs) |
| `sendMessage` | Client → Server | Send a message (deducts 2 tokens). Broadcasts to room. |
| `newMessage` | Server → Client | Broadcast new message to all room members |

**AI Integration:** If a message contains `**@CodeBot**`, the server calls Gemini AI and broadcasts the AI response as a system message.

---

## How Gemini AI Chatbot Works

There are **two AI chatbots** powered by Google Gemini 2.5 Flash:

### 1. DSA Tutor (`/chat/coding`)

**Location:** Inside the Code Editor page (right panel)

**Features:**
- Receives full context: problem title, description, user's current code, language
- Defaults to giving **hints** (not full solutions) unless explicitly asked
- Refuses off-topic questions
- Deducts **20 tokens** per query

### 2. Platform Support (`/chat/website`)

**Location:** Floating chatbot (bottom-right of every page)

**Features:**
- Answers questions about the CodePrep platform
- Uses **Gemini Function Calling** to fetch live user data:
  - `getUserStats()` → Returns user's solved count, email, role
  - `getRecentSubmissions()` → Returns last 5 submissions with problem titles
- Deducts **20 tokens** per query
- Token check on frontend prevents API calls when tokens < 20

---

## Frontend — Detailed Page Documentation

### Pages

| Page | Route | Auth | Description |
|------|-------|------|-------------|
| **Home** | `/` | ✅ | Problem listing with sidebar filters (difficulty, tags, status), search, pagination. Shows "Problem of the Day". |
| **Login** | `/login` | ❌ | Email/password login with Zod validation. "Forgot Password" link. |
| **Signup** | `/signup` | ❌ | Registration with name, email, password + confirm. Zod schema validation. |
| **Dashboard** | `/dashboard` | ✅ | User stats: solved count, rank, points, acceptance rate, streak, language pie chart, activity heatmap (365 days). |
| **Code Editor** | `/problems/:id` | ✅ | Monaco editor with language selector, visible test case runner (Run), hidden test case submitter (Submit), AI Tutor panel. |
| **Admin Panel** | `/admin` | ✅ Admin | CRUD for problems with pagination. Create problems with multiple languages, test cases, and reference solutions. |
| **Plans** | `/plans` | ✅ | Token purchase page. Shows plan cards with Razorpay checkout integration. |
| **Discussions** | `/discussions` | ✅ | Real-time chat rooms per problem via Socket.io. @CodeBot for AI responses. |
| **Forgot Password** | `/forgot-password` | ❌ | Email input form. Sends reset link email. |
| **Reset Password** | `/reset-password/:token` | ❌ | New password + confirm form. Auto-redirects to login on success. |

---

## How Redux Works

Redux Toolkit manages global authentication state across the entire frontend.

**Store:** `app/store.js`

```javascript
export default configureStore({
    reducer: {
        auth: authReducer    // Auth slice
    }
});
```

**Auth Slice (`authSlice.js`):**

| Thunk | API Call | Action |
|-------|---------|--------|
| `registerUser` | `POST /user/register` | Sets user + isAuthenticated |
| `loginUser` | `POST /user/login` | Sets user + isAuthenticated |
| `checkAuthStatus` | `GET /user/check` | Restores session on page refresh |
| `logoutUser` | `POST /user/logout` | Clears user, sets isAuthenticated=false |

**State Shape:**
```javascript
{
    user: { firstName, emailId, role, tokens, problemSolved },
    loading: true/false,
    error: null | "Error message",
    isAuthenticated: true/false,
    problemSolved: []
}
```

**Flow on App Load:**
1. `App.jsx` dispatches `checkAuthStatus()` on mount
2. Frontend sends `GET /user/check` with cookie
3. Backend middleware verifies JWT + Redis blacklist check
4. If valid → returns user data → Redux sets `isAuthenticated: true`
5. If invalid → Redux sets `isAuthenticated: false` → redirected to `/login`

**Reducers:**
- `setLoading(state, action)` — Manual loading control
- `updateUserTokens(state, action)` — Updates `user.tokens` locally after AI chat or purchase

---

## Database Models

### User (`models/user.js`)
```javascript
{
    firstName: String,          // Required
    emailId: String,            // Required, unique
    password: String,           // Bcrypt hashed
    role: String,               // "user" | "admin"
    tokens: Number,             // AI/chat tokens (default: 100)
    problemSolved: [ObjectId],  // References to Problem model
    resetPasswordToken: String, // SHA-256 hashed reset token
    resetPasswordExpires: Date  // Token expiry timestamp
}
```

### Problem (`models/problem.js`)
```javascript
{
    title: String,
    description: String,
    difficulty: "easy" | "medium" | "hard",
    tags: [String],
    visibleTestCases: [{ input, output, explanation }],
    hiddenTestCases: [{ input, output }],
    startCode: [{ language, initialCode }],
    referenceSolution: [{ language, completeCode }],
    videoUrl: String,
    problemCreator: ObjectId    // Reference to User
}
```

### Submission (`models/submission.js`)
```javascript
{
    userId: ObjectId,
    problemId: ObjectId,
    code: String,
    language: String,
    status: "pending" | "accepted" | "Wrong Answer" | "TLE" | "CE" | "Runtime Error",
    testCasesPassed: Number,
    testCasesTotal: Number,
    runtime: String,
    memory: Number,
    errorMessage: String
}
```

### Order (`models/Order.js`)
```javascript
{
    user: ObjectId,
    plan: ObjectId,
    amount: Number,
    tokens: Number,
    status: "pending" | "success" | "failed",
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String
}
```

### Plan (`models/plan.js`)
```javascript
{
    name: String,       // e.g., "Pro Plan"
    price: Number,      // e.g., 499 (INR)
    tokens: Number,     // e.g., 500
    bonusTokens: Number // e.g., 100
}
```

### ChatMessage (`models/ChatMessage.js`)
```javascript
{
    senderId: ObjectId,  // Reference to User
    roomId: String,      // e.g., "problem-123-Room-1"
    content: String,
    createdAt: Date
}
```

### ChatRoomStats (`models/ChatRoomStats.js`)
```javascript
{
    baseRoomId: String,
    activeSubRooms: [{
        subRoomId: String,
        activeCount: Number
    }]
}
```

---

## License

This project is for educational and portfolio purpose.
