import React, { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Admin from './pages/AdminPanel'
import Dashboard from './pages/Dashboard'
import { checkAuthStatus} from "./app/features/auth/authSlice.js"
import CodeEditorPage from './pages/CodeEditorPage'
import FloatingChatbot from './components/FloatingChatbot'
import Plans from './pages/Plans'
import DiscussionsPage from './pages/DiscussionsPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'

const App = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)
  const location = useLocation()

  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen w-full'>
        <div className='w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  // Hide Floating Chatbot on the Code Editor page (both /editor/:id and /problems/:id)
  const isCompilerPage = location.pathname.startsWith('/editor') || location.pathname.startsWith('/problems')||location.pathname.startsWith('/discussions');

  // 2. Routing Logic
  return (
    <>
      <Routes>
        <Route 
          path='/' 
          element={isAuthenticated ? <Home /> : <Navigate to="/login" />} 
        />
        <Route 
          path='/dashboard' 
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} 
        />
        <Route 
          path='/login' 
          element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path='/signup' 
          element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} 
        />
        <Route path="/admin" element={isAuthenticated&& user?.role==="admin" ?<Admin/>: <Navigate to="/login" />} />
        <Route path="/editor/:id" element={ isAuthenticated ? <CodeEditorPage /> : <Navigate to="/login" />} />
        <Route path="/problems/:id" element={ isAuthenticated ? <CodeEditorPage /> : <Navigate to="/login" />} />
        <Route path="/plans" element={isAuthenticated ? <Plans /> : <Navigate to="/login" />} />
        <Route path="/discussions" element={isAuthenticated ? <DiscussionsPage /> : <Navigate to="/login" />} />
        <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to="/" />} />
        <Route path="/reset-password/:token" element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to="/" />} />
      </Routes>
      {isAuthenticated && !isCompilerPage && <FloatingChatbot />}
    </>
  )
}

export default App