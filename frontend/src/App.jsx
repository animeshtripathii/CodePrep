import React, { useEffect, lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { checkAuthStatus} from "./app/features/auth/authSlice.js"
import { PROFESSIONAL_ALERT_EVENT } from './utils/professionalAlerts'

const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const Admin = lazy(() => import('./pages/AdminPanel'))
const Explore = lazy(() => import('./pages/Explore'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const CodeEditorPage = lazy(() => import('./pages/CodeEditorPage'))
const MockInterviewPage = lazy(() => import('./pages/MockInterviewPage'))
const MockInterviewSetup = lazy(() => import('./pages/MockInterviewSetup'))
const TimedSessionPage = lazy(() => import('./pages/TimedSessionPage'))
const FloatingChatbot = lazy(() => import('./components/FloatingChatbot'))
const Navbar = lazy(() => import('./components/Navbar'))
const Plans = lazy(() => import('./pages/Plans'))
const DiscussionsPage = lazy(() => import('./pages/DiscussionsPage'))
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ContactUsPage = lazy(() => import('./pages/ContactUsPage'))

const RouteLoader = () => (
  <div className='flex items-center justify-center h-screen w-full'>
    <div className='w-12 h-12 border-4 border-gray-300 border-t-transparent rounded-full animate-spin'></div>
  </div>
)

const ProfessionalAlertModal = ({ open, title, message, onClose }) => {
  if (!open) return null

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-[2px] p-4'>
      <div className='w-full max-w-md rounded-2xl border border-white/20 bg-[#0b1220] p-6 shadow-2xl'>
        <div className='flex items-start gap-3'>
          <div className='mt-0.5 h-9 w-9 shrink-0 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center'>
            <span className='material-symbols-outlined text-[18px]'>info</span>
          </div>
          <div>
            <h3 className='text-white text-lg font-semibold'>{title}</h3>
            <p className='text-slate-300 text-sm mt-2 leading-relaxed'>{message}</p>
          </div>
        </div>

        <div className='mt-6 flex justify-end'>
          <button
            type='button'
            onClick={onClose}
            className='rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-cyan-400 transition-colors'
          >
            Okay
          </button>
        </div>
      </div>
    </div>
  )
}

const App = () => {
  const dispatch = useDispatch()
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth)
  const location = useLocation()
  const [professionalAlert, setProfessionalAlert] = React.useState({
    open: false,
    title: '',
    message: ''
  })

  useEffect(() => {
    dispatch(checkAuthStatus())
  }, [dispatch])

  useEffect(() => {
    const onProfessionalAlert = (event) => {
      const detail = event?.detail || {}
      setProfessionalAlert({
        open: true,
        title: detail.title || 'Heads Up',
        message: detail.message || 'Please try again shortly.'
      })
    }

    window.addEventListener(PROFESSIONAL_ALERT_EVENT, onProfessionalAlert)
    return () => {
      window.removeEventListener(PROFESSIONAL_ALERT_EVENT, onProfessionalAlert)
    }
  }, [])

  if (loading) {
    return (
      <div className='flex items-center justify-center h-screen w-full'>
        <div className='w-16 h-16 border-4 border-gray-300 border-t-transparent rounded-full animate-spin'></div>
      </div>
    )
  }

  // Hide Floating Chatbot on the Code Editor page (both /editor/:id and /problems/:id)
  const isCompilerPage = location.pathname.startsWith('/editor') || location.pathname.startsWith('/problems')||location.pathname.startsWith('/discussions')||location.pathname.startsWith('/mock-interview')||location.pathname.startsWith('/mock-interview-setup')||location.pathname.startsWith('/timed-session');
  const showGlobalNavbar = isAuthenticated && location.pathname !== '/';
  const authRedirectState = { from: location };
  const renderLazy = (element) => <Suspense fallback={<RouteLoader />}>{element}</Suspense>;
  const requireAuth = (element) => (isAuthenticated ? renderLazy(element) : <Navigate to="/login" state={authRedirectState} replace />);
  const loginRedirectPath = location.state?.from
    ? `${location.state.from.pathname || ''}${location.state.from.search || ''}${location.state.from.hash || ''}`
    : '/';

  // 2. Routing Logic
  return (
    <>
      {showGlobalNavbar && renderLazy(<Navbar />)}
      <Routes>
        <Route path='/explore' element={requireAuth(<Explore />)} />
        <Route 
          path='/' 
          element={renderLazy(<Home />)} 
        />
        <Route 
          path='/dashboard' 
          element={requireAuth(<Dashboard />)} 
        />
        <Route 
          path='/login' 
          element={!isAuthenticated ? renderLazy(<Login />) : <Navigate to={loginRedirectPath} replace />} 
        />
        <Route 
          path='/signup' 
          element={!isAuthenticated ? renderLazy(<Signup />) : <Navigate to="/" />} 
        />
        <Route path="/admin" element={isAuthenticated&& user?.role==="admin" ? renderLazy(<Admin />) : <Navigate to="/login" state={authRedirectState} replace />} />
        <Route path="/editor/:id" element={requireAuth(<CodeEditorPage />)} />
        <Route path="/problems/:id" element={requireAuth(<CodeEditorPage />)} />
        <Route path="/mock-interview-setup" element={requireAuth(<MockInterviewSetup />)} />
        <Route path="/mock-interview/:id" element={requireAuth(<MockInterviewPage />)} />
        <Route path="/timed-session" element={requireAuth(<TimedSessionPage />)} />
        <Route path="/plans" element={requireAuth(<Plans />)} />
        <Route path="/discussions" element={requireAuth(<DiscussionsPage />)} />
        <Route path="/settings" element={requireAuth(<SettingsPage />)} />
        <Route path="/contact" element={renderLazy(<ContactUsPage />)} />
        <Route path="/forgot-password" element={!isAuthenticated ? renderLazy(<ForgotPasswordPage />) : <Navigate to="/" />} />
        <Route path="/reset-password/:token" element={!isAuthenticated ? renderLazy(<ResetPasswordPage />) : <Navigate to="/" />} />
      </Routes>
      {isAuthenticated && !isCompilerPage && renderLazy(<FloatingChatbot />)}
      <ProfessionalAlertModal
        open={professionalAlert.open}
        title={professionalAlert.title}
        message={professionalAlert.message}
        onClose={() => setProfessionalAlert({ open: false, title: '', message: '' })}
      />
    </>
  )
}

export default App