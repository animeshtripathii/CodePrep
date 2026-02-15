import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { checkAuthStatus} from "./app/features/auth/authSlice.js"


// --- Main App Component ---
const App = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, loading } = useSelector((state) => state.auth)

  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [dispatch])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen w-full'>
        <div className='w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  // 2. Routing Logic
  return (
    <Routes>
      <Route 
        path='/' 
        element={isAuthenticated ? <Home /> : <Navigate to="/login" />} 
      />
      <Route 
        path='/login' 
        element={!isAuthenticated ? <Login /> : <Navigate to="/" />} 
      />
      <Route 
        path='/signup' 
        element={!isAuthenticated ? <Signup /> : <Navigate to="/" />} 
      />
    </Routes>
  )
}

export default App