import { useState, useEffect } from 'react';
import api from '../../services/api';

const TestAPI = () => {
  const [departments, setDepartments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    testAPI();
  }, []);

  const testAPI = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Testing API endpoints...');

      // Test departments
      console.log('Fetching departments...');
      const deptResponse = await api.get('/departments');
      console.log('Departments response:', deptResponse.data);
      setDepartments(deptResponse.data);

      // Test courses
      console.log('Fetching courses...');
      const coursesResponse = await api.get('/courses');
      console.log('Courses response:', coursesResponse.data);
      setCourses(coursesResponse.data.courses || []);

    } catch (error) {
      console.error('API Test Error:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">API Test</h1>
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          <span>Testing API endpoints...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">API Test Results</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-3">Departments ({departments.length})</h2>
          {departments.length > 0 ? (
            <ul className="space-y-2">
              {departments.map((dept) => (
                <li key={dept._id} className="p-2 bg-gray-50 rounded">
                  <div className="font-medium">{dept.name}</div>
                  <div className="text-sm text-gray-600">Code: {dept.code}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No departments found</p>
          )}
        </div>

        {/* Courses */}
        <div className="bg-white p-4 rounded-lg shadow border">
          <h2 className="text-lg font-semibold mb-3">Courses ({courses.length})</h2>
          {courses.length > 0 ? (
            <ul className="space-y-2">
              {courses.map((course) => (
                <li key={course._id} className="p-2 bg-gray-50 rounded">
                  <div className="font-medium">{course.name}</div>
                  <div className="text-sm text-gray-600">
                    Code: {course.code} | Dept: {course.department?.name}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No courses found</p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Next Steps:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ If departments show up: API authentication is working</li>
          <li>✅ If courses is empty: Normal (no courses created yet)</li>
          <li>❌ If error appears: Check authentication or backend</li>
        </ul>
      </div>

      <button
        onClick={testAPI}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Retry Test
      </button>
    </div>
  );
};

export default TestAPI;
