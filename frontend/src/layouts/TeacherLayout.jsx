import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Bars3Icon,
  XMarkIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowLeftOnRectangleIcon,
  ComputerDesktopIcon,
  UserIcon,
} from '@heroicons/react/24/outline'

const TeacherLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    {
      name: 'Dashboard',
      href: '/',
      icon: ChartBarIcon,
      current: location.pathname === '/',
    },
    {
      name: 'Attendance',
      href: '/attendance',
      icon: ClipboardDocumentListIcon,
      current: location.pathname.startsWith('/attendance'),
    },
    {
      name: 'Students',
      href: '/students',
      icon: UserIcon,
      current: location.pathname === '/students',
    },
    {
      name: 'Lab Availability',
      href: '/lab-availability',
      icon: ComputerDesktopIcon,
      current: location.pathname.startsWith('/lab-availability'),
    },
    {
      name: 'Batches',
      href: '/batches',
      icon: UserGroupIcon,
      current: location.pathname.startsWith('/batches'),
    },
  ]

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-40 flex md:hidden ${sidebarOpen ? 'visible' : 'invisible'
          }`}
        aria-hidden="true"
      >
        {/* Sidebar backdrop */}
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${sidebarOpen ? 'opacity-100 ease-out duration-300' : 'opacity-0 ease-in duration-200'
            }`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-gray-900 shadow-2xl transform transition ${sidebarOpen
            ? 'translate-x-0 ease-out duration-300'
            : '-translate-x-full ease-in duration-200'
            }`}
          style={{
            background: 'linear-gradient(180deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
          }}
        >
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-6 pb-4 overflow-y-auto">
            {/* Mobile Header with CADD Branding */}
            <div className="px-4 mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <img
                    className="h-10 w-auto"
                    src="/logos/cadd_logo.png"
                    alt="CADD Centre"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  <div className="hidden text-white text-lg font-bold">CADD Centre</div>
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-white text-lg font-bold mb-1">Teacher Portal</h1>
                <p className="text-gray-400 text-sm">Education Management</p>
              </div>
            </div>
            <nav className="px-2 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-base font-medium rounded-xl transition-all duration-200 ${item.current
                    ? 'bg-gradient-to-r from-cadd-red to-cadd-pink text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={`mr-3 h-6 w-6 transition-colors duration-200 ${item.current ? 'text-white' : 'text-gray-400 group-hover:text-white'
                      }`}
                    aria-hidden="true"
                  />
                  <span className="font-medium">{item.name}</span>
                  {item.current && (
                    <div className="ml-auto w-2 h-2 bg-cadd-yellow rounded-full"></div>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          {/* Mobile User Profile */}
          <div className="flex-shrink-0 border-t border-gray-800 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cadd-red to-cadd-pink flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0) || 'T'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Teacher'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-green-400 font-medium">Online</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 flex-shrink-0 bg-gray-800 hover:bg-gray-700 p-2 rounded-lg text-gray-400 hover:text-white transition-all duration-200"
                title="Logout"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-900 shadow-2xl"
          style={{
            background: 'linear-gradient(180deg, #1f2937 0%, #111827 50%, #0f172a 100%)'
          }}>
          <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
            {/* Teacher Header with CADD Branding */}
            <div className="px-4 mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <img
                    className="h-12 w-auto"
                    src="/logos/cadd_logo.png"
                    alt="CADD Centre"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  <div className="hidden text-white text-xl font-bold">CADD Centre</div>
                </div>
              </div>
              <div className="text-center">
                <h1 className="text-white text-lg font-bold mb-1">Teacher Portal</h1>
                <p className="text-gray-400 text-sm">Education Management</p>
              </div>
            </div>
            <nav className="flex-1 px-2 space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${item.current
                    ? 'bg-gradient-to-r from-cadd-red to-cadd-pink text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-105'
                    }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 transition-colors duration-200 ${item.current ? 'text-white' : 'text-gray-400 group-hover:text-white'
                      }`}
                    aria-hidden="true"
                  />
                  <span className="font-medium">{item.name}</span>
                  {item.current && (
                    <div className="ml-auto w-2 h-2 bg-cadd-yellow rounded-full"></div>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          {/* User Profile Section */}
          <div className="flex-shrink-0 border-t border-gray-800 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cadd-red to-cadd-pink flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user?.name?.charAt(0) || 'T'}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name || 'Teacher'}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-green-400 font-medium">Online</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 flex-shrink-0 bg-gray-800 hover:bg-gray-700 p-2 rounded-lg text-gray-400 hover:text-white transition-all duration-200"
                title="Logout"
              >
                <ArrowLeftOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-100">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1">
          <div className="py-4 sm:py-6 lg:py-8">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default TeacherLayout
