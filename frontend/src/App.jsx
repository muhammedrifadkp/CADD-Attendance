import { Routes, Route, Navigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './context/AuthContext'

// Components
import SplashScreen from './components/SplashScreen'
import OfflineIndicator from './components/OfflineIndicator'

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
import AdminDetails from './pages/admin/admins/AdminDetails'
import EditAdmin from './pages/admin/admins/EditAdmin'
import TeachersList from './pages/admin/teachers/TeachersList'
import TeacherForm from './pages/admin/teachers/TeacherForm'
import TeacherDetails from './pages/admin/teachers/TeacherDetails'
import StudentsList from './pages/admin/students/StudentsList'
import AdminStudentForm from './pages/admin/students/StudentForm'
import StudentDetails from './pages/admin/students/StudentDetails'

// Teacher Pages
import TeacherDashboard from './pages/teacher/Dashboard'
import AttendancePage from './pages/teacher/AttendancePage'
import TeacherStudentsList from './pages/teacher/students/TeacherStudentsList'




import LabAvailability from './pages/teacher/LabAvailability'

// Admin Lab Pages
import LabOverview from './pages/admin/LabOverview'
import LabOverviewFixed from './pages/admin/LabOverviewFixed'
import LabManagementSimple from './pages/admin/lab/LabManagementSimple'
import LabDebug from './pages/admin/lab/LabDebug'
import LabBooking from './pages/admin/lab/LabBooking'
import AdminPCForm from './pages/admin/lab/PCForm'
import AdminPCList from './pages/admin/lab/PCList'
import AdminLabControl from './pages/admin/lab/LabControl'
import AdminMaintenancePage from './pages/admin/lab/MaintenancePage'

import BatchesList from './pages/teacher/batches/BatchesList'
import BatchForm from './pages/teacher/batches/BatchForm'
import BatchDetails from './pages/teacher/batches/BatchDetails'
import AdminBatchForm from './pages/admin/batches/AdminBatchForm'
import AdminAttendanceDashboard from './pages/admin/attendance/AdminAttendanceDashboard'
import AdminAttendanceMark from './pages/admin/attendance/AdminAttendanceMark'
import BatchStudents from './pages/teacher/students/BatchStudents'
import StudentForm from './pages/teacher/students/StudentForm'

// Department and Course Pages
import DepartmentsList from './pages/admin/departments/DepartmentsList'
import DepartmentForm from './pages/admin/departments/DepartmentForm'
import DepartmentDetails from './pages/admin/departments/DepartmentDetails'
import CoursesList from './pages/admin/courses/CoursesList'
import CourseForm from './pages/admin/courses/CourseForm'
import CourseDetails from './pages/admin/courses/CourseDetails'
import TestAPI from './pages/admin/TestAPI'
import AttendanceDashboard from './pages/teacher/attendance/AttendanceDashboard'
import AttendanceCalendar from './pages/teacher/attendance/AttendanceCalendar'
import AttendanceForm from './pages/teacher/attendance/AttendanceForm'
import AttendanceReport from './pages/teacher/attendance/AttendanceReport'
import AdminAttendanceReport from './pages/admin/attendance/AdminAttendanceReport'

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
    <>
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

          {/* Departments Routes */}
          <Route path="departments" element={<DepartmentsList />} />
          <Route path="departments/new" element={<DepartmentForm />} />
          <Route path="departments/:id" element={<DepartmentDetails />} />
          <Route path="departments/:id/edit" element={<DepartmentForm />} />

          {/* Courses Routes */}
          <Route path="courses" element={<CoursesList />} />
          <Route path="courses/new" element={<CourseForm />} />
          <Route path="courses/:id" element={<CourseDetails />} />
          <Route path="courses/:id/edit" element={<CourseForm />} />

          {/* Test API Route */}
          <Route path="test-api" element={<TestAPI />} />

          <Route path="admins" element={<AdminsList />} />
          <Route path="admins/new" element={<CreateAdmin />} />
          <Route path="admins/:id" element={<AdminDetails />} />
          <Route path="admins/:id/edit" element={<EditAdmin />} />
          <Route path="teachers" element={<TeachersList />} />
          <Route path="teachers/new" element={<TeacherForm />} />
          <Route path="teachers/:id" element={<TeacherDetails />} />
          <Route path="teachers/:id/edit" element={<TeacherForm />} />

          {/* Students Routes */}
          <Route path="students" element={<StudentsList />} />
          <Route path="students/new" element={<AdminStudentForm />} />
          <Route path="students/:id" element={<StudentDetails />} />
          <Route path="students/:id/edit" element={<AdminStudentForm />} />
          <Route path="attendance" element={<AdminAttendanceDashboard />} />
          <Route path="attendance/mark" element={<AdminAttendanceMark />} />
          <Route path="attendance/mark/:batchId" element={<AdminAttendanceMark />} />
          <Route path="attendance/batch/:batchId" element={<AttendanceDashboard />} />
          <Route path="attendance/reports" element={<AdminAttendanceReport />} />
          <Route path="attendance/calendar" element={<AttendanceCalendar />} />
          <Route path="attendance/report" element={<AdminAttendanceReport />} />
          <Route path="batches" element={<BatchesList />} />
          <Route path="batches/new" element={<AdminBatchForm />} />
          <Route path="batches/:id/edit" element={<AdminBatchForm />} />
          <Route path="batches/:id" element={<BatchDetails />} />
          <Route path="batches/:id/students" element={<BatchStudents />} />
          <Route path="batches/:id/students/new" element={<StudentForm />} />
          <Route path="batches/:id/students/:studentId/edit" element={<StudentForm />} />
          <Route path="batches/:id/attendance" element={<AttendanceForm />} />
          <Route path="batches/:id/attendance/report" element={<AttendanceReport />} />
          <Route path="lab" element={<LabOverview />} />
          <Route path="lab/fixed" element={<LabOverviewFixed />} />
          <Route path="lab/management-simple" element={<LabManagementSimple />} />
          <Route path="lab/debug" element={<LabDebug />} />
          <Route path="lab/booking" element={<LabBooking />} />
          <Route path="lab/control" element={<AdminLabControl />} />
          <Route path="lab/maintenance" element={<AdminMaintenancePage />} />
          <Route path="lab/pcs" element={<AdminPCList />} />
          <Route path="lab/pcs/new" element={<AdminPCForm />} />
          <Route path="lab/pcs/:id/edit" element={<AdminPCForm />} />
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

      {/* Offline indicator - only show when user is logged in */}
      {user && <OfflineIndicator />}
    </>
  )
}

export default App
