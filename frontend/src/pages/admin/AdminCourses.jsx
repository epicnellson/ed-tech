import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/userApi';
import { useToast } from '../../components/ui/Toast';
import { 
  Search, BookOpen, User, Calendar, Archive, Loader2
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

export default function AdminCourses() {
  const [search, setSearch] = useState('');
  const [privacy, setPrivacy] = useState('');
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses', page, search, privacy],
    queryFn: async () => {
      const response = await adminApi.getCourses({ 
        page, 
        limit: 10, 
        search: search || undefined,
        privacy: privacy || undefined 
      });
      return response.data;
    },
  });

  const updateArchiveMutation = useMutation({
    mutationFn: ({ courseId, isArchived }) => adminApi.updateCourseArchive(courseId, isArchived),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Course status updated', type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to update course', type: 'error' });
    },
  });

  const courses = data?.data || [];
  const pagination = data?.pagination || {};

  const handleToggleArchive = (courseId, currentStatus) => {
    updateArchiveMutation.mutate({ courseId, isArchived: !currentStatus });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <p className="text-gray-600">Manage platform courses</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input pl-10"
          />
        </div>
        <select
          value={privacy}
          onChange={(e) => { setPrivacy(e.target.value); setPage(1); }}
          className="input w-full sm:w-40"
        >
          <option value="">All Privacy</option>
          <option value="public">Public</option>
          <option value="institution">Institution</option>
          <option value="private">Private</option>
        </select>
      </div>

      {/* Courses Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No courses found</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Course</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Teacher</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Privacy</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{course.title}</p>
                        <p className="text-sm text-gray-500">{course.courseCode}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {course.teacher?.name || 'Unknown'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 text-xs rounded-full capitalize ${
                        course.privacy === 'public' 
                          ? 'bg-green-100 text-green-700' 
                          : course.privacy === 'institution'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {course.privacy}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {course.isArchived ? (
                        <span className="text-red-600 text-sm">Archived</span>
                      ) : (
                        <span className="text-green-600 text-sm">Active</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link 
                          to={`/courses/${course._id}`}
                          className="text-sm text-primary-600 hover:underline"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleToggleArchive(course._id, course.isArchived)}
                          disabled={updateArchiveMutation.isPending}
                          className={`text-sm px-3 py-1 rounded ${
                            course.isArchived 
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          }`}
                        >
                          {updateArchiveMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : course.isArchived ? 'Unarchive' : 'Archive'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between py-4 px-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-secondary text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
