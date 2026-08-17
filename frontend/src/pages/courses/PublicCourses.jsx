import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { publicCourseApi } from '../../api/courseApi';

export default function PublicCourses() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['public-courses', page, search, category],
    queryFn: async () => {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (category) params.category = category;
      const response = await publicCourseApi.getPublicCourses(params);
      return response;
    },
  });

  const courses = data?.data || [];
  const pagination = data?.pagination;
  const filters = data?.filters || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900">Course Catalog</h1>
            <p className="mt-2 text-gray-600">Explore free courses from our platform</p>
          </div>

          {/* Search */}
          <div className="max-w-2xl mx-auto mt-6">
            <input
              type="text"
              placeholder="Search courses..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <button
              onClick={() => setCategory('')}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                !category 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {filters.categories?.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm transition-colors ${
                  category === cat 
                    ? 'bg-primary-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4" />
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No public courses available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Link
                key={course._id}
                to={`/courses/${course._id}`}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                  {course.thumbnail ? (
                    <img
                      src={course.thumbnail}
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">
                      📚
                    </div>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{course.courseCode}</p>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                  {course.description}
                </p>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{course.category}</span>
                  <span className="font-bold text-primary-600">
                    {course.price === 0 ? 'Free' : `$${course.price}`}
                  </span>
                </div>
                
                {course.teacher && (
                  <p className="text-xs text-gray-500 mt-3">
                    By {course.teacher.name}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.total > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-sm text-gray-600">
              Page {page} of {pagination.pages}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= pagination.pages}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
