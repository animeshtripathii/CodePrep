# CodePrep 🚀

A high-performance online judge and competitive programming platform designed for coding enthusiasts and competitive programmers.


## 🎯 About

CodePrep is an online judge platform that allows users to practice competitive programming problems, submit solutions, and get instant feedback on their code. Built with performance and scalability in mind, it provides a seamless experience for both learners and experienced programmers.

## ✨ Features

- 🔐 **User Authentication** - Secure authentication system with JWT tokens and bcrypt password hashing
- 💻 **Code Submission** - Submit solutions in multiple programming languages
- ⚡ **Real-time Judging** - Fast and efficient code evaluation
- 📊 **Problem Management** - Comprehensive problem library with varying difficulty levels
- 🏆 **Leaderboards** - Track your progress and compete with others
- 🔄 **Session Management** - Redis-based session handling for optimal performance
- 📈 **Performance Tracking** - Monitor your coding journey with detailed statistics

## 🛠️ Tech Stack

### Backend
- **Node.js** with **Express.js** - Fast and minimalist web framework
- **MongoDB** with **Mongoose** - Database for storing problems, submissions, and user data
- **Redis** - Caching and session management
- **JWT** - Secure authentication
- **Bcrypt** - Password hashing and security

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm or yarn
- MongoDB
- Redis

### Installation

1. Clone the repository:
```bash
git clone https://github.com/animeshtripathii/CodePrep.git
cd CodePrep
```

2. Install backend dependencies:
```bash
cd Backend
npm install
```

### Configuration

Create a `.env` file in the `Backend` directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017

# Redis
REDIS_HOST=localhost
REDIS_PORT=000

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Cookie
COOKIE_SECRET=your_cookie_secret_here
```

## 📁 Project Structure

```
CodePrep/
├── Backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── utils/          # Helper functions
│   │   └── config/         # Configuration files
│   ├── package.json
│   └── .gitignore
└── README.md
```

## 💡 Usage

### Development

Start the backend server in development mode:

```bash
cd Backend
npm run dev
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Production

For production deployment:

```bash
npm start
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Animesh Tripathi** - [@animeshtripathii](https://github.com/animeshtripathii)

## 🙏 Acknowledgments

- Thanks to all contributors who help improve this project
- Inspired by popular online judge platforms like Codeforces, LeetCode, and HackerRank

---

⭐ Star this repository if you find it helpful!
