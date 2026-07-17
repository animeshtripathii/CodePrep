import React, { useEffect, Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router'
import { useSelector, useDispatch } from 'react-redux'
import { checkAuthStatus } from './app/features/auth/authSlice.js'

// ─── Eager imports (critical path — first pages users land on) ──────────────
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'

// ─── Lazy imports (loaded only when the user navigates to that route) ────────
// Each lazy() call creates a separate JS chunk that is fetched on-demand.
// This removes vendor-editor, vendor-markdown, vendor-charts from the initial bundle.
const Dashboard        = lazy(() => import('./pages/Dashboard'))
const Admin            = lazy(() => import('./pages/AdminPanel'))
const CodeEditorPage   = lazy(() => import('./pages/CodeEditorPage'))
const Plans            = lazy(() => import('./pages/Plans'))
const DiscussionsPage  = lazy(() => import('./pages/DiscussionsPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage  = lazy(() => import('./pages/ResetPasswordPage'))

// FloatingChatbot uses ReactMarkdown — lazy-load it too so it doesn't
// pull in vendor-markdown on pages where the chatbot isn't open yet.
const FloatingChatbot  = lazy(() => import('./components/FloatingChatbot'))

// ─── Shared loading fallback ─────────────────────────────────────────────────
// Shown while a lazy chunk is being fetched (typically <100ms on fast networks).
const PageLoader = () => (
  <div className='flex items-center justify-center h-screen w-full'>
    <div className='w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin' />
  </div>
)

const App = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)
  const location = useLocation()

  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [])

  if (loading) return <PageLoader />

  // Hide FloatingChatbot on code editor / discussion pages
  const isCompilerPage =
    location.pathname.startsWith('/editor') ||
    location.pathname.startsWith('/problems') ||
    location.pathname.startsWith('/discussions')

  return (
    <>
      {/*
        Suspense boundary wraps all lazy routes.
        When any lazy chunk is loading, PageLoader is shown instead of a blank screen.
      */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path='/'
            element={isAuthenticated ? <Home /> : <Navigate to='/login' />}
          />
          <Route
            path='/dashboard'
            element={isAuthenticated ? <Dashboard /> : <Navigate to='/login' />}
          />
          <Route
            path='/login'
            element={!isAuthenticated ? <Login /> : <Navigate to='/' />}
          />
          <Route
            path='/signup'
            element={!isAuthenticated ? <Signup /> : <Navigate to='/' />}
          />
          <Route
            path='/admin'
            element={isAuthenticated && user?.role === 'admin' ? <Admin /> : <Navigate to='/login' />}
          />
          <Route
            path='/editor/:id'
            element={isAuthenticated ? <CodeEditorPage /> : <Navigate to='/login' />}
          />
          <Route
            path='/problems/:id'
            element={isAuthenticated ? <CodeEditorPage /> : <Navigate to='/login' />}
          />
          <Route
            path='/plans'
            element={isAuthenticated ? <Plans /> : <Navigate to='/login' />}
          />
          <Route
            path='/discussions'
            element={isAuthenticated ? <DiscussionsPage /> : <Navigate to='/login' />}
          />
          <Route
            path='/forgot-password'
            element={!isAuthenticated ? <ForgotPasswordPage /> : <Navigate to='/' />}
          />
          <Route
            path='/reset-password/:token'
            element={!isAuthenticated ? <ResetPasswordPage /> : <Navigate to='/' />}
          />
        </Routes>

        {/* FloatingChatbot is itself lazy — it won't load vendor-markdown
            until it mounts for the first time */}
        {isAuthenticated && !isCompilerPage && <FloatingChatbot />}
      </Suspense>
    </>
  )
}

export default App