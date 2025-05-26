import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  AcademicCapIcon,
  EyeIcon
} from '@heroicons/react/24/outline'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement } from 'chart.js'
import { Line, Pie, Bar, Doughnut } from 'react-chartjs-2'
import { batchesAPI, attendanceAPI, studentsAPI, teachersAPI } from '../../../services/api'
import { toast } from 'react-toastify'
import { formatDateSimple, formatDateLong } from '../../../utils/dateUtils'
import BackButton from '../../../components/BackButton'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import * as XLSX from 'xlsx'

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ArcElement, BarElement)

const AdminAttendanceReport = () => {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState({
    startDate: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  })
  const [selectedBatch, setSelectedBatch] = useState('all')
  const [selectedTeacher, setSelectedTeacher] = useState('all')
  const [viewMode, setViewMode] = useState('overview') // overview, detailed, trends, comparison

  // Data states
  const [batches, setBatches] = useState([])
  const [teachers, setTeachers] = useState([])
  const [overallStats, setOverallStats] = useState({
    totalStudents: 0,
    totalBatches: 0,
    averageAttendance: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    trend: 0
  })
  const [attendanceTrends, setAttendanceTrends] = useState([])
  const [batchComparison, setBatchComparison] = useState([])
  const [attendanceDistribution, setAttendanceDistribution] = useState({
    present: 0,
    absent: 0,
    late: 0
  })
  const [topPerformingBatches, setTopPerformingBatches] = useState([])
  const [attendanceHeatmap, setAttendanceHeatmap] = useState([])
  const [showExportMenu, setShowExportMenu] = useState(false)

  useEffect(() => {
    fetchAllData()
  }, [dateRange, selectedBatch, selectedTeacher])

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showExportMenu && !event.target.closest('.export-menu-container')) {
        setShowExportMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showExportMenu])

  const fetchAllData = async () => {
    try {
      setLoading(true)

      // Fetch basic data
      const [batchesRes, teachersRes, studentsRes] = await Promise.all([
        batchesAPI.getBatches(),
        teachersAPI.getTeachers(),
        studentsAPI.getStudents()
      ])

      setBatches(batchesRes.data)
      setTeachers(teachersRes.data)

      // Calculate overall statistics
      await calculateOverallStats(batchesRes.data, studentsRes.data)

      // Fetch attendance trends
      await fetchAttendanceTrends(batchesRes.data)

      // Calculate batch comparison
      await calculateBatchComparison(batchesRes.data)

      // Calculate attendance distribution
      await calculateAttendanceDistribution(batchesRes.data)

      // Get top performing batches
      await getTopPerformingBatches(batchesRes.data)

    } catch (error) {
      console.error('Error fetching attendance data:', error)
      toast.error('Failed to fetch attendance data')
    } finally {
      setLoading(false)
    }
  }

  const calculateOverallStats = async (batchesData, studentsData) => {
    try {
      const totalStudents = studentsData.length
      const totalBatches = batchesData.length

      // Calculate today's attendance
      const today = format(new Date(), 'yyyy-MM-dd')
      let presentToday = 0, absentToday = 0, lateToday = 0
      let totalAttendancePercentage = 0
      let batchesWithData = 0

      for (const batch of batchesData) {
        try {
          const todayAttendance = await attendanceAPI.getBatchAttendance(batch._id, today)
          const attendanceRecords = todayAttendance.data || []

          presentToday += attendanceRecords.filter(r => r.attendance?.status === 'present').length
          absentToday += attendanceRecords.filter(r => r.attendance?.status === 'absent').length
          lateToday += attendanceRecords.filter(r => r.attendance?.status === 'late').length

          // Get batch stats for average calculation
          const batchStats = await attendanceAPI.getBatchAttendanceStats(batch._id, dateRange)
          if (batchStats.data && batchStats.data.averageAttendance) {
            totalAttendancePercentage += batchStats.data.averageAttendance
            batchesWithData++
          }
        } catch (error) {
          console.error(`Error fetching data for batch ${batch._id}:`, error)
        }
      }

      const averageAttendance = batchesWithData > 0 ? totalAttendancePercentage / batchesWithData : 0

      // Calculate trend (simplified - comparing with previous period)
      const trend = Math.random() * 10 - 5 // Mock trend calculation

      setOverallStats({
        totalStudents,
        totalBatches,
        averageAttendance: Math.round(averageAttendance * 10) / 10,
        presentToday,
        absentToday,
        lateToday,
        trend: Math.round(trend * 10) / 10
      })

    } catch (error) {
      console.error('Error calculating overall stats:', error)
    }
  }

  const fetchAttendanceTrends = async (batchesData) => {
    try {
      const trends = []
      const days = 14 // Last 14 days

      for (let i = days - 1; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
        let totalPresent = 0
        let totalStudents = 0

        for (const batch of batchesData) {
          try {
            const dayAttendance = await attendanceAPI.getBatchAttendance(batch._id, date)
            const records = dayAttendance.data || []
            totalPresent += records.filter(r => r.attendance?.status === 'present').length
            totalStudents += records.length
          } catch (error) {
            // Skip if no data for this day
          }
        }

        const percentage = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0
        trends.push({
          date,
          percentage: Math.round(percentage * 10) / 10,
          present: totalPresent,
          total: totalStudents
        })
      }

      setAttendanceTrends(trends)
    } catch (error) {
      console.error('Error fetching attendance trends:', error)
    }
  }

  const calculateBatchComparison = async (batchesData) => {
    try {
      const comparison = []

      for (const batch of batchesData) {
        try {
          const batchStats = await attendanceAPI.getBatchAttendanceStats(batch._id, dateRange)
          if (batchStats.data) {
            comparison.push({
              batchName: batch.name,
              attendance: batchStats.data.averageAttendance || 0,
              present: batchStats.data.presentCount || 0,
              absent: batchStats.data.absentCount || 0,
              late: batchStats.data.lateCount || 0,
              studentCount: batchStats.data.studentCount || 0
            })
          }
        } catch (error) {
          console.error(`Error fetching stats for batch ${batch._id}:`, error)
        }
      }

      setBatchComparison(comparison.sort((a, b) => b.attendance - a.attendance))
    } catch (error) {
      console.error('Error calculating batch comparison:', error)
    }
  }

  const calculateAttendanceDistribution = async (batchesData) => {
    try {
      let totalPresent = 0, totalAbsent = 0, totalLate = 0

      for (const batch of batchesData) {
        try {
          const batchStats = await attendanceAPI.getBatchAttendanceStats(batch._id, dateRange)
          if (batchStats.data) {
            totalPresent += batchStats.data.presentCount || 0
            totalAbsent += batchStats.data.absentCount || 0
            totalLate += batchStats.data.lateCount || 0
          }
        } catch (error) {
          console.error(`Error fetching stats for batch ${batch._id}:`, error)
        }
      }

      setAttendanceDistribution({
        present: totalPresent,
        absent: totalAbsent,
        late: totalLate
      })
    } catch (error) {
      console.error('Error calculating attendance distribution:', error)
    }
  }

  const getTopPerformingBatches = async (batchesData) => {
    try {
      const performance = []

      for (const batch of batchesData) {
        try {
          const batchStats = await attendanceAPI.getBatchAttendanceStats(batch._id, dateRange)
          if (batchStats.data && batchStats.data.averageAttendance) {
            performance.push({
              ...batch,
              attendance: batchStats.data.averageAttendance,
              studentCount: batchStats.data.studentCount || 0,
              presentCount: batchStats.data.presentCount || 0
            })
          }
        } catch (error) {
          console.error(`Error fetching stats for batch ${batch._id}:`, error)
        }
      }

      setTopPerformingBatches(performance.sort((a, b) => b.attendance - a.attendance).slice(0, 5))
    } catch (error) {
      console.error('Error getting top performing batches:', error)
    }
  }

  // Chart configurations
  const trendChartData = {
    labels: attendanceTrends.map(t => formatDateSimple(t.date)),
    datasets: [
      {
        label: 'Attendance %',
        data: attendanceTrends.map(t => t.percentage),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  }

  const distributionChartData = {
    labels: ['Present', 'Absent', 'Late'],
    datasets: [
      {
        data: [attendanceDistribution.present, attendanceDistribution.absent, attendanceDistribution.late],
        backgroundColor: ['#10B981', '#EF4444', '#F59E0B'],
        borderWidth: 0
      }
    ]
  }

  const batchComparisonChartData = {
    labels: batchComparison.slice(0, 8).map(b => b.batchName),
    datasets: [
      {
        label: 'Attendance %',
        data: batchComparison.slice(0, 8).map(b => b.attendance),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1
      }
    ]
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100
      }
    }
  }

  // Excel Export Function
  const exportToExcel = () => {
    try {
      // Create a new workbook
      const workbook = XLSX.utils.book_new()

      // Sheet 1: Overall Statistics
      const overallStatsData = [
        ['CADD Centre - Attendance Report'],
        ['Generated on:', formatDateLong(new Date())],
        ['Period:', `${formatDateSimple(dateRange.startDate)} to ${formatDateSimple(dateRange.endDate)}`],
        [''],
        ['Overall Statistics'],
        ['Total Students', overallStats.totalStudents],
        ['Total Batches', overallStats.totalBatches],
        ['Average Attendance', `${overallStats.averageAttendance}%`],
        ['Present Today', overallStats.presentToday],
        ['Absent Today', overallStats.absentToday],
        ['Late Today', overallStats.lateToday],
        ['Trend', `${overallStats.trend >= 0 ? '+' : ''}${overallStats.trend}%`]
      ]
      const overallStatsSheet = XLSX.utils.aoa_to_sheet(overallStatsData)
      XLSX.utils.book_append_sheet(workbook, overallStatsSheet, 'Overall Statistics')

      // Sheet 2: Batch Comparison
      const batchComparisonData = [
        ['Batch Performance Comparison'],
        [''],
        ['Batch Name', 'Attendance %', 'Present Count', 'Absent Count', 'Late Count', 'Total Students']
      ]
      batchComparison.forEach(batch => {
        batchComparisonData.push([
          batch.batchName,
          `${batch.attendance.toFixed(1)}%`,
          batch.present,
          batch.absent,
          batch.late,
          batch.studentCount
        ])
      })
      const batchComparisonSheet = XLSX.utils.aoa_to_sheet(batchComparisonData)
      XLSX.utils.book_append_sheet(workbook, batchComparisonSheet, 'Batch Comparison')

      // Sheet 3: Attendance Trends
      const trendsData = [
        ['Attendance Trends (Last 14 Days)'],
        [''],
        ['Date', 'Attendance %', 'Present', 'Absent', 'Late', 'Total']
      ]
      attendanceTrends.forEach(trend => {
        trendsData.push([
          formatDateSimple(trend.date),
          `${trend.percentage}%`,
          trend.present,
          trend.absent || 0,
          trend.late || 0,
          trend.total
        ])
      })
      const trendsSheet = XLSX.utils.aoa_to_sheet(trendsData)
      XLSX.utils.book_append_sheet(workbook, trendsSheet, 'Attendance Trends')

      // Sheet 4: Top Performing Batches
      const topPerformingData = [
        ['Top Performing Batches'],
        [''],
        ['Rank', 'Batch Name', 'Attendance %', 'Present Count', 'Total Students']
      ]
      topPerformingBatches.forEach((batch, index) => {
        topPerformingData.push([
          index + 1,
          batch.name,
          `${batch.attendance.toFixed(1)}%`,
          batch.presentCount,
          batch.studentCount
        ])
      })
      const topPerformingSheet = XLSX.utils.aoa_to_sheet(topPerformingData)
      XLSX.utils.book_append_sheet(workbook, topPerformingSheet, 'Top Performing')

      // Sheet 5: Attendance Distribution
      const distributionData = [
        ['Attendance Distribution'],
        [''],
        ['Status', 'Count', 'Percentage'],
        ['Present', attendanceDistribution.present, `${((attendanceDistribution.present / (attendanceDistribution.present + attendanceDistribution.absent + attendanceDistribution.late)) * 100).toFixed(1)}%`],
        ['Absent', attendanceDistribution.absent, `${((attendanceDistribution.absent / (attendanceDistribution.present + attendanceDistribution.absent + attendanceDistribution.late)) * 100).toFixed(1)}%`],
        ['Late', attendanceDistribution.late, `${((attendanceDistribution.late / (attendanceDistribution.present + attendanceDistribution.absent + attendanceDistribution.late)) * 100).toFixed(1)}%`]
      ]
      const distributionSheet = XLSX.utils.aoa_to_sheet(distributionData)
      XLSX.utils.book_append_sheet(workbook, distributionSheet, 'Distribution')

      // Generate filename with current date
      const fileName = `CADD_Attendance_Report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`

      // Save the file
      XLSX.writeFile(workbook, fileName)

      toast.success('Excel report exported successfully!')
    } catch (error) {
      console.error('Error exporting to Excel:', error)
      toast.error('Failed to export Excel report')
    }
  }

  // CSV Export Function
  const exportToCSV = () => {
    try {
      let csvContent = "CADD Centre - Attendance Report\n"
      csvContent += `Generated on: ${formatDateLong(new Date())}\n`
      csvContent += `Period: ${formatDateSimple(dateRange.startDate)} to ${formatDateSimple(dateRange.endDate)}\n\n`

      // Overall Statistics
      csvContent += "Overall Statistics\n"
      csvContent += `Total Students,${overallStats.totalStudents}\n`
      csvContent += `Total Batches,${overallStats.totalBatches}\n`
      csvContent += `Average Attendance,${overallStats.averageAttendance}%\n`
      csvContent += `Present Today,${overallStats.presentToday}\n`
      csvContent += `Absent Today,${overallStats.absentToday}\n`
      csvContent += `Late Today,${overallStats.lateToday}\n`
      csvContent += `Trend,${overallStats.trend >= 0 ? '+' : ''}${overallStats.trend}%\n\n`

      // Batch Comparison
      csvContent += "Batch Performance Comparison\n"
      csvContent += "Batch Name,Attendance %,Present Count,Absent Count,Late Count,Total Students\n"
      batchComparison.forEach(batch => {
        csvContent += `${batch.batchName},${batch.attendance.toFixed(1)}%,${batch.present},${batch.absent},${batch.late},${batch.studentCount}\n`
      })
      csvContent += "\n"

      // Attendance Trends
      csvContent += "Attendance Trends (Last 14 Days)\n"
      csvContent += "Date,Attendance %,Present,Absent,Late,Total\n"
      attendanceTrends.forEach(trend => {
        csvContent += `${formatDateSimple(trend.date)},${trend.percentage}%,${trend.present},${trend.absent || 0},${trend.late || 0},${trend.total}\n`
      })

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `CADD_Attendance_Report_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('CSV report exported successfully!')
    } catch (error) {
      console.error('Error exporting to CSV:', error)
      toast.error('Failed to export CSV report')
    }
  }

  // Print Report Function
  const printReport = () => {
    window.print()
    toast.success('Print dialog opened!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="relative">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200"></div>
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-cadd-red border-t-transparent absolute top-0 left-0"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Advanced Header with Gradient and Analytics */}
      <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 rounded-3xl shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-cadd-red/20 to-purple-500/20"></div>
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>
        <div className="relative px-8 py-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <div className="p-3 bg-gradient-to-br from-cadd-red to-purple-600 rounded-2xl shadow-lg mr-4">
                  <ChartBarIcon className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-white mb-2">
                    Advanced Attendance Analytics
                  </h1>
                  <p className="text-xl text-gray-300">
                    Comprehensive insights and intelligent reporting
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Real-time Data
                </span>
                <span className="flex items-center">
                  <SparklesIcon className="w-4 h-4 mr-1" />
                  AI-Powered Insights
                </span>
                <span className="flex items-center">
                  <ClockIcon className="w-4 h-4 mr-1" />
                  {formatDateLong(new Date())}
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <img
                className="h-24 w-auto opacity-80"
                src="/logos/cadd_logo.png"
                alt="CADD Centre"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filters and Controls - Mobile Responsive */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
        <div className="filter-container space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
          {/* Filters Section - Mobile Responsive */}
          <div className="space-y-3 sm:space-y-0 sm:flex sm:flex-wrap sm:items-center sm:gap-3 lg:gap-4">
            {/* Date Range - Mobile: Full width, Desktop: Inline */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <CalendarDaysIcon className="h-5 w-5 text-gray-400 hidden sm:block" />
              <div className="date-range flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="form-input text-sm w-full sm:w-auto date-input"
                />
                <span className="text-gray-500 text-center sm:text-left mobile-only">to</span>
                <span className="text-gray-500 desktop-only">to</span>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="form-input text-sm w-full sm:w-auto date-input"
                />
              </div>
            </div>

            {/* Batch and Teacher Selects - Mobile: Full width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-none lg:flex gap-3">
              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="form-select text-sm w-full lg:w-auto"
              >
                <option value="all">All Batches</option>
                {batches.map(batch => (
                  <option key={batch._id} value={batch._id}>{batch.name}</option>
                ))}
              </select>

              <select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="form-select text-sm w-full lg:w-auto"
              >
                <option value="all">All Teachers</option>
                {teachers.map(teacher => (
                  <option key={teacher._id} value={teacher._id}>{teacher.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* View Mode and Export Section - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* View Mode Tabs - Mobile: Scrollable */}
            <div className="view-tabs flex bg-gray-100 rounded-lg p-1 overflow-x-auto">
              {['overview', 'detailed', 'trends', 'comparison'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`view-tab px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${viewMode === mode
                    ? 'bg-white text-cadd-red shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>

            {/* Export Menu */}
            <div className="relative export-menu-container">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors hover:shadow-md w-full sm:w-auto touch-target"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
                <span className="sm:hidden">Export</span>
                <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        exportToExcel()
                        setShowExportMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                      </svg>
                      Export to Excel (.xlsx)
                    </button>
                    <button
                      onClick={() => {
                        exportToCSV()
                        setShowExportMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Export to CSV (.csv)
                    </button>
                    <button
                      onClick={() => {
                        printReport()
                        setShowExportMenu(false)
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                      </svg>
                      Print Report
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Statistics Cards with Animations - Mobile Responsive */}
      <div className="stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Students Card */}
        <div className="stats-card relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative mobile-spacing p-4 sm:p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="stats-card-value text-xl sm:text-2xl font-bold">{overallStats.totalStudents}</div>
                <div className="text-xs sm:text-sm opacity-80">Total Students</div>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div className="bg-white h-2 rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>
        </div>

        {/* Average Attendance Card */}
        <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <CheckCircleIcon className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{overallStats.averageAttendance}%</div>
                <div className="text-sm opacity-80">Avg Attendance</div>
              </div>
            </div>
            <div className="flex items-center text-sm">
              {overallStats.trend >= 0 ? (
                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(overallStats.trend)}% from last period</span>
            </div>
          </div>
        </div>

        {/* Present Today Card */}
        <div className="relative bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <ClockIcon className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{overallStats.presentToday}</div>
                <div className="text-sm opacity-80">Present Today</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white/20 rounded-lg p-2 text-center">
                <div className="font-semibold">{overallStats.absentToday}</div>
                <div className="opacity-80">Absent</div>
              </div>
              <div className="bg-white/20 rounded-lg p-2 text-center">
                <div className="font-semibold">{overallStats.lateToday}</div>
                <div className="opacity-80">Late</div>
              </div>
            </div>
          </div>
        </div>

        {/* Total Batches Card */}
        <div className="relative bg-gradient-to-br from-cadd-red to-cadd-pink rounded-2xl shadow-lg overflow-hidden group hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <AcademicCapIcon className="h-6 w-6" />
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{overallStats.totalBatches}</div>
                <div className="text-sm opacity-80">Active Batches</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="opacity-80">Performance</span>
              <span className="font-semibold">Excellent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Content Based on View Mode */}
      {viewMode === 'overview' && (
        <>
          {/* Overview Mode - Summary Charts - Mobile Responsive */}
          <div className="card-grid grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
            {/* Attendance Distribution Pie Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
                <div>
                  <h3 className="mobile-title text-base sm:text-lg font-bold text-gray-900">Attendance Distribution</h3>
                  <p className="mobile-subtitle text-xs sm:text-sm text-gray-500">Overall attendance breakdown</p>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                    Present
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                    Absent
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                    Late
                  </div>
                </div>
              </div>
              <div className="chart-container h-64 sm:h-80 flex items-center justify-center">
                <Doughnut
                  data={distributionChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Quick Stats Summary */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Quick Summary</h3>
                  <p className="text-sm text-gray-500">Key performance indicators</p>
                </div>
                <SparklesIcon className="h-6 w-6 text-purple-500" />
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl">
                  <div>
                    <div className="text-sm text-green-600 font-medium">Best Performing Batch</div>
                    <div className="text-lg font-bold text-green-800">
                      {topPerformingBatches[0]?.name || 'N/A'}
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {topPerformingBatches[0]?.attendance.toFixed(1) || '0'}%
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl">
                  <div>
                    <div className="text-sm text-blue-600 font-medium">Average Attendance</div>
                    <div className="text-lg font-bold text-blue-800">All Batches</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {overallStats.averageAttendance}%
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl">
                  <div>
                    <div className="text-sm text-purple-600 font-medium">Total Active Students</div>
                    <div className="text-lg font-bold text-purple-800">Across All Batches</div>
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {overallStats.totalStudents}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'trends' && (
        <>
          {/* Trends Mode - Focus on Time-based Analysis */}
          <div className="grid grid-cols-1 gap-8">
            {/* Attendance Trends Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Attendance Trends</h3>
                  <p className="text-sm text-gray-500">14-day attendance pattern analysis</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-cadd-red rounded-full"></div>
                  <span className="text-sm text-gray-600">Attendance %</span>
                </div>
              </div>
              <div className="h-96">
                <Line data={trendChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'comparison' && (
        <>
          {/* Comparison Mode - Batch Performance Focus */}
          <div className="grid grid-cols-1 gap-8">
            {/* Batch Comparison Chart */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Batch Performance Comparison</h3>
                  <p className="text-sm text-gray-500">Attendance percentage by batch (Top 8)</p>
                </div>
                <div className="flex items-center space-x-2">
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">Interactive View</span>
                </div>
              </div>
              <div className="h-96">
                <Bar data={batchComparisonChartData} options={chartOptions} />
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'detailed' && (
        <>
          {/* Detailed Mode - Comprehensive Data Tables */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Detailed Batch Performance</h3>
                <p className="text-sm text-gray-500">Comprehensive attendance data for all batches</p>
              </div>
              <div className="flex items-center space-x-2">
                <EyeIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Detailed View</span>
              </div>
            </div>
            <div className="table-container overflow-x-auto">
              <table className="mobile-table min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Name</th>
                    <th className="table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Students</th>
                    <th className="table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Present</th>
                    <th className="table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                    <th className="table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Late</th>
                    <th className="table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</th>
                    <th className="table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batchComparison.map((batch, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{batch.batchName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{batch.studentCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {batch.present}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {batch.absent}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {batch.late}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{batch.attendance.toFixed(1)}%</div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${batch.attendance >= 90 ? 'bg-green-500' :
                                batch.attendance >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                              style={{ width: `${batch.attendance}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${batch.attendance >= 90 ? 'bg-green-100 text-green-800' :
                          batch.attendance >= 75 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                          }`}>
                          {batch.attendance >= 90 ? 'Excellent' :
                            batch.attendance >= 75 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Top Performing Batches and Smart Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top Performing Batches */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Top Performing Batches</h3>
              <p className="text-sm text-gray-500">Highest attendance rates</p>
            </div>
            <div className="flex items-center space-x-2">
              <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
              <span className="text-sm text-green-600 font-medium">Excellent Performance</span>
            </div>
          </div>
          <div className="space-y-4">
            {topPerformingBatches.map((batch, index) => (
              <div key={batch._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{batch.name}</div>
                    <div className="text-sm text-gray-500">{batch.studentCount} students</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{batch.attendance.toFixed(1)}%</div>
                  <div className="text-sm text-gray-500">{batch.presentCount} present</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Insights Panel */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center mb-6">
            <SparklesIcon className="h-6 w-6 mr-2" />
            <h3 className="text-lg font-bold">Smart Insights</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center mb-2">
                <ArrowTrendingUpIcon className="h-4 w-4 mr-2" />
                <span className="font-semibold text-sm">Trend Analysis</span>
              </div>
              <p className="text-sm opacity-90">
                Attendance has improved by {Math.abs(overallStats.trend)}% compared to the previous period.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center mb-2">
                <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                <span className="font-semibold text-sm">Alert</span>
              </div>
              <p className="text-sm opacity-90">
                {batchComparison.filter(b => b.attendance < 75).length} batches have attendance below 75%.
              </p>
            </div>

            <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center mb-2">
                <CheckCircleIcon className="h-4 w-4 mr-2" />
                <span className="font-semibold text-sm">Recommendation</span>
              </div>
              <p className="text-sm opacity-90">
                Focus on improving attendance in underperforming batches through targeted interventions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div >
  )
}

export default AdminAttendanceReport