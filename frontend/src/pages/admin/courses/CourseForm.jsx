import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  AcademicCapIcon,
  BuildingOfficeIcon,
  ClockIcon,
  CurrencyRupeeIcon,
  DocumentTextIcon,
  CodeBracketIcon,
  CheckCircleIcon,
  XMarkIcon,
  UserGroupIcon,
  StarIcon,
  TagIcon,
  CalendarIcon,
  PlusIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { coursesAPI, departmentsAPI } from '../../../services/api';
import BackButton from '../../../components/BackButton';

const CourseForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    department: '',
    description: '',
    duration: {
      months: 1,
      hours: 40
    },
    fees: {
      amount: 0,
      currency: 'INR',
      installments: {
        allowed: true,
        numberOfInstallments: 1
      }
    },
    level: 'Beginner',
    category: 'Design',
    maxStudentsPerBatch: 20,
    prerequisites: [''],
    software: [{ name: '', version: '', required: true }],
    certification: {
      provided: true,
      certificateName: '',
      issuingAuthority: 'CADD Centre'
    },
    isActive: true
  });

  const [errors, setErrors] = useState({});

  // Course levels and categories
  const courseLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  const courseCategories = [
    'Design', 'Programming', 'Web Development', 'Mobile Development',
    'Data Science', 'Digital Marketing', 'Graphics', 'Animation', 'CAD', 'Other'
  ];

  const durationUnits = [
    { value: 1, label: '1 Month' },
    { value: 2, label: '2 Months' },
    { value: 3, label: '3 Months' },
    { value: 6, label: '6 Months' },
    { value: 12, label: '1 Year' },
    { value: 24, label: '2 Years' }
  ];

  useEffect(() => {
    fetchDepartments();
    if (isEdit) {
      fetchCourse();
    }
  }, [id]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentsAPI.getDepartments({ active: true });
      setDepartments(response.data || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to load departments');
    }
  };

  const fetchCourse = async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getCourseById(id);
      const course = response.data;

      setFormData({
        name: course.name || '',
        code: course.code || '',
        department: course.department?._id || '',
        description: course.description || '',
        duration: {
          months: course.duration?.months || 1,
          hours: course.duration?.hours || 40
        },
        fees: {
          amount: course.fees?.amount || 0,
          currency: course.fees?.currency || 'INR',
          installments: {
            allowed: course.fees?.installments?.allowed !== false,
            numberOfInstallments: course.fees?.installments?.numberOfInstallments || 1
          }
        },
        level: course.level || 'Beginner',
        category: course.category || 'Design',
        maxStudentsPerBatch: course.maxStudentsPerBatch || 20,
        prerequisites: course.prerequisites?.length > 0 ? course.prerequisites : [''],
        software: course.software?.length > 0 ? course.software : [{ name: '', version: '', required: true }],
        certification: {
          provided: course.certification?.provided !== false,
          certificateName: course.certification?.certificateName || '',
          issuingAuthority: course.certification?.issuingAuthority || 'CADD Centre'
        },
        isActive: course.isActive !== false
      });
    } catch (error) {
      console.error('Error fetching course:', error);
      toast.error('Failed to load course details');
      navigate('/admin/courses');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Course name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Course code is required';
    } else if (formData.code.length < 2 || formData.code.length > 20) {
      newErrors.code = 'Code must be between 2-20 characters';
    }

    if (!formData.department) {
      newErrors.department = 'Please select a department';
    }

    if (!formData.duration.months || formData.duration.months < 1) {
      newErrors.duration = 'Duration must be at least 1 month';
    }

    if (!formData.fees.amount || formData.fees.amount < 0) {
      newErrors.fees = 'Please enter a valid fee amount';
    }

    if (formData.maxStudentsPerBatch < 1 || formData.maxStudentsPerBatch > 50) {
      newErrors.maxStudents = 'Max students must be between 1-50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);

      // Clean up empty prerequisites and software
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        prerequisites: formData.prerequisites.filter(p => p.trim()),
        software: formData.software.filter(s => s.name.trim())
      };

      if (isEdit) {
        await coursesAPI.updateCourse(id, submitData);
        toast.success('Course updated successfully!');
      } else {
        await coursesAPI.createCourse(submitData);
        toast.success('Course created successfully!');
      }

      navigate('/admin/courses');
    } catch (error) {
      console.error('Error saving course:', error);
      toast.error(error.response?.data?.message || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        for (let i = 0; i < keys.length - 1; i++) {
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = type === 'checkbox' ? checked :
                                        type === 'number' ? Number(value) : value;
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked :
                type === 'number' ? Number(value) : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addPrerequisite = () => {
    setFormData(prev => ({
      ...prev,
      prerequisites: [...prev.prerequisites, '']
    }));
  };

  const removePrerequisite = (index) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter((_, i) => i !== index)
    }));
  };

  const updatePrerequisite = (index, value) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.map((p, i) => i === index ? value : p)
    }));
  };



  const addSoftware = () => {
    setFormData(prev => ({
      ...prev,
      software: [...prev.software, { name: '', version: '', required: true }]
    }));
  };

  const removeSoftware = (index) => {
    setFormData(prev => ({
      ...prev,
      software: prev.software.filter((_, i) => i !== index)
    }));
  };

  const updateSoftware = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      software: prev.software.map((s, i) =>
        i === index ? { ...s, [field]: field === 'required' ? value : value } : s
      )
    }));
  };

  if (loading && isEdit) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cadd-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <BackButton />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Course' : 'Add New Course'}
          </h1>
          <p className="text-gray-600">
            {isEdit ? 'Update course information' : 'Create a new course for CADD Centre'}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-cadd-red to-cadd-pink">
          <div className="flex items-center space-x-3">
            <AcademicCapIcon className="h-6 w-6 text-white" />
            <h2 className="text-lg font-semibold text-white">Course Information</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AcademicCapIcon className="h-4 w-4 inline mr-1" />
                  Course Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., AutoCAD 2D & 3D Design"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CodeBracketIcon className="h-4 w-4 inline mr-1" />
                  Course Code *
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., ACAD2D3D"
                  maxLength="20"
                />
                {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                  Department *
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.department ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
                {errors.department && <p className="text-red-500 text-sm mt-1">{errors.department}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <TagIcon className="h-4 w-4 inline mr-1" />
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                >
                  {courseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <StarIcon className="h-4 w-4 inline mr-1" />
                  Level
                </label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                >
                  {courseLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserGroupIcon className="h-4 w-4 inline mr-1" />
                  Max Students per Batch
                </label>
                <input
                  type="number"
                  name="maxStudentsPerBatch"
                  value={formData.maxStudentsPerBatch}
                  onChange={handleInputChange}
                  min="1"
                  max="50"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.maxStudents ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.maxStudents && <p className="text-red-500 text-sm mt-1">{errors.maxStudents}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DocumentTextIcon className="h-4 w-4 inline mr-1" />
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                placeholder="Brief description of the course..."
              />
            </div>
          </div>

          {/* Duration and Fees */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Duration & Fees</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ClockIcon className="h-4 w-4 inline mr-1" />
                  Duration (Months) *
                </label>
                <select
                  name="duration.months"
                  value={formData.duration.months}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.duration ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  {durationUnits.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
                {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CalendarIcon className="h-4 w-4 inline mr-1" />
                  Total Hours
                </label>
                <input
                  type="number"
                  name="duration.hours"
                  value={formData.duration.hours}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  placeholder="40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CurrencyRupeeIcon className="h-4 w-4 inline mr-1" />
                  Course Fees (₹) *
                </label>
                <input
                  type="number"
                  name="fees.amount"
                  value={formData.fees.amount}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent ${
                    errors.fees ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="15000"
                />
                {errors.fees && <p className="text-red-500 text-sm mt-1">{errors.fees}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Installments Allowed
                </label>
                <div className="flex items-center space-x-4 mt-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      name="fees.installments.allowed"
                      checked={formData.fees.installments.allowed}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-cadd-red focus:ring-cadd-red border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Allow installments</span>
                  </label>
                </div>
              </div>

              {formData.fees.installments.allowed && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Installments
                  </label>
                  <select
                    name="fees.installments.numberOfInstallments"
                    value={formData.fees.installments.numberOfInstallments}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cadd-red focus:border-transparent"
                  >
                    {[1, 2, 3, 4, 6, 12].map(num => (
                      <option key={num} value={num}>{num} installment{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                Course Status
              </label>
              <div className="flex items-center space-x-4 mt-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-cadd-red focus:ring-cadd-red border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Course is active</span>
                </label>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => navigate('/admin/courses')}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>Cancel</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-cadd-red to-cadd-pink text-white rounded-lg hover:from-cadd-pink hover:to-cadd-red transition-all duration-300 flex items-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
              <span>{isEdit ? 'Update Course' : 'Create Course'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseForm;
