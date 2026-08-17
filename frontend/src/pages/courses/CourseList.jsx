import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { BookOpen, Search } from 'lucide-react';
import { courseApi } from '../../api/courseApi';
import { EmptyState } from '../../components/ui/EmptyState';

export default function CourseList() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page, search, category],
    queryFn: async () => {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      const response = await courseApi.getCourses(params);
      return response;
    },
  });

  const courses = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Courses</h1>
          <p className="text-gray-600">Discover courses from your institution</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10 w-full"
          />
        </div>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(1);
          }}
          className="input w-full sm:w-48"
        >
          <option value="">All Categories</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Business">Business</option>
          <option value="Engineering">Engineering</option>
        </select>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-40 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses found"
          description={search || category ? "Try adjusting your search or filters." : "No courses are available yet."}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course._id}
              to={`/courses/${course._id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-300" />
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-500 mb-2">{course.courseCode}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{course.category}</span>
                <span className="font-medium text-primary-600">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </span>
              </div>
              {course.teacher && (
                <p className="text-xs text-gray-500 mt-2">
                  By {course.teacher.name}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={!pagination.hasPrevPage}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!pagination.hasNextPage}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
