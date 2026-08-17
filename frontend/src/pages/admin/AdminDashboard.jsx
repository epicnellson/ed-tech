import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/userApi';

export default function AdminDashboard() {
  const { data: statsData } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const response = await adminApi.getStats();
      return response.data;
    },
  });

  const { data: usersData } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await adminApi.getUsers({ limit: 5 });
      return response.data;
    },
  });

  const { data: coursesData } = useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const response = await adminApi.getCourses({ limit: 5 });
      return response.data;
    },
  });

  const stats = statsData || {};
  const users = usersData || [];
  const courses = coursesData || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your platform</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Total Courses</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalCourses || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Enrollments</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalEnrollments || 0}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500">Institutions</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats.totalInstitutions || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Users</h2>
            <Link to="/admin/users" className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>
          {users.length === 0 ? (
            <p className="text-gray-500">No users found</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 font-medium">
                        {user.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                    {user.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Courses */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Courses</h2>
            <Link to="/admin/courses" className="text-sm text-primary-600 hover:text-primary-700">
              View All
            </Link>
          </div>
          {courses.length === 0 ? (
            <p className="text-gray-500">No courses found</p>
          ) : (
            <div className="space-y-3">
              {courses.map((course) => (
                <div key={course._id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{course.title}</p>
                    <p className="text-sm text-gray-500">{course.courseCode}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    course.privacy === 'public' 
                      ? 'bg-green-100 text-green-700' 
                      : course.privacy === 'institution'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {course.privacy}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
