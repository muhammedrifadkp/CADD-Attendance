import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  AcademicCapIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  StarIcon,
  TagIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { coursesAPI, departmentsAPI } from '../../../services/api';
import BackButton from '../../../components/BackButton';

const CoursesList = () => {
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ show: false, course: null });
  const [deleting, setDeleting] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const categories = [
    'Design', 'Programming', 'Web Development', 'Mobile Development',
    'Data Science', 'Digital Marketing', 'Graphics', 'Animation', 'CAD', 'Other'
  ];

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Handle URL parameters for department filtering
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const departmentParam = urlParams.get('department');
    if (departmentParam) {
      setSelectedDepartment(departmentParam);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [selectedDepartment, selectedLevel, selectedCategory, showActiveOnly, pagination.page]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getDepartments({ active: true });
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {};

      if (selectedDepartment) params.department = selectedDepartment;
      if (selectedLevel) params.level = selectedLevel;
      if (selectedCategory) params.category = selectedCategory;
      if (showActiveOnly) params.active = 'true';
      if (searchTerm) params.search = searchTerm;

      params.page = pagination.page.toString();
      params.limit = pagination.limit.toString();

      const response = await coursesAPI.getCourses(params);
      setCourses(response.data.courses || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination?.total || 0,
        pages: response.data.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('Error fetching courses:', error);
      toast.error('Failed to fetch courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (course) => {
    setDeleteModal({ show: true, course });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.course) return;

    try {
      setDeleting(true);
      await coursesAPI.deleteCourse(deleteModal.course._id);
      toast.success('Course deleted successfully!');
      setDeleteModal({ show: false, course: null });
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      toast.error(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, course: null });
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCourses();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedDepartment('');
    setSelectedLevel('');
    setSelectedCategory('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div className="flex items-center">
        <BackButton />
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-r from-cadd-red/10 to-cadd-pink/10 pointer-events-none"></div>
        <div className="relative px-8 py-12 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                {selectedDepartment && departments.find(d => d._id === selectedDepartment)
                  ? `${departments.find(d => d._id === selectedDepartment)?.name} Courses`
                  : 'Course Management'
                }
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                {selectedDepartment && departments.find(d => d._id === selectedDepartment)
                  ? `Manage courses for ${departments.find(d => d._id === selectedDepartment)?.name} department`
                  : 'Manage courses across all departments'
                }
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  {courses.length} Courses
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <AcademicCapIcon className="h-4 w-4 mr-1" />
                  Professional Training Programs
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <Link
                to="/admin/courses/new"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cadd-red to-cadd-pink text-white font-semibold rounded-xl shadow-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 transform hover:scale-105"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Course
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Courses</label>
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:ring-2 focus:ring-cadd-red focus:border-transparent"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept._id} value={dept._id}>{dept.name} ({dept.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <StarIcon className="h-4 w-4 inline mr-1" />
              Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:ring-2 focus:ring-cadd-red focus:border-transparent"
            >
              <option value="">All Levels</option>
              {levels.map(level => (
                <option key={level} value={level}>{level}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <TagIcon className="h-4 w-4 inline mr-1" />
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-3 py-3 focus:ring-2 focus:ring-cadd-red focus:border-transparent"
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activeOnly"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-cadd-red focus:ring-cadd-red"
              />
              <label htmlFor="activeOnly" className="text-sm text-gray-700 font-medium">
                Active courses only
              </label>
            </div>

            <div className="lg:hidden">
              <Link
                to="/admin/courses/new"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white font-semibold rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add
              </Link>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={handleSearch}
              className="bg-gradient-to-r from-cadd-red to-cadd-pink text-white px-6 py-2 rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 flex items-center gap-2"
            >
              <FunnelIcon className="h-4 w-4" />
              Apply Filters
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <span className="flex items-center">
            <AcademicCapIcon className="h-4 w-4 mr-1" />
            Total: {pagination.total}
          </span>
          <span className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
            Active: {courses.filter(c => c.isActive).length}
          </span>
          <span className="flex items-center">
            <XCircleIcon className="h-4 w-4 mr-1 text-red-500" />
            Inactive: {courses.filter(c => !c.isActive).length}
          </span>
        </div>
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <AcademicCapIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm || selectedDepartment || selectedLevel || selectedCategory
              ? 'Try adjusting your search criteria or check the active filter.'
              : 'Get started by creating your first course to offer professional training programs.'
            }
          </p>
          {!searchTerm && !selectedDepartment && !selectedLevel && !selectedCategory && (
            <Link
              to="/admin/courses/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cadd-red to-cadd-pink text-white font-semibold rounded-xl shadow-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create First Course
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses && courses.length > 0 && courses.map((course, index) => {
              // Safety check for course object
              if (!course || !course._id) {
                console.warn('Invalid course object:', course);
                return null;
              }
              return (
              <div
                key={course._id}
                className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-3 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-xl shadow-lg">
                        <AcademicCapIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-cadd-red transition-colors line-clamp-2">
                          {course.name}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">
                          Code: {course.code}
                        </p>
                        <p className="text-sm text-blue-600 font-medium">
                          {course.department?.name}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      course.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {course.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <ClockIcon className="h-4 w-4 mr-2 text-gray-400" />
                        Duration:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {course.duration?.months || 'N/A'} months
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <CurrencyRupeeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        Fees:
                      </span>
                      <span className="font-bold text-green-600">
                        ₹{(course.fees?.amount && typeof course.fees.amount === 'number') ? course.fees.amount.toLocaleString() : 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <StarIcon className="h-4 w-4 mr-2 text-gray-400" />
                        Level:
                      </span>
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-lg text-xs font-medium">
                        {course.level}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center text-gray-600">
                        <TagIcon className="h-4 w-4 mr-2 text-gray-400" />
                        Category:
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-xs font-medium">
                        {course.category}
                      </span>
                    </div>

                    {course.maxStudentsPerBatch && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center text-gray-600">
                          <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                          Max Students:
                        </span>
                        <span className="font-semibold text-gray-900">
                          {course.maxStudentsPerBatch}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to={`/admin/courses/${course._id}`}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Link>

                    <Link
                      to={`/admin/courses/${course._id}/edit`}
                      className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-cadd-red hover:bg-gray-50 rounded-lg transition-colors"
                      title="Edit Course"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Link>

                    <button
                      onClick={() => handleDeleteClick(course)}
                      className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Course"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>

              <span className="px-4 py-2 text-sm text-gray-600">
                Page {pagination.page} of {pagination.pages}
              </span>

              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Delete Course
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete <strong>{deleteModal.course?.name}</strong>?
              This action cannot be undone and will affect all associated batches and student data.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                disabled={deleting}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesList;
