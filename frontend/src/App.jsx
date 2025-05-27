import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './context/AuthContext'

// Components
import SplashScreen from './components/SplashScreen'

// Layouts
import AuthLayout from './layouts/AuthLayout'
import AdminLayout from './layouts/AdminLayout'
import TeacherLayout from './layouts/TeacherLayout'


// Auth Pages
import Login from './pages/auth/Login'

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminsList from './pages/admin/admins/AdminsList'
import CreateAdmin from './pages/admin/admins/CreateAdmin'
import TeachersList from './pages/admin/teachers/TeachersList'
import TeacherForm from './pages/admin/teachers/TeacherForm'
import TeacherDetails from './pages/admin/teachers/TeacherDetails'
import StudentsList from './pages/admin/students/StudentsList'

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard'
import AttendancePage from './pages/teacher/AttendancePage'
import TeacherStudentsList from './pages/teacher/students/TeacherStudentsList'




import LabAvailability from './pages/teacher/LabAvailability'

// Admin Lab Pages
import LabOverview from './pages/admin/LabOverview'
import LabManagement from './pages/admin/lab/LabManagement'
import AdminPCForm from './pages/admin/lab/PCForm'
import AdminPCList from './pages/admin/lab/PCList'
import AdminLabControl from './pages/admin/lab/LabControl'
import AdminMaintenancePage from './pages/admin/lab/MaintenancePage'
import AdminBookLab from './pages/admin/lab/AdminBookLab'
import BatchesList from './pages/teacher/batches/BatchesList'
import BatchForm from './pages/teacher/batches/BatchForm'
import BatchDetails from './pages/teacher/batches/BatchDetails'
import BatchStudents from './pages/teacher/students/BatchStudents'
import StudentForm from './pages/teacher/students/StudentForm'
import AttendanceDashboard from './pages/teacher/attendance/AttendanceDashboard'
import AttendanceCalendar from './pages/teacher/attendance/AttendanceCalendar'
import AttendanceForm from './pages/teacher/attendance/AttendanceForm'
import AttendanceReport from './pages/teacher/attendance/AttendanceReport'
import AdminAttendanceReport from './pages/admin/attendance/AdminAttendanceReport'
import DebugLabFeatures from './components/DebugLabFeatures'

function App() {
  const { user, loading } = useAuth()
  const [showSplash, setShowSplash] = useState(() => {
    // Check if splash screen has been shown before
    const hasSeenSplash = localStorage.getItem('cadd-splash-shown')
    return !hasSeenSplash
  })

  const handleSplashComplete = () => {
    // Mark splash as shown and hide it
    localStorage.setItem('cadd-splash-shown', 'true')
    setShowSplash(false)
  }

  // Show splash screen only on first visit
  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />
  }

  // Show loading spinner for auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-red-500 border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          user && user.role === 'admin' ? (
            <AdminLayout />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="admins" element={<AdminsList />} />
        <Route path="admins/new" element={<CreateAdmin />} />
        <Route path="teachers" element={<TeachersList />} />
        <Route path="teachers/new" element={<TeacherForm />} />
        <Route path="teachers/:id" element={<TeacherDetails />} />
        <Route path="teachers/:id/edit" element={<TeacherForm />} />
        <Route path="students" element={<StudentsList />} />
        <Route path="attendance" element={<AttendanceDashboard />} />
        <Route path="attendance/calendar" element={<AttendanceCalendar />} />
        <Route path="attendance/report" element={<AdminAttendanceReport />} />
        <Route path="batches" element={<BatchesList />} />
        <Route path="batches/new" element={<BatchForm />} />
        <Route path="batches/:id/edit" element={<BatchForm />} />
        <Route path="batches/:id" element={<BatchDetails />} />
        <Route path="batches/:id/students" element={<BatchStudents />} />
        <Route path="batches/:id/students/new" element={<StudentForm />} />
        <Route path="batches/:id/students/:studentId/edit" element={<StudentForm />} />
        <Route path="batches/:id/attendance" element={<AttendanceForm />} />
        <Route path="batches/:id/attendance/report" element={<AttendanceReport />} />
        <Route path="lab" element={<LabOverview />} />
        <Route path="lab/management" element={<LabManagement />} />
        <Route path="lab/control" element={<AdminLabControl />} />
        <Route path="lab/maintenance" element={<AdminMaintenancePage />} />
        <Route path="lab/pcs" element={<AdminPCList />} />
        <Route path="lab/pcs/new" element={<AdminPCForm />} />
        <Route path="lab/pcs/:id/edit" element={<AdminPCForm />} />
        <Route path="lab/book" element={<AdminBookLab />} />
        <Route path="debug-lab" element={<DebugLabFeatures />} />
      </Route>



      {/* Teacher Routes */}
      <Route
        path="/"
        element={
          user ? <TeacherLayout /> : <Navigate to="/login" replace />
        }
      >
        <Route index element={<TeacherDashboard />} />
        <Route path="attendance" element={<AttendancePage />} />
        <Route path="attendance/calendar" element={<AttendanceCalendar />} />

        <Route path="students" element={<TeacherStudentsList />} />
        <Route path="lab-availability" element={<LabAvailability />} />
        <Route path="batches" element={<BatchesList />} />
        <Route path="batches/new" element={<BatchForm />} />
        <Route path="batches/:id/edit" element={<BatchForm />} />
        <Route path="batches/:id" element={<BatchDetails />} />
        <Route path="batches/:id/students" element={<BatchStudents />} />
        <Route path="batches/:id/students/new" element={<StudentForm />} />
        <Route path="batches/:id/students/:studentId/edit" element={<StudentForm />} />
        <Route path="batches/:id/attendance" element={<AttendanceForm />} />
        <Route path="batches/:id/attendance/report" element={<AttendanceReport />} />
      </Route>

      {/* Catch all - redirect to appropriate dashboard */}
      <Route
        path="*"
        element={
          user ? (
            user.role === 'admin' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}

export default App
