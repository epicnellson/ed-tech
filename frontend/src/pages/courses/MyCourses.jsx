import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { courseApi } from '../../api/courseApi';
import { enrollmentApi } from '../../api/enrollmentApi';
import { Progress } from '../../components/ui/Progress';
import { EmptyState } from '../../components/ui/EmptyState';

export default function MyCourses() {
  const { user, isTeacher, isStudent } = useAuth();

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['enrollments'],
    queryFn: async () => {
      const response = await enrollmentApi.getMyEnrollments();
      return response.data || [];
    },
    enabled: isStudent,
  });

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await courseApi.getMyCourses();
      return response.data || [];
    },
    enabled: isTeacher,
  });

  const enrollments = enrollmentsData || [];
  const courses = coursesData || [];
  const isLoading = isStudent ? enrollmentsLoading : coursesLoading;

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
      ) : (isStudent ? enrollments : courses).length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={isStudent ? "No courses yet" : "No courses created"}
          description={isStudent 
            ? "Join a course with a code or browse to get started."
            : "Create your first course to start teaching."}
          actionLabel={isStudent ? "Browse Courses" : "Create Course"}
          onAction={() => window.location.href = isStudent ? '/courses' : '/teacher/courses/new'}
        />
      ) : (
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
                <p className="text-sm text-gray-500 mb-3">{course.courseCode}</p>
                
                {isStudent && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-gray-900">{progress}%</span>
                    </div>
                    <Progress value={progress} />
                    {item.completed && (
                      <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Completed
                      </span>
                    )}
                    {course.isLive && (
                      <Link 
                        to={`/courses/${course._id}/live`}
                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full animate-pulse hover:bg-red-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Live Now
                      </Link>
                    )}
                  </div>
                )}
                
                {isTeacher && (
                  <div className="flex items-center gap-2 mt-2">
                    {course.isLive && (
                      <Link 
                        to={`/teacher/courses/${course._id}/live`}
                        className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full animate-pulse hover:bg-red-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Live
                      </Link>
                    )}
                    <span className="text-sm text-gray-500">
                      {course.privacy}
                    </span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
