import { createContext, useState, useContext, useEffect } from 'react'
import { authAPI, getToken, setToken, removeToken } from '../services/api'
import { toast } from 'react-toastify'
import { offlineService } from '../services/offlineService'
import { dataPreloader } from '../services/dataPreloader'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in
  useEffect(() => {
    const checkLoggedIn = async () => {
      // Check if the user was previously logged in and has a valid token
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
      const token = getToken()

      if (!isLoggedIn || !token) {
        console.log('No login state or valid token found')
        setUser(null)
        setLoading(false)
        return
      }

      try {
        console.log('Checking if user is logged in...')

        // If offline, try to get user data from local storage
        if (!navigator.onLine) {
          console.log('Offline: Checking cached user profile...')
          const cachedUser = localStorage.getItem('cachedUserProfile')
          if (cachedUser) {
            try {
              const userData = JSON.parse(cachedUser)
              console.log('Using cached user profile:', userData)
              setUser(userData)
              setLoading(false)
              return
            } catch (parseError) {
              console.error('Failed to parse cached user profile:', parseError)
            }
          }

          // If no cached user data and offline, assume logged out
          console.log('No cached user profile available offline')
          removeToken()
          setUser(null)
          setLoading(false)
          return
        }

        // Online: fetch from server
        const res = await authAPI.getProfile()
        console.log('User is logged in:', res.data)

        // Cache user profile for offline use
        localStorage.setItem('cachedUserProfile', JSON.stringify(res.data))
        setUser(res.data)

        // Trigger data preload for offline use
        dataPreloader.onUserLogin()
      } catch (error) {
        console.log('User is not logged in or session expired')

        // If offline and we have cached data, use it
        if (!navigator.onLine) {
          const cachedUser = localStorage.getItem('cachedUserProfile')
          if (cachedUser) {
            try {
              const userData = JSON.parse(cachedUser)
              console.log('Using cached user profile due to network error:', userData)
              setUser(userData)
              setLoading(false)
              return
            } catch (parseError) {
              console.error('Failed to parse cached user profile:', parseError)
            }
          }
        }

        // Clear any stale login state securely
        removeToken()
        localStorage.removeItem('cachedUserProfile')
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

      // Store token and login flag securely
      if (res.data.token) {
        setToken(res.data.token)
      }
      localStorage.setItem('isLoggedIn', 'true')

      // Cache user profile for offline use
      localStorage.setItem('cachedUserProfile', JSON.stringify(res.data))

      // Trigger data preload for offline use
      dataPreloader.onUserLogin()

      return res.data
    } catch (error) {
      console.error('Login error:', error)
      console.error('Response data:', error.response?.data)

      // Clear any stale login state securely
      removeToken()
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

      // Only try to call logout API if online
      if (navigator.onLine) {
        await authAPI.logout()
      } else {
        console.log('Offline: Skipping logout API call')
      }

      // Clear user state
      setUser(null)

      // Remove all auth data securely
      removeToken()
      localStorage.removeItem('cachedUserProfile')

      // Clear offline data if needed
      try {
        await offlineService.clearAllData()
      } catch (error) {
        console.error('Failed to clear offline data:', error)
      }

      console.log('Logout successful')
    } catch (error) {
      console.error('Logout error:', error)

      // Even if the API call fails, clear the local state
      setUser(null)
      removeToken()
      localStorage.removeItem('cachedUserProfile')
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
