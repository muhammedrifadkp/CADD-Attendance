import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarDaysIcon,
  ComputerDesktopIcon,
  ClockIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  UserIcon,
  BuildingOfficeIcon,
  CogIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline'
import { labAPI } from '../../../services/labAPI'
import { batchesAPI, studentsAPI, teachersAPI } from '../../../services/api'
import { useAuth } from '../../../context/AuthContext'
import { toast } from 'react-toastify'
import BookingSuccessModal from '../../../components/BookingSuccessModal'
import BackButton from '../../../components/BackButton'

const AdminBookLab = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    timeSlot: '',
    pc: '',
    bookedFor: '',
    purpose: '',
    batch: '',
    student: '',
    teacher: '',
    studentCount: '',
    notes: '',
    bookingType: 'individual', // individual, batch, teacher
    priority: 'normal' // normal, high, urgent
  })
  const [availability, setAvailability] = useState(null)
  const [batches, setBatches] = useState([])
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [allUsers, setAllUsers] = useState([]) // Combined students and teachers
  const [searchQuery, setSearchQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [filteredUsers, setFilteredUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [bookingResult, setBookingResult] = useState(null)

  const timeSlots = [
    { id: '09:00-10:30', label: '09:00 AM - 10:30 AM', icon: '🌅' },
    { id: '10:30-12:00', label: '10:30 AM - 12:00 PM', icon: '☀️' },
    { id: '12:00-13:30', label: '12:00 PM - 01:30 PM', icon: '🌞' },
    { id: '14:00-15:30', label: '02:00 PM - 03:30 PM', icon: '🌤️' },
    { id: '15:30-17:00', label: '03:30 PM - 05:00 PM', icon: '🌇' }
  ]

  const adminBookingTemplates = [
    {
      id: 'admin-autocad',
      name: 'AutoCAD Training',
      purpose: 'Training Session',
      icon: '🎨',
      description: 'Professional AutoCAD training session',
      color: 'blue',
      priority: 'high'
    },
    {
      id: 'admin-programming',
      name: 'Programming Workshop',
      purpose: 'Workshop',
      icon: '💻',
      description: 'Advanced programming workshop',
      color: 'green',
      priority: 'normal'
    },
    {
      id: 'admin-certification',
      name: 'Certification Exam',
      purpose: 'Certification',
      icon: '🏆',
      description: 'Professional certification examination',
      color: 'purple',
      priority: 'urgent'
    },
    {
      id: 'admin-demo',
      name: 'Software Demo',
      purpose: 'Demonstration',
      icon: '📺',
      description: 'Software demonstration session',
      color: 'orange',
      priority: 'normal'
    },
    {
      id: 'admin-maintenance',
      name: 'System Maintenance',
      purpose: 'Maintenance',
      icon: '🔧',
      description: 'System maintenance and updates',
      color: 'red',
      priority: 'high'
    },
    {
      id: 'admin-meeting',
      name: 'Staff Meeting',
      purpose: 'Meeting',
      icon: '👥',
      description: 'Staff or administrative meeting',
      color: 'gray',
      priority: 'normal'
    }
  ]

  const steps = [
    { id: 1, name: 'Date & Time', description: 'Schedule the session' },
    { id: 2, name: 'Select PC', description: 'Choose computer(s)' },
    { id: 3, name: 'Booking Details', description: 'Configure booking' },
    { id: 4, name: 'Review & Confirm', description: 'Finalize booking' }
  ]

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (formData.date) {
      fetchAvailability()
    }
  }, [formData.date])

  useEffect(() => {
    if (formData.batch) {
      fetchBatchStudents(formData.batch)
    }
  }, [formData.batch])

  const fetchInitialData = async () => {
    try {
      const [batchesRes, teachersRes, studentsRes] = await Promise.all([
        batchesAPI.getBatches(),
        teachersAPI.getTeachers(),
        studentsAPI.getStudents()
      ])

      setBatches(batchesRes.data)
      setTeachers(teachersRes.data)
      setStudents(studentsRes.data)

      // Combine students and teachers for unified search
      const combinedUsers = [
        ...studentsRes.data.map(student => ({
          ...student,
          type: 'student',
          displayName: student.name,
          subtitle: `${student.rollNo} • ${student.batch?.name || 'No Batch'}`,
          searchText: `${student.name} ${student.rollNo} ${student.batch?.name || ''}`.toLowerCase()
        })),
        ...teachersRes.data.map(teacher => ({
          ...teacher,
          type: 'teacher',
          displayName: teacher.name,
          subtitle: `${teacher.email} • ${teacher.department || 'Teacher'}`,
          searchText: `${teacher.name} ${teacher.email} ${teacher.department || ''}`.toLowerCase()
        }))
      ]

      setAllUsers(combinedUsers)
      setFilteredUsers(combinedUsers)

    } catch (error) {
      console.error('Error fetching initial data:', error)
      toast.error('Failed to fetch initial data')
    }
  }

  const fetchAvailability = async () => {
    setLoading(true)
    try {
      const response = await labAPI.bookings.getAvailability(formData.date)
      // Handle response format - check if data is nested
      const availabilityData = response?.data || response
      setAvailability(availabilityData)
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Failed to fetch availability')
      setAvailability(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchBatchStudents = async (batchId) => {
    try {
      const response = await studentsAPI.getStudentsByBatch(batchId)
      setStudents(response.data)
    } catch (error) {
      console.error('Error fetching batch students:', error)
      setStudents([])
    }
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Clear related errors
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }

    // Clear dependent fields
    if (field === 'bookingType') {
      setFormData(prev => ({
        ...prev,
        batch: '',
        student: '',
        teacher: '',
        bookedFor: ''
      }))
      setStudents([])
      setSearchQuery('')
      setShowDropdown(false)
    }
  }

  const validateStep = (step) => {
    const newErrors = {}

    switch (step) {
      case 1:
        if (!formData.date) newErrors.date = 'Date is required'
        if (!formData.timeSlot) newErrors.timeSlot = 'Time slot is required'
        break
      case 2:
        if (!formData.pc) newErrors.pc = 'Please select a PC'
        break
      case 3:
        if (!formData.bookedFor) newErrors.bookedFor = 'Please select a student or teacher'
        if (!formData.purpose) newErrors.purpose = 'Purpose is required'
        if (formData.bookingType === 'batch' && !formData.batch) {
          newErrors.batch = 'Please select a batch'
        }
        if (formData.studentCount && (isNaN(formData.studentCount) || formData.studentCount < 1)) {
          newErrors.studentCount = 'Please enter a valid number of students'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setSubmitting(true)
    try {
      const bookingData = {
        pc: formData.pc,
        date: formData.date,
        timeSlot: formData.timeSlot,
        bookedFor: formData.bookedFor,
        purpose: formData.purpose,
        batch: formData.bookingType === 'batch' ? formData.batch : null,
        student: formData.bookingType === 'individual' ? formData.student : null,
        teacher: formData.bookingType === 'teacher' ? formData.teacher : null,
        studentCount: formData.studentCount ? parseInt(formData.studentCount) : null,
        notes: formData.notes,
        priority: formData.priority,
        status: 'confirmed',
        isActive: true
      }

      const result = await labAPI.bookings.createBooking(bookingData)

      // Prepare booking details for success modal
      const selectedPC = getSelectedPC()
      const bookingDetails = {
        date: formData.date,
        timeSlot: getTimeSlotLabel(formData.timeSlot),
        pcNumber: selectedPC?.pcNumber,
        rowNumber: selectedPC?.rowNumber,
        bookedFor: formData.bookedFor,
        purpose: formData.purpose,
        priority: formData.priority
      }

      setBookingResult(bookingDetails)
      setShowSuccessModal(true)
      toast.success('Admin booking created successfully!')
    } catch (error) {
      console.error('Error creating booking:', error)
      toast.error('Failed to create booking. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false)
    navigate('/admin/lab/management')
  }

  const isSlotAvailable = (pcId, timeSlot) => {
    if (!availability) return false
    const pcAvailability = availability.availability?.find(pc => pc.pc._id === pcId)
    return pcAvailability?.slots[timeSlot]?.available === true
  }

  const getAvailablePCs = () => {
    if (!availability || !formData.timeSlot) return []
    return availability.availability?.filter(pc =>
      pc.slots[formData.timeSlot]?.available === true
    ) || []
  }

  const getBatchName = (batchId) => {
    const batch = batches.find(b => b._id === batchId)
    return batch ? `${batch.name} - ${batch.section}` : ''
  }

  const getStudentName = (studentId) => {
    const student = students.find(s => s._id === studentId)
    return student ? student.name : ''
  }

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId)
    return teacher ? teacher.name : ''
  }

  const getTimeSlotLabel = (timeSlot) => {
    const slot = timeSlots.find(s => s.id === timeSlot)
    return slot ? slot.label : timeSlot
  }

  const getSelectedPC = () => {
    if (!availability || !formData.pc) return null
    return availability.availability?.find(pc => pc.pc._id === formData.pc)?.pc
  }

  const applyAdminTemplate = (template) => {
    setFormData(prev => ({
      ...prev,
      purpose: template.purpose,
      priority: template.priority,
      bookingType: template.id.includes('certification') || template.id.includes('demo') ? 'batch' : 'individual'
    }))
    // Clear related errors
    setErrors(prev => ({
      ...prev,
      purpose: '',
      priority: ''
    }))
  }

  // Search functionality
  const handleSearchChange = (value) => {
    setSearchQuery(value)

    if (value.trim() === '') {
      setFilteredUsers(allUsers)
    } else {
      const filtered = allUsers.filter(user =>
        user.searchText.includes(value.toLowerCase())
      )
      setFilteredUsers(filtered)
    }

    setShowDropdown(true)
  }

  const handleUserSelect = (user) => {
    setFormData(prev => ({
      ...prev,
      bookedFor: user.displayName,
      bookingType: user.type === 'student' ? 'individual' : 'teacher',
      student: user.type === 'student' ? user._id : '',
      teacher: user.type === 'teacher' ? user._id : ''
    }))

    // Clear the search input after selection
    setSearchQuery('')
    setShowDropdown(false)

    // Clear related errors
    setErrors(prev => ({
      ...prev,
      bookedFor: '',
      student: '',
      teacher: ''
    }))
  }

  const handleSearchFocus = () => {
    setShowDropdown(true)
    if (searchQuery === '') {
      setFilteredUsers(allUsers)
    }
  }

  const handleSearchBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => setShowDropdown(false), 200)
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Admin Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-cadd-purple via-cadd-pink to-cadd-red rounded-2xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <CogIcon className="inline h-10 w-10 mr-3 text-cadd-yellow" />
                Admin Lab Booking
              </h1>
              <p className="text-xl text-white/90 mb-4">
                Advanced booking management with administrative privileges
              </p>
              <div className="flex items-center space-x-4 text-sm text-white/80">
                <span className="flex items-center">
                  <CalendarDaysIcon className="w-4 h-4 mr-1" />
                  Step {currentStep} of {steps.length}
                </span>
                <span className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {steps[currentStep - 1]?.name}
                </span>
                <span className="flex items-center">
                  <UserIcon className="w-4 h-4 mr-1" />
                  Administrator Access
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <BuildingOfficeIcon className="h-12 w-12 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Progress Steps */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-cadd-red">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${currentStep >= step.id
                  ? 'bg-gradient-to-r from-cadd-red to-cadd-pink border-cadd-red text-white shadow-lg'
                  : 'border-gray-300 text-gray-500'
                  }`}>
                  {currentStep > step.id ? (
                    <CheckCircleIcon className="h-7 w-7" />
                  ) : (
                    <span className="text-sm font-bold">{step.id}</span>
                  )}
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-semibold ${currentStep >= step.id ? 'text-cadd-red' : 'text-gray-500'
                    }`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-20 h-1 mx-6 rounded-full ${currentStep > step.id ? 'bg-gradient-to-r from-cadd-red to-cadd-pink' : 'bg-gray-300'
                  }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
        {/* Step 1: Date & Time Selection */}
        {currentStep === 1 && (
          <div className="p-8">
            <div className="text-center mb-8">
              <CalendarDaysIcon className="mx-auto h-14 w-14 text-blue-500 mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Schedule Session</h2>
              <p className="text-gray-600">Select date and time for the lab booking</p>
            </div>

            <div className="max-w-3xl mx-auto space-y-8">
              {/* Date Selection */}
              <div className="bg-gray-50 rounded-xl p-6">
                <label className="block text-lg font-semibold text-gray-700 mb-4">
                  Select Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={`block w-full border-2 rounded-xl shadow-sm px-6 py-4 text-lg focus:ring-cadd-red focus:border-cadd-red ${errors.date ? 'border-red-300' : 'border-gray-300'
                    }`}
                />
                {errors.date && (
                  <p className="mt-2 text-sm text-red-600">{errors.date}</p>
                )}
              </div>

              {/* Time Slot Selection */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-6">
                  Select Time Slot
                </label>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => handleInputChange('timeSlot', slot.id)}
                      className={`relative p-6 border-2 rounded-xl text-left transition-all duration-200 transform hover:scale-105 ${formData.timeSlot === slot.id
                        ? 'border-cadd-red bg-red-50 shadow-xl'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-3">
                            <span className="text-3xl">{slot.icon}</span>
                            <div>
                              <p className="text-base font-bold text-gray-900">{slot.label}</p>
                              <p className="text-sm text-gray-500">1.5 hours session</p>
                            </div>
                          </div>
                        </div>
                        {formData.timeSlot === slot.id && (
                          <CheckCircleIcon className="h-8 w-8 text-cadd-red" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {errors.timeSlot && (
                  <p className="mt-3 text-sm text-red-600">{errors.timeSlot}</p>
                )}
              </div>

              {/* Availability Info */}
              {formData.date && formData.timeSlot && availability && (
                <div className="mt-8 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
                  <div className="flex items-center">
                    <InformationCircleIcon className="h-6 w-6 text-blue-500 mr-3" />
                    <div>
                      <p className="text-base font-semibold text-blue-900">
                        {getAvailablePCs().length} PCs available for this time slot
                      </p>
                      <p className="text-sm text-blue-700">
                        Administrative booking - can override if necessary
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: PC Selection */}
        {currentStep === 2 && (
          <div className="p-8">
            <div className="text-center mb-8">
              <ComputerDesktopIcon className="mx-auto h-14 w-14 text-green-500 mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Select Computer</h2>
              <p className="text-gray-600">Choose from available PCs for {getTimeSlotLabel(formData.timeSlot)}</p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center min-h-64">
                <div className="relative">
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200"></div>
                  <div className="animate-spin rounded-full h-20 w-20 border-4 border-cadd-red border-t-transparent absolute top-0 left-0"></div>
                </div>
              </div>
            ) : (
              <div className="max-w-6xl mx-auto">
                {getAvailablePCs().length === 0 ? (
                  <div className="text-center py-16">
                    <XCircleIcon className="mx-auto h-16 w-16 text-red-500 mb-6" />
                    <h3 className="text-xl font-medium text-gray-900 mb-3">No PCs Available</h3>
                    <p className="text-gray-600 mb-8">
                      All computers are booked for the selected time slot.
                    </p>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                      <div className="flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mr-2" />
                        <p className="text-sm text-yellow-800">
                          <strong>Admin Override:</strong> You can force book a PC if necessary for urgent requirements.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={prevStep}
                      className="inline-flex items-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ArrowLeftIcon className="h-4 w-4 mr-2" />
                      Go Back
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Admin PC Grid by Rows */}
                    {Object.entries(
                      getAvailablePCs().reduce((rows, pcData) => {
                        const rowNumber = pcData.pc.rowNumber
                        if (!rows[rowNumber]) rows[rowNumber] = []
                        rows[rowNumber].push(pcData)
                        return rows
                      }, {})
                    ).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([rowNumber, rowPCs]) => (
                      <div key={rowNumber} className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <h3 className="text-xl font-bold text-gray-900">Row {rowNumber}</h3>
                          <div className="flex-1 h-px bg-gradient-to-r from-cadd-red to-cadd-pink"></div>
                          <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {rowPCs.length} PC{rowPCs.length !== 1 ? 's' : ''} available
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                          {rowPCs.map((pcData, index) => (
                            <button
                              key={pcData.pc._id}
                              type="button"
                              onClick={() => handleInputChange('pc', pcData.pc._id)}
                              className={`
                                relative p-4 rounded-xl text-center text-sm font-bold transition-all duration-200 cursor-pointer animate-slide-up
                                ${formData.pc === pcData.pc._id
                                  ? 'bg-gradient-to-br from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red text-white shadow-xl'
                                  : 'bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 hover:shadow-lg'
                                }
                                transform hover:scale-110 border-2 ${formData.pc === pcData.pc._id ? 'border-cadd-yellow' : 'border-transparent'}
                              `}
                              style={{ animationDelay: `${index * 50}ms` }}
                              title={`PC ${pcData.pc.pcNumber} - Row ${pcData.pc.rowNumber} - Available`}
                            >
                              <div className="text-lg font-bold">{pcData.pc.pcNumber}</div>
                              <div className="text-xs mt-1 opacity-90">
                                {formData.pc === pcData.pc._id ? 'Selected' : 'Available'}
                              </div>
                              {formData.pc === pcData.pc._id && (
                                <CheckCircleIcon className="h-5 w-5 mx-auto mt-2" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.pc && (
                  <p className="mt-6 text-sm text-red-600 text-center font-medium">{errors.pc}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Admin Booking Details */}
        {currentStep === 3 && (
          <div className="p-8">
            <div className="text-center mb-8">
              <CogIcon className="mx-auto h-14 w-14 text-purple-500 mb-4" />
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Admin Booking Configuration</h2>
              <p className="text-gray-600">Configure advanced booking details with administrative privileges</p>
            </div>

            <div className="max-w-4xl mx-auto space-y-8">
              {/* Admin Quick Templates */}
              <div className="bg-gradient-to-r from-cadd-purple/5 to-cadd-pink/5 rounded-xl p-6 border border-cadd-purple/20">
                <label className="block text-lg font-semibold text-gray-700 mb-6">
                  Admin Quick Templates
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {adminBookingTemplates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyAdminTemplate(template)}
                      className={`p-4 border-2 rounded-xl text-left transition-all duration-200 hover:shadow-lg ${template.color === 'blue' ? 'border-blue-200 hover:border-blue-300 hover:bg-blue-50' :
                        template.color === 'green' ? 'border-green-200 hover:border-green-300 hover:bg-green-50' :
                          template.color === 'purple' ? 'border-purple-200 hover:border-purple-300 hover:bg-purple-50' :
                            template.color === 'orange' ? 'border-orange-200 hover:border-orange-300 hover:bg-orange-50' :
                              template.color === 'red' ? 'border-red-200 hover:border-red-300 hover:bg-red-50' :
                                'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{template.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{template.name}</p>
                          <p className="text-xs text-gray-500">{template.description}</p>
                          <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${template.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            template.priority === 'high' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                            {template.priority}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Booking Type & Priority */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    Booking Type
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'individual', label: 'Individual Student', icon: '👤', desc: 'Single student booking' },
                      { value: 'batch', label: 'Batch/Class', icon: '👥', desc: 'Group or class booking' },
                      { value: 'teacher', label: 'Teacher/Staff', icon: '👨‍🏫', desc: 'Teacher or staff booking' }
                    ].map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleInputChange('bookingType', type.value)}
                        className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 ${formData.bookingType === type.value
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{type.icon}</span>
                            <div>
                              <p className="font-semibold text-gray-900">{type.label}</p>
                              <p className="text-sm text-gray-500">{type.desc}</p>
                            </div>
                          </div>
                          {formData.bookingType === type.value && (
                            <CheckCircleIcon className="h-6 w-6 text-purple-500" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-semibold text-gray-700 mb-4">
                    Priority Level
                  </label>
                  <div className="space-y-3">
                    {[
                      { value: 'normal', label: 'Normal', color: 'green', desc: 'Standard booking' },
                      { value: 'high', label: 'High Priority', color: 'yellow', desc: 'Important booking' },
                      { value: 'urgent', label: 'Urgent', color: 'red', desc: 'Critical booking' }
                    ].map((priority) => (
                      <button
                        key={priority.value}
                        type="button"
                        onClick={() => handleInputChange('priority', priority.value)}
                        className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 ${formData.priority === priority.value
                          ? `border-${priority.color}-500 bg-${priority.color}-50 shadow-lg`
                          : 'border-gray-200 hover:border-gray-300'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{priority.label}</p>
                            <p className="text-sm text-gray-500">{priority.desc}</p>
                          </div>
                          {formData.priority === priority.value && (
                            <CheckCircleIcon className={`h-6 w-6 text-${priority.color}-500`} />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Unified Student/Teacher Search */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <label className="block text-lg font-semibold text-gray-700 mb-4">
                  <UserIcon className="inline h-6 w-6 mr-2 text-blue-500" />
                  Select Student or Teacher *
                </label>
                <p className="text-sm text-gray-600 mb-4">
                  Search and select from all enrolled students and teachers. Type to filter results.
                </p>

                <div className="relative">
                  <div className="flex space-x-3">
                    <div className="relative flex-1">
                      <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        placeholder="Type student or teacher name to search..."
                        className={`block w-full pl-12 pr-12 py-4 border-2 rounded-xl shadow-sm text-lg focus:ring-blue-500 focus:border-blue-500 ${errors.bookedFor ? 'border-red-300' : 'border-blue-300'
                          }`}
                      />
                      <ChevronDownIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setFilteredUsers(allUsers)
                        setShowDropdown(true)
                      }}
                      className="px-6 py-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-200 font-medium"
                    >
                      Show All
                    </button>
                  </div>

                  {/* Dropdown Results */}
                  {showDropdown && (
                    <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto">
                      {filteredUsers.length > 0 ? (
                        <>
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                            <p className="text-sm font-medium text-gray-700">
                              {filteredUsers.length} result{filteredUsers.length !== 1 ? 's' : ''} found
                            </p>
                          </div>
                          {filteredUsers.map((user) => (
                            <button
                              key={`${user.type}-${user._id}`}
                              type="button"
                              onClick={() => handleUserSelect(user)}
                              className="w-full px-4 py-4 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                            >
                              <div className="flex items-center space-x-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${user.type === 'student' ? 'bg-blue-500' : 'bg-green-500'
                                  }`}>
                                  {user.type === 'student' ? '👨‍🎓' : '👨‍🏫'}
                                </div>
                                <div className="flex-1">
                                  <p className="font-semibold text-gray-900">{user.displayName}</p>
                                  <p className="text-sm text-gray-600">{user.subtitle}</p>
                                  <span className={`inline-block mt-1 px-2 py-1 text-xs font-medium rounded-full ${user.type === 'student' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                    }`}>
                                    {user.type === 'student' ? 'Student' : 'Teacher'}
                                  </span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="px-4 py-8 text-center">
                          <UserIcon className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                          <p className="text-gray-500 font-medium">No users found</p>
                          <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {errors.bookedFor && (
                  <p className="mt-2 text-sm text-red-600">{errors.bookedFor}</p>
                )}

                {/* Quick Stats */}
                <div className="mt-4 flex items-center justify-between text-sm text-blue-600">
                  <span>💡 Tip: Type letters to filter results instantly</span>
                  <span>{allUsers.filter(u => u.type === 'student').length} students, {allUsers.filter(u => u.type === 'teacher').length} teachers</span>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-lg font-semibold text-gray-700 mb-4">
                  Purpose *
                </label>
                <select
                  value={formData.purpose}
                  onChange={(e) => handleInputChange('purpose', e.target.value)}
                  className={`block w-full border-2 rounded-xl shadow-sm px-4 py-3 text-lg focus:ring-cadd-red focus:border-cadd-red ${errors.purpose ? 'border-red-300' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select purpose</option>
                  <option value="Training Session">Training Session</option>
                  <option value="Workshop">Workshop</option>
                  <option value="Certification">Certification</option>
                  <option value="Demonstration">Demonstration</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Meeting">Meeting</option>
                  <option value="Class Session">Class Session</option>
                  <option value="Lab Practice">Lab Practice</option>
                  <option value="Project Work">Project Work</option>
                  <option value="Exam/Test">Exam/Test</option>
                  <option value="Other">Other</option>
                </select>
                {errors.purpose && (
                  <p className="mt-2 text-sm text-red-600">{errors.purpose}</p>
                )}
              </div>

              {/* Conditional Fields Based on Booking Type */}
              {formData.bookingType === 'batch' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Select Batch *
                    </label>
                    <select
                      value={formData.batch}
                      onChange={(e) => handleInputChange('batch', e.target.value)}
                      className={`block w-full border-2 rounded-xl shadow-sm px-4 py-3 focus:ring-cadd-red focus:border-cadd-red ${errors.batch ? 'border-red-300' : 'border-gray-300'
                        }`}
                    >
                      <option value="">Select a batch</option>
                      {batches.map(batch => (
                        <option key={batch._id} value={batch._id}>
                          {batch.name} - {batch.section}
                        </option>
                      ))}
                    </select>
                    {errors.batch && (
                      <p className="mt-1 text-sm text-red-600">{errors.batch}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Number of Students
                    </label>
                    <input
                      type="number"
                      value={formData.studentCount}
                      onChange={(e) => handleInputChange('studentCount', e.target.value)}
                      placeholder="Enter number of students"
                      min="1"
                      max="50"
                      className={`block w-full border-2 rounded-xl shadow-sm px-4 py-3 focus:ring-cadd-red focus:border-cadd-red ${errors.studentCount ? 'border-red-300' : 'border-gray-300'
                        }`}
                    />
                    {errors.studentCount && (
                      <p className="mt-1 text-sm text-red-600">{errors.studentCount}</p>
                    )}
                  </div>
                </div>
              )}



              {/* Notes */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Administrative Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any administrative notes or special requirements..."
                  rows={4}
                  className="block w-full border-2 border-gray-300 rounded-xl shadow-sm px-4 py-3 focus:ring-cadd-red focus:border-cadd-red"
                />
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
          <div className="flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className={`inline-flex items-center px-8 py-3 border-2 border-gray-300 text-sm font-semibold rounded-xl transition-all duration-200 ${currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400'
                }`}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" />
              Previous
            </button>

            {currentStep < 4 ? (
              <button
                onClick={nextStep}
                className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-cadd-red to-cadd-pink hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Next
                <ArrowRightIcon className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center px-10 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    Confirm Admin Booking
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <BookingSuccessModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        bookingDetails={bookingResult}
      />
    </div>
  )
}

export default AdminBookLab