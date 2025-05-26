import { Outlet } from 'react-router-dom'

const AuthLayout = () => {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full opacity-10 gradient-primary"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10 gradient-secondary"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5 gradient-accent"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        {/* CADD Centre Header */}
        <div className="text-center animate-fade-in">
          <div className="flex justify-center mb-6">
            <img
              className="cadd-logo-large"
              src="/logos/cadd_logo.png"
              alt="CADD Centre"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'block'
              }}
            />
            <div className="hidden">
              <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">CC</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
            CADD Centre
          </h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">
            Attendance Management
          </h2>
          <p className="text-gray-600 font-medium">
            Software Training Institute
          </p>
        </div>

        {/* Login Form Container */}
        <div className="card card-gradient animate-slide-up">
          <Outlet />
        </div>

        {/* Footer */}
        <div className="text-center animate-fade-in">
          <p className="text-sm text-gray-500">
            © 2024 CADD Centre. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Empowering careers through quality software training
          </p>
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
