import { createContext, useState, useContext, useEffect } from 'react'
import { authAPI } from '../services/api'
import { toast } from 'react-toastify'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      // Check if the user was previously logged in and has a token
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
      const token = localStorage.getItem('authToken')

      if (!isLoggedIn || !token) {
        console.log('No login state or token found in localStorage')
        setUser(null)
        setLoading(false)
        return
      }

      try {
        console.log('Checking if user is logged in...')
        const res = await authAPI.getProfile()
        console.log('User is logged in:', res.data)
        setUser(res.data)
      } catch (error) {
        console.log('User is not logged in or session expired')
        // Clear any stale login state
        localStorage.removeItem('isLoggedIn')
        localStorage.removeItem('authToken')
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkLoggedIn()

    // Set up inactivity timer for auto logout (2 hours - less than JWT expiration)
    let inactivityTimer

    const resetTimer = () => {
      clearTimeout(inactivityTimer)
      inactivityTimer = setTimeout(() => {
        logout()
        toast.info('You have been logged out due to inactivity')
      }, 2 * 60 * 60 * 1000) // 2 hours
    }

    // Only set up the timer if the user is logged in
    if (user) {
      resetTimer()

      // Reset timer on user activity
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart']

      events.forEach(event => {
        document.addEventListener(event, resetTimer)
      })

      // Clean up
      return () => {
        clearTimeout(inactivityTimer)
        events.forEach(event => {
          document.removeEventListener(event, resetTimer)
        })
      }
    }
  }, [user]) // Re-run when user state changes

  // Login
  const login = async (email, password) => {
    try {
      console.log(`Attempting to login with email: ${email}`)
      const res = await authAPI.login({ email, password })
      console.log('Login successful, user data:', res.data)

      // Store user in state
      setUser(res.data)

      // Store token and login flag in localStorage
      if (res.data.token) {
        localStorage.setItem('authToken', res.data.token)
      }
      localStorage.setItem('isLoggedIn', 'true')

      return res.data
    } catch (error) {
      console.error('Login error:', error)
      console.error('Response data:', error.response?.data)

      // Clear any stale login state
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('authToken')
      setUser(null)

      throw new Error(
        error.response?.data?.message || 'Invalid email or password'
      )
    }
  }

  // Logout
  const logout = async () => {
    try {
      console.log('Logging out...')
      await authAPI.logout()

      // Clear user state
      setUser(null)

      // Remove all auth data
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('authToken')

      console.log('Logout successful')
    } catch (error) {
      console.error('Logout error:', error)

      // Even if the API call fails, clear the local state
      setUser(null)
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('authToken')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
