import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Admin from './pages/AdminPanel'
import Dashboard from './pages/Dashboard'
import { checkAuthStatus } from "./app/features/auth/authSlice.js"
import CodeEditorPage from './pages/CodeEditorPage'
import FloatingChatbot from './components/FloatingChatbot'
import Plans from './pages/Plans'
import DiscussionsPage from './pages/DiscussionsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import InterviewPage from './pages/InterviewPage'
import MockInterviewPage from './pages/MockInterviewPage'
import PeerInterviewPage from './pages/PeerInterviewPage'
import LandingPage from './pages/LandingPage'

const App = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)
  const location = useLocation()

  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', background: '#000000' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid #FF4F00', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: '#8A8B91', fontSize: '13px', fontFamily: 'Inter, sans-serif' }}>Loading CodePrep…</span>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const isFullscreenPage = location.pathname.startsWith('/editor')
    || location.pathname.startsWith('/problems')
    || location.pathname.startsWith('/discussions')
    || location.pathname.startsWith('/interview/ai')
    || location.pathname.startsWith('/interview/peer');

  return (
    <>
      <Routes>
        <Route path='/' element={isAuthenticated ? <Home /> : <LandingPage />} />
        <Route path='/dashboard' element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path='/login' element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path='/signup' element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} />
        <Route path="/admin" element={isAuthenticated && user?.role === "admin" ? <Admin /> : <Navigate to="/login" />} />
        <Route path="/editor/:id" element={isAuthenticated ? <CodeEditorPage /> : <Navigate to="/login" />} />
        <Route path="/problems/:id" element={isAuthenticated ? <CodeEditorPage /> : <Navigate to="/login" />} />
        <Route path="/plans" element={isAuthenticated ? <Plans /> : <Navigate to="/login" />} />
        <Route path="/discussions" element={isAuthenticated ? <DiscussionsPage /> : <Navigate to="/login" />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/" />} />
        <Route path="/reset-password/:token" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/" />} />
        {/* New Interview Routes */}
        <Route path="/interview" element={isAuthenticated ? <InterviewPage /> : <Navigate to="/login" />} />
        <Route path="/interview/ai" element={isAuthenticated ? <MockInterviewPage /> : <Navigate to="/login" />} />
        <Route path="/interview/peer" element={isAuthenticated ? <PeerInterviewPage /> : <Navigate to="/login" />} />
      </Routes>
      {isAuthenticated && !isFullscreenPage && <FloatingChatbot />}
    </>
  )
}

export default App