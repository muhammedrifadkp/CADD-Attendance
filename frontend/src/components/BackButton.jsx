import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'

const BackButton = ({ customText, customPath, className = '' }) => {
  const navigate = useNavigate()
  const location = useLocation()

  // Smart back navigation that uses browser history when possible
  const getBackNavigation = () => {
    const path = location.pathname

    // Custom override if provided
    if (customText && customPath) {
      return { text: customText, path: customPath }
    }

    // Special cases where we want specific navigation instead of browser back
    const specialCases = {
      // Dashboard pages - go to login
      '/admin/dashboard': { text: 'Login', path: '/login' },
      '/teacher/dashboard': { text: 'Login', path: '/login' },

      // Login page - go to home
      '/login': { text: 'Home', path: '/' },
      '/register': { text: 'Login', path: '/login' },

      // Form pages - go to list pages (only if no history)
      '/admin/teachers/new': { text: 'Teachers', path: '/admin/teachers' },
      '/admin/students/new': { text: 'Students', path: '/admin/students' },
      '/admin/batches/new': { text: 'Batches', path: '/admin/batches' },
      '/admin/lab/pcs/new': { text: 'Lab Management', path: '/admin/lab/management' },
      '/teacher/batches/new': { text: 'Batches', path: '/teacher/batches' },
    }

    // Check if current path is a special case
    if (specialCases[path]) {
      return specialCases[path]
    }

    // Check for edit pages (dynamic routes)
    if (path.match(/^\/admin\/teachers\/[^/]+\/edit$/)) {
      return { text: 'Teacher Details', path: -1 }
    }
    if (path.match(/^\/admin\/students\/[^/]+\/edit$/)) {
      return { text: 'Student Details', path: -1 }
    }
    if (path.match(/^\/admin\/batches\/[^/]+\/edit$/)) {
      return { text: 'Batch Details', path: -1 }
    }
    if (path.match(/^\/admin\/lab\/pcs\/[^/]+\/edit$/)) {
      return { text: 'PC Details', path: -1 }
    }

    // Check for detail pages (dynamic routes)
    if (path.match(/^\/admin\/teachers\/[^/]+$/)) {
      return { text: 'Teachers', path: -1 }
    }
    if (path.match(/^\/admin\/students\/[^/]+$/)) {
      return { text: 'Students', path: -1 }
    }
    if (path.match(/^\/admin\/batches\/[^/]+$/)) {
      return { text: 'Batches', path: -1 }
    }

    // For all other pages, use browser history
    return { text: 'Back', path: -1 }
  }

  const handleBack = () => {
    const { path } = getBackNavigation()

    if (path === -1) {
      // Check if there's history to go back to
      if (window.history.length > 1) {
        navigate(-1) // Go back in browser history
      } else {
        // No history, go to appropriate dashboard
        if (location.pathname.startsWith('/admin')) {
          navigate('/admin/dashboard')
        } else if (location.pathname.startsWith('/teacher')) {
          navigate('/teacher/dashboard')
        } else {
          navigate('/login')
        }
      }
    } else {
      navigate(path)
    }
  }

  const getDisplayText = () => {
    const { text, path } = getBackNavigation()

    // If using browser history, show generic "Back" text
    if (path === -1) {
      return 'Back'
    }

    return text
  }

  return (
    <button
      onClick={handleBack}
      className={`
        inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600
        hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-cadd-red/20 focus:bg-gray-50
        group
        ${className}
      `}
      title={`Go back to ${getDisplayText().toLowerCase()}`}
    >
      <ChevronLeftIcon className="h-4 w-4 mr-1 transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span className="transition-colors duration-200">{getDisplayText()}</span>
    </button>
  )
}

export default BackButton
