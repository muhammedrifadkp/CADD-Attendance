import { useState } from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Bars3Icon,
  XMarkIcon,
  UserGroupIcon,
  UserIcon,
  ChartBarIcon,
  ClipboardDocumentListIcon,
  ArrowLeftOnRectangleIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'

const AdminLayout = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: ChartBarIcon,
      current: location.pathname === '/admin',
    },
    {
      name: 'Admins',
      href: '/admin/admins',
      icon: ShieldCheckIcon,
      current: location.pathname.startsWith('/admin/admins'),
    },
    {
      name: 'Departments',
      href: '/admin/departments',
      icon: BuildingOfficeIcon,
      current: location.pathname.startsWith('/admin/departments'),
    },
    {
      name: 'Courses',
      href: '/admin/courses',
      icon: AcademicCapIcon,
      current: location.pathname.startsWith('/admin/courses'),
    },
    {
      name: 'Teachers',
      href: '/admin/teachers',
      icon: UserIcon,
      current: location.pathname.startsWith('/admin/teachers'),
    },
    {
      name: 'Batches',
      href: '/admin/batches',
      icon: UserGroupIcon,
      current: location.pathname.startsWith('/admin/batches'),
    },
    {
      name: 'Students',
      href: '/admin/students',
      icon: UserGroupIcon,
      current: location.pathname.startsWith('/admin/students'),
    },
    {
      name: 'Attendance',
      href: '/admin/attendance',
      icon: ClipboardDocumentListIcon,
      current: location.pathname.startsWith('/admin/attendance'),
    },
    {
      name: 'Lab Management',
      href: '/admin/lab',
      icon: ComputerDesktopIcon,
      current: location.pathname.startsWith('/admin/lab'),
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
          className={`mobile-nav-backdrop transition-opacity ${sidebarOpen ? 'opacity-100 ease-out duration-300' : 'opacity-0 ease-in duration-200'
            }`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <div
          className={`mobile-sidebar ${sidebarOpen ? 'open' : ''} relative flex-1 flex flex-col max-w-xs w-full bg-gray-900 shadow-2xl`}
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
            {/* Admin Header with CDC Branding */}
            <div className="px-4 mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <img
                    className="h-12 w-auto"
                    src="/logos/cdc_logo.png"
                    alt="CDC"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  <div className="hidden w-12 h-12 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">CDC</span>
                  </div>

                </div>
              </div>
              <div className="text-center">
                <h1 className="text-white text-xl font-bold mb-1">CDC</h1>
                <p className="text-gray-300 text-sm font-medium mb-1">Administration Panel</p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-cadd-red to-cadd-yellow mx-auto rounded-full"></div>
              </div>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 mb-1 ${item.current
                    ? 'bg-gradient-to-r from-cadd-red to-cadd-pink text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800 hover:bg-opacity-50 hover:transform hover:scale-105'
                    }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={`p-2 rounded-lg mr-3 transition-all duration-300 ${item.current
                    ? 'bg-white bg-opacity-20'
                    : 'bg-gray-700 group-hover:bg-gray-600'
                    }`}>
                    <item.icon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>
                  {item.name}
                  {item.current && (
                    <div className="ml-auto w-2 h-2 bg-cadd-yellow rounded-full"></div>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          {/* Admin User Profile */}
          <div className="flex-shrink-0 border-t border-gray-700 p-4">
            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{user?.name?.charAt(0)}</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-sm font-semibold text-white">{user?.name}</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                  <div className="text-xs text-cadd-yellow font-medium">Administrator</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 bg-gray-700 hover:bg-red-600 rounded-lg text-gray-300 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Logout"
                >
                  <ArrowLeftOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
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
            {/* Admin Header with CDC Branding */}
            <div className="px-4 mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <img
                    className="h-12 w-auto"
                    src="/logos/cdc_logo.png"
                    alt="CDC"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'block'
                    }}
                  />
                  <div className="hidden w-12 h-12 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">CC</span>
                  </div>

                </div>
              </div>
              <div className="text-center">
                <h1 className="text-white text-xl font-bold mb-1">CDC</h1>
                <p className="text-gray-300 text-sm font-medium mb-1">Administration Panel</p>
                <div className="w-16 h-0.5 bg-gradient-to-r from-cadd-red to-cadd-yellow mx-auto rounded-full"></div>
              </div>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 mb-1 ${item.current
                    ? 'bg-gradient-to-r from-cadd-red to-cadd-pink text-white shadow-lg transform scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-gray-800 hover:bg-opacity-50 hover:transform hover:scale-105'
                    }`}
                >
                  <div className={`p-2 rounded-lg mr-3 transition-all duration-300 ${item.current
                    ? 'bg-white bg-opacity-20'
                    : 'bg-gray-700 group-hover:bg-gray-600'
                    }`}>
                    <item.icon
                      className="h-5 w-5"
                      aria-hidden="true"
                    />
                  </div>
                  {item.name}
                  {item.current && (
                    <div className="ml-auto w-2 h-2 bg-cadd-yellow rounded-full"></div>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          {/* Admin User Profile */}
          <div className="flex-shrink-0 border-t border-gray-700 p-4">
            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{user?.name?.charAt(0)}</span>
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <div className="text-sm font-semibold text-white">{user?.name}</div>
                  <div className="text-xs text-gray-400">{user?.email}</div>
                  <div className="text-xs text-cadd-yellow font-medium">Administrator</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-2 bg-gray-700 hover:bg-red-600 rounded-lg text-gray-300 hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
                  title="Logout"
                >
                  <ArrowLeftOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        {/* Mobile header */}
        <div className="mobile-header sticky top-0 z-10 md:hidden bg-white shadow-lg border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              type="button"
              className="btn-icon-mobile h-10 w-10 inline-flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-cadd-red transition-all duration-300 touch-target"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            <div className="flex items-center">
              <img
                className="h-8 w-auto mr-2"
                src="/logos/cdc_logo.png"
                alt="CDC"
                onError={(e) => {
                  e.target.style.display = 'none'
                  e.target.nextSibling.style.display = 'block'
                }}
              />
              <div className="hidden w-8 h-8 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-lg flex items-center justify-center mr-2">
                <span className="text-white font-bold text-sm">CDC</span>
              </div>
              <div className="text-center">
                <h1 className="text-lg font-bold bg-gradient-to-r from-cadd-red to-cadd-pink bg-clip-text text-transparent">CDC</h1>
                <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop header bar */}
        <div className="hidden md:block sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-cadd-red to-cadd-pink rounded-full mr-4"></div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">Administration Dashboard</h1>
                    <p className="text-sm text-gray-500">CDC Management System</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                  <p className="text-xs text-cadd-red font-medium">Administrator</p>
                </div>
                <div className="w-8 h-8 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{user?.name?.charAt(0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 animate-fade-in">
          <div className="py-4 sm:py-6 lg:py-8">
            <div className="container max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
