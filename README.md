# CodePrep 

## Overview
CodePrep is a full-stack project designed to facilitate coding practice, problem submission, and real-time chat. It consists of a Node.js/Express backend and a React frontend, using Zod for form validation and Redux Toolkit for state management.

---

## Backend Structure
Located in `Backend/src/`, the backend is built with Express and organizes its code as follows:

### Routes
- **authRoutes.js**: Handles authentication (login, signup, JWT verification).
- **chatRoute.js**: Manages chat endpoints for real-time messaging.
- **problemRoutes.js**: CRUD operations for coding problems.
- **submissionRoutes.js**: Handles problem submissions and their evaluation.

### Controllers
- **authController.js**: Logic for user authentication and token management.
- **chatController.js**: Chat message handling and retrieval.
- **problemController.js**: Problem creation, update, delete, and fetch.
- **submissionController.js**: Submission processing and result generation.

### Middleware
- **adminMiddleware.js**: Restricts access to admin-only routes.
- **userMiddleware.js**: Ensures user authentication for protected routes.

### Models
- **user.js**: User schema and methods.
- **problem.js**: Coding problem schema.
- **submission.js**: Submission schema and evaluation logic.

### Services
- **authService.js**: Business logic for authentication.
- **chatService.js**: Chat operations and message storage.
- **problemService.js**: Problem management logic.
- **submissionService.js**: Submission evaluation and result calculation.

### Utilities
- **problemSubmissionUtility.js**: Helper functions for submission processing.
- **validator.js**: Input validation utilities.

### Config
- **db.js**: Database connection setup.
- **redis.js**: Redis configuration for caching and sessions.

---

## Frontend Structure
Located in `frontend/src/`, the frontend is built with React, Vite, and Redux Toolkit. Zod is used for robust form validation.

### Pages
- **AdminPanel.jsx**: Admin dashboard for managing problems and users.
- **CodeEditorPage.jsx**: Interactive code editor for solving problems.
- **Dashboard.jsx**: User dashboard showing progress and submissions.
- **Home.jsx**: Landing page.
- **Login.jsx**: User login form (validated with Zod).
- **Signup.jsx**: User registration form (validated with Zod).

### Components
- **Navbar.jsx**: Navigation bar.
- **Footer.jsx**: Footer section.
- **FloatingChatbot.jsx**: Real-time chat widget.
- **DeleteProblem.jsx**: Admin tool for deleting problems.
- **UpdateProblem.jsx**: Admin tool for updating problems.

### State Management
- **app/store.js**: Redux store setup.
- **features/auth/authSlice.js**: Authentication state and actions.

### Utilities
- **axiosClient.js**: Axios instance for API requests.

### Form Validation
All forms (login, signup, problem submission) use Zod schemas for validation, ensuring data integrity and user feedback.

---

## API & Middleware Details
- **Authentication**: JWT-based, enforced via middleware.
- **Admin Routes**: Protected by `adminMiddleware`.
- **User Routes**: Protected by `userMiddleware`.
- **Problem & Submission Models**: Define structure for coding problems and user submissions.
- **Chat**: Real-time messaging via dedicated routes and services.

---

## Getting Started
1. **Backend**: Install dependencies (`npm install`), configure DB/Redis, run server (`node src/index.js`).
2. **Frontend**: Install dependencies (`npm install`), run dev server (`npm run dev`).

---

## Technologies Used
- **Backend**: Node.js, Express, MongoDB, Redis
- **Frontend**: React, Vite, Redux Toolkit, Zod

---

## Contribution & License
Feel free to contribute via pull requests. See LICENSE for details.

---

## Contact
For support or questions, open an issue or contact the maintainer.

