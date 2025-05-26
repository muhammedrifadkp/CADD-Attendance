import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-toastify'
import { EyeIcon, EyeSlashIcon, UserIcon, LockClosedIcon, AcademicCapIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'
import BackButton from '../../components/BackButton'

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loginType, setLoginType] = useState('teacher') // 'teacher' or 'admin'
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleLoginTypeSwitch = (type) => {
    setLoginType(type)
    setFormData({ email: '', password: '' }) // Clear form when switching
    setShowPassword(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('Login form submitted with:', formData)
      const user = await login(formData.email, formData.password)
      console.log('Login successful, user:', user)
      toast.success(`Welcome back, ${user.name}!`)

      // Redirect based on role
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (error) {
      console.error('Login error in component:', error)
      toast.error(error.message || 'Login failed. Please check your credentials.')

      // Display the exact credentials being used for debugging
      console.log('Attempted login with:')
      console.log('Email:', formData.email)
      console.log('Password:', formData.password)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Login Type Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${loginType === 'teacher'
          ? 'bg-gradient-to-r from-blue-500 to-blue-600'
          : 'bg-gradient-to-r from-red-500 to-red-600'
          }`}>
          {loginType === 'teacher' ? (
            <AcademicCapIcon className="h-8 w-8 text-white" />
          ) : (
            <ShieldCheckIcon className="h-8 w-8 text-white" />
          )}
        </div>
        <h3 className={`text-xl font-semibold mb-2 ${loginType === 'teacher' ? 'text-blue-700' : 'text-red-700'
          }`}>
          {loginType === 'teacher' ? 'Teacher Login' : 'Admin Login'}
        </h3>
        <p className="text-gray-600 text-sm">
          {loginType === 'teacher'
            ? 'Access your teaching dashboard'
            : 'Administrative access only'
          }
        </p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Email Field */}
          <div>
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="form-input pl-10"
                placeholder={`Enter your ${loginType} email`}
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <LockClosedIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                className="form-input pl-10 pr-10"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className={`w-full relative overflow-hidden py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 ${loginType === 'teacher'
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-blue-300'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:ring-red-300'
              } ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing in...
              </div>
            ) : (
              `Sign In as ${loginType === 'teacher' ? 'Teacher' : 'Admin'}`
            )}
          </button>
        </div>
      </form>

      {/* Login Type Switcher */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-sm text-gray-600 mb-3">
          {loginType === 'teacher' ? 'Need administrative access?' : 'Are you a teacher?'}
        </p>
        <button
          type="button"
          onClick={() => handleLoginTypeSwitch(loginType === 'teacher' ? 'admin' : 'teacher')}
          className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 ${loginType === 'teacher'
            ? 'text-red-600 bg-red-50 hover:bg-red-100 border border-red-200'
            : 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200'
            }`}
        >
          {loginType === 'teacher' ? (
            <>
              <ShieldCheckIcon className="h-4 w-4 mr-2" />
              Admin Login
            </>
          ) : (
            <>
              <AcademicCapIcon className="h-4 w-4 mr-2" />
              Teacher Login
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default Login
