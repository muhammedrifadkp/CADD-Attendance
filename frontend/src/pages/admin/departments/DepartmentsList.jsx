import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BuildingOfficeIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  CalendarIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-toastify';
import { departmentsAPI } from '../../../services/api';
import BackButton from '../../../components/BackButton';

const DepartmentsList = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ show: false, department: null });
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, [showActiveOnly]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (showActiveOnly) params.append('active', 'true');

      const response = await departmentsAPI.getDepartments(Object.fromEntries(params));
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (department) => {
    setDeleteModal({ show: true, department });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.department) return;

    try {
      setDeleting(true);
      await departmentsAPI.deleteDepartment(deleteModal.department._id);
      toast.success('Department deleted successfully!');
      setDeleteModal({ show: false, department: null });
      fetchDepartments();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error(error.response?.data?.message || 'Failed to delete department');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ show: false, department: null });
  };



  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
                Department Management
              </h1>
              <p className="text-xl text-gray-300 mb-4">
                Manage CDC departments and their information
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  {departments.length} Departments
                </span>
                <span>•</span>
                <span className="flex items-center">
                  <BuildingOfficeIcon className="h-4 w-4 mr-1" />
                  4 Core Departments: CADD, LIVEWIRE, DREAMZONE, SYNERGY
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <Link
                to="/admin/departments/new"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cadd-red to-cadd-pink text-white font-semibold rounded-xl shadow-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 transform hover:scale-105"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Add Department
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full lg:max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search departments by name, code, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-cadd-red focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="activeOnly"
                checked={showActiveOnly}
                onChange={(e) => setShowActiveOnly(e.target.checked)}
                className="rounded border-gray-300 text-cadd-red focus:ring-cadd-red"
              />
              <label htmlFor="activeOnly" className="text-sm text-gray-700 font-medium">
                Active only
              </label>
            </div>

            <div className="lg:hidden">
              <Link
                to="/admin/departments/new"
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white font-semibold rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
          <span className="flex items-center">
            <BuildingOfficeIcon className="h-4 w-4 mr-1" />
            Total: {departments.length}
          </span>
          <span className="flex items-center">
            <CheckCircleIcon className="h-4 w-4 mr-1 text-green-500" />
            Active: {departments.filter(d => d.isActive).length}
          </span>
          <span className="flex items-center">
            <XCircleIcon className="h-4 w-4 mr-1 text-red-500" />
            Inactive: {departments.filter(d => !d.isActive).length}
          </span>
        </div>
      </div>

      {/* Departments Grid */}
      {filteredDepartments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <BuildingOfficeIcon className="h-10 w-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No departments found</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {searchTerm
              ? 'Try adjusting your search criteria or check the active filter.'
              : 'Get started by creating your first department to organize your courses and programs.'}
          </p>
          {!searchTerm && (
            <Link
              to="/admin/departments/new"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-cadd-red to-cadd-pink text-white font-semibold rounded-xl shadow-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 transform hover:scale-105"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create First Department
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDepartments.map((department, index) => (
            <div
              key={department._id}
              className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-br from-cadd-red to-cadd-pink rounded-xl shadow-lg">
                      <BuildingOfficeIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-cadd-red transition-colors">
                        {department.name}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">
                        Code: {department.code}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    department.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {department.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {department.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {department.description}
                  </p>
                )}
              </div>

              {/* Card Body */}
              <div className="p-6">
                <div className="space-y-3 mb-6">
                  {department.headOfDepartment && (
                    <div className="flex items-center text-sm text-gray-600">
                      <UserIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>HOD: {department.headOfDepartment.name}</span>
                    </div>
                  )}

                  {department.establishedYear && (
                    <div className="flex items-center text-sm text-gray-600">
                      <CalendarIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>Established: {department.establishedYear}</span>
                    </div>
                  )}

                  {department.contactInfo?.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="truncate">{department.contactInfo.email}</span>
                    </div>
                  )}

                  {department.contactInfo?.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <PhoneIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{department.contactInfo.phone}</span>
                    </div>
                  )}

                  {(department.location?.building || department.location?.floor) && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPinIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>
                        {[department.location?.building, department.location?.floor]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}

                  {department.courseCount !== undefined && (
                    <div className="flex items-center text-sm text-gray-600">
                      <AcademicCapIcon className="h-4 w-4 mr-2 text-gray-400" />
                      <span>{department.courseCount} Courses</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2">
                  <Link
                    to={`/admin/courses?department=${department._id}`}
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <AcademicCapIcon className="h-4 w-4 mr-1" />
                    Courses
                  </Link>

                  <Link
                    to={`/admin/departments/${department._id}`}
                    className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-cadd-red hover:bg-gray-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </Link>

                  <Link
                    to={`/admin/departments/${department._id}/edit`}
                    className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit Department"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>

                  <button
                    onClick={() => handleDeleteClick(department)}
                    className="inline-flex items-center justify-center p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete Department"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Delete Department
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete <strong>{deleteModal.department?.name}</strong>?
              This action cannot be undone and will affect all associated courses and data.
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

export default DepartmentsList;
