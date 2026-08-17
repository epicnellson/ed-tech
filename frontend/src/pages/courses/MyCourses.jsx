import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { courseApi } from '../../api/courseApi';
import { enrollmentApi } from '../../api/enrollmentApi';

export default function MyCourses() {
  const { user, isTeacher, isStudent } = useAuth();

  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const response = await enrollmentApi.getMyEnrollments();
      return response.data || [];
    },
    enabled: isStudent,
  });

  const { data: coursesData } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await courseApi.getMyCourses();
      return response.data || [];
    },
    enabled: isTeacher,
  });

  const enrollments = enrollmentsData || [];
  const courses = coursesData || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isStudent ? 'My Enrolled Courses' : 'My Teaching Courses'}
          </h1>
          <p className="text-gray-600">
            {isStudent 
              ? 'Courses you are currently enrolled in' 
              : 'Courses you are teaching'}
          </p>
        </div>
        
        {isTeacher && (
          <Link to="/teacher/courses/new" className="btn-primary w-full sm:w-auto text-center">
            Create New Course
          </Link>
        )}
      </div>

      {isStudent && enrollments.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven't enrolled in any courses yet.</p>
          <Link to="/courses" className="btn-primary">
            Browse Courses
          </Link>
        </div>
      )}

      {isTeacher && courses.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">You haven't created any courses yet.</p>
          <Link to="/teacher/courses/new" className="btn-primary">
            Create Your First Course
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(isStudent ? enrollments : courses).map((item) => {
          const course = item.course || item;
          const progress = item.progress || 0;
          
          return (
            <Link
              key={item._id || course._id}
              to={`/courses/${course._id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="h-40 bg-gray-200 rounded-lg mb-4 overflow-hidden">
                {course.thumbnail ? (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl">
                    📚
                  </div>
                )}
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">
                {course.title}
              </h3>
              <p className="text-sm text-gray-500 mb-3">{course.courseCode}</p>
              
              {isStudent && (
                <div className="space-y-2">
                  {course.isLive && (
                    <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full animate-pulse">
                      🔴 Live Now
                    </span>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Progress</span>
                    <span className="font-medium text-gray-900">{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full">
                    <div
                      className="h-full bg-primary-600 rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {item.completed && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Completed ✓
                    </span>
                  )}
                </div>
              )}
              
              {isTeacher && (
                <div className="flex items-center gap-2 mt-2">
                  {course.isLive && (
                    <Link 
                      to={`/teacher/courses/${course._id}/live`}
                      className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full animate-pulse hover:bg-red-200"
                    >
                      🔴 Live
                    </Link>
                  )}
                  <span className="text-sm text-gray-500">
                    {course.privacy}
                  </span>
                </div>
              )}

              {isStudent && course.isLive && (
                <div className="mt-2">
                  <Link 
                    to={`/courses/${course._id}/live`}
                    className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full animate-pulse hover:bg-red-200"
                  >
                    🔴 Live Now
                  </Link>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
