# CodePrep

CodePrep is a modern, full-stack interview preparation platform designed to help developers master Data Structures and Algorithms (DSA), practice with AI or peers, and track their progress through an immersive and highly-customizable workspace.

## 🌟 Key Features & Implementation Details

### 1. **DSA Workspace & Compiler**
- **Feature:** A distraction-free workspace featuring the powerful Monaco editor with multi-language support (Python, JS, Java, C++).
- **Implementation:** The frontend integrates `@monaco-editor/react` to provide a VS-Code-like IDE experience right in the browser. When code is submitted, the Node.js backend acts as a proxy and forwards the payload to the **Judge0 API**. Judge0 securely sandbox-executes the code against hidden test cases. The response (stdout/stderr/execution time) is returned to the user in real-time.

### 2. **AI Mock Interviews (Powered by Gemini)**
- **Feature:** Context-aware AI interviewer that adapts to your uploaded resume (PDF/DOCX) and the specific role you are applying for.
- **Implementation:** Resumes are parsed on the backend using `pdf-parse` or `mammoth`. The parsed text and role context are passed to the **Google Gemini Generative AI API**. The conversation history is maintained to allow dynamic voice and text interaction. Once the interview concludes, Gemini analyzes the transcript and generates structured, actionable feedback.

### 3. **Live Peer-to-Peer Mock Interviews**
- **Feature:** Seamless video/audio calling paired with a real-time collaborative code editor and whiteboard for system design.
- **Implementation:** 
  - **Video/Audio:** Implemented using **Agora Web SDK** (`agora-rtc-sdk-ng`). The backend acts as a token server using the `agora-token` package to securely generate short-lived tokens for joining rooms.
  - **Collaboration:** Real-time character-by-character code synchronization, cursor tracking, and whiteboard drawing are powered by **Socket.io** over WebSocket connections.

### 4. **Progress Tracking & Dashboard**
- **Feature:** Visualized contribution heatmap, algorithm analytics, and global leaderboard.
- **Implementation:** User submissions are logged in **MongoDB**. The frontend fetches aggregated data using Mongoose aggregation pipelines and visualizes it dynamically using **Recharts** and **Chart.js**.

### 5. **Premium Subscriptions & Tokens**
- **Feature:** Secure checkout for up-skilling plans (Pro and Elite), unlocking tokens needed for premium queries and actions.
- **Implementation:** Real-time payment processing is achieved via **Razorpay**. Once a payment is successful, a server-side webhook verifies the `x-razorpay-signature` HMAC to prevent tampering. Token increments are processed asynchronously via **BullMQ** & **Redis** to ensure high availability. Receipts and confirmation emails are dispatched using **Brevo (Sendinblue)**.

### 6. **Cloudinary Video Solutions**
- **Feature:** Premium video explanations natively built into the problems for complex implementations.
- **Implementation:** Video solutions and thumbnails are securely uploaded, stored, and streamed via the **Cloudinary API**.

### 7. **Contact Us System**
- **Feature:** Users can send suggestions and feedback directly to developers via mail directly from the application.
- **Implementation:** A dedicated `/contact/submit` endpoint handles the contact form. It uses **Brevo API (SMTP)** to instantly relay the user's message, alongside their email and name, to the developer's verified inbox for instant feedback sorting.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS V4 + Material UI + DaisyUI
- **State Management:** Redux Toolkit
- **Real-Time Engine:** Socket.io-client
- **Video Calling:** Agora Web SDK (`agora-rtc-sdk-ng`)
- **Code Editor:** `@monaco-editor/react`
- **Charts:** Chart.js, Recharts
- **Forms:** React Hook Form + Zod

### Backend
- **Environment:** Node.js + Express
- **Database:** MongoDB (via Mongoose)
- **Caching & Queues:** Redis + BullMQ (for email delivery & token background jobs)
- **Real-Time:** Socket.io
- **Security:** Helmet, HPP, Express-Rate-Limit, Express-Mongo-Sanitize
- **Third-Party Providers:** 
  - **Judge0** (Code execution engine)
  - **Google Gemini API** (AI interactions & mock interviews)
  - **Razorpay** (Payments checkout)
  - **Cloudinary** (Media storage and delivery)
  - **Brevo** (Transactional emails, OTPs, password resets, Contact Us routing)

---

## 🚀 Installation & Setup

Want to run CodePrep locally? Follow these steps exactly:

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster URL (or local MongoDB)
- Redis server instance (local or hosted, e.g., Upstash)

### 1. Clone the Repository
```bash
git clone https://github.com/animeshtripathii/CodePrep.git
cd CodePrep
```

### 2. Set Up the Backend
```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend` directory and fill it with your credentials:
```ini
PORT=5000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Database & Cache
MONGO_URI=your_mongodb_connection_string
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password_if_any

# Security
JWT_Secret_Key=super_secret_jwt_key

# Third Party APIs
JUDGE0_API=https://judge0-ce.p.rapidapi.com
ChatBot_API=your_gemini_api_key

# Agora (Peer-to-Peer Video)
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_certificate

# Cloudinary (Media Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Payments
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# Brevo (Email Delivery)
EMAIL_USER=your_verified_sender_email
BREVO_API_KEY=your_brevo_v3_api_key
```

Start the backend server:
```bash
npm run dev
```

### 3. Set Up the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend` directory:
```ini
VITE_API_URL=http://localhost:5000
VITE_AGORA_APP_ID=your_agora_app_id
```

Start the frontend application:
```bash
npm run dev
```

### 4. Visit the Platform
Open your browser and navigate to `http://localhost:5173`. We highly recommend signing up for an account to test full capabilities!

---

## 📞 Support & Feedback
Encountered an issue or have a suggestion? Use the newly implemented **Contact Us** page directly within the app (accessible from the navigation menu). All messages drop cleanly into our developer inboxes.