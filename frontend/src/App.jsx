import React from 'react'
import {Routes,Route, Navigate } from 'react-router'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import {checkAuthStatus} from "./app/features/auth/authSlice.js"
import { useSelector, useDispatch } from 'react-redux'
import { useEffect } from 'react'

const App = () => {
  
  //code for user authentication
 const dispatch = useDispatch()
 const {isAuthenticated} = useSelector((state) => state.auth)
 
  useEffect(() => {
  dispatch(checkAuthStatus())
  }, [dispatch]) // dependency array should only include stable references like dispatch

  return (
   <Routes>
  <Route path='/' element={<Home></Home>} />
  <Route path='/login' element={!isAuthenticated ? <Login></Login> : <Navigate to="/" />} />
  <Route path='/signup' element={!isAuthenticated ? <Signup></Signup> : <Navigate to="/login" />} />
   </Routes>
  )
}

export default App
