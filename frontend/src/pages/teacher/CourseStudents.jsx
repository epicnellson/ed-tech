import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../../api/courseApi';
import { enrollmentApi } from '../../api/enrollmentApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { 
  ArrowLeft, Loader2, Users, Calendar, BarChart3, 
  BookOpen, Clock, TrendingUp, UserPlus, X
} from 'lucide-react';

export default function CourseStudents() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isTeacher } = useAuth();
  const { addToast } = useToast();

  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentEmail, setStudentEmail] = useState('');

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => courseApi.getCourseById(id),
    enabled: !!id,
  });

  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['course-enrollments', id],
    queryFn: () => enrollmentApi.getCourseEnrollments(id),
    enabled: !!id,
  });

  const enrollStudentMutation = useMutation({
    mutationFn: (email) => courseApi.enrollStudentByEmail(id, email),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: response.message, type: 'success' });
        setStudentEmail('');
        setShowAddStudent(false);
        queryClient.invalidateQueries({ queryKey: ['course-enrollments', id] });
      }
    },
    onError: (error) => {
      addToast({ 
        title: 'Error', 
        description: error.response?.data?.message || error.message || 'Failed to enroll student', 
        type: 'error' 
      });
    },
  });

  const handleAddStudent = (e) => {
    e.preventDefault();
    if (!studentEmail.trim()) return;
    enrollStudentMutation.mutate(studentEmail.trim());
  };

  const course = courseData?.data;
  const enrollments = enrollmentsData?.data || [];

  const totalStudents = enrollments.length;
  const pendingStudents = enrollments.filter(e => e.isPending).length;
  const activeStudents = enrollments.filter(e => !e.isPending).length;
  const completedStudents = activeStudents > 0 ? enrollments.filter(e => !e.isPending && e.progress === 100).length : 0;
  const inProgressStudents = activeStudents > 0 ? enrollments.filter(e => !e.isPending && e.progress > 0 && e.progress < 100).length : 0;
  const notStartedStudents = activeStudents > 0 ? enrollments.filter(e => !e.isPending && e.progress === 0).length : 0;
  const averageProgress = activeStudents > 0 
    ? Math.round(enrollments.filter(e => !e.isPending).reduce((acc, e) => acc + (e.progress || 0), 0) / activeStudents)
    : 0;

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">You don't have permission to view student insights.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary-600 hover:underline">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (courseLoading || enrollmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/courses/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Insights</h1>
            <p className="text-gray-600">{course?.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {course?.privacy === 'private' && (
            <button
              onClick={() => setShowAddStudent(true)}
              className="btn-secondary flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </button>
          )}
          <button
            onClick={() => navigate(`/teacher/courses/${id}/assignments`)}
            className="btn-secondary"
          >
            Assignments
          </button>
          <button
            onClick={() => navigate(`/teacher/courses/${id}/modules`)}
            className="btn-secondary"
          >
            Edit Modules
          </button>
          <button
            onClick={() => navigate(`/teacher/courses/${id}/live`)}
            className="btn-primary"
          >
            Go Live
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{completedStudents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{inProgressStudents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{pendingStudents}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg Progress</p>
              <p className="text-2xl font-bold text-gray-900">{averageProgress}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrolled Students</h2>
        
        {/* Add Student Modal */}
        {showAddStudent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Add Student by Email</h3>
                <button
                  onClick={() => {
                    setShowAddStudent(false);
                    setStudentEmail('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Enter the email address of a student from your institution to enroll them in this private course.
              </p>
              <form onSubmit={handleAddStudent}>
                <input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="input w-full mb-4"
                  required
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddStudent(false);
                      setStudentEmail('');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={enrollStudentMutation.isPending || !studentEmail.trim()}
                    className="btn-primary flex items-center gap-2"
                  >
                    {enrollStudentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    {enrollStudentMutation.isPending ? 'Adding...' : 'Add Student'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {enrollments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No students enrolled yet</p>
            <p className="text-sm mt-1">Share the course code to let students join</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full hidden md:table">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Enrolled</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Progress</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => (
                  <tr key={enrollment._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${enrollment.isPending ? 'bg-yellow-100' : 'bg-primary-100'}`}>
                          <span className={`text-sm font-medium ${enrollment.isPending ? 'text-yellow-700' : 'text-primary-700'}`}>
                            {enrollment.user?.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{enrollment.user?.name || 'Unknown'}</p>
                          <p className="text-xs text-gray-500">{enrollment.user?.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {enrollment.isPending ? (
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      ) : enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {enrollment.isPending ? (
                        <span className="text-sm text-gray-400">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary-600 rounded-full"
                              style={{ width: `${enrollment.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{enrollment.progress || 0}%</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {enrollment.isPending ? (
                        <span className="text-gray-400">—</span>
                      ) : (
                        enrollment.lastActivityAt 
                          ? new Date(enrollment.lastActivityAt).toLocaleDateString()
                          : 'No activity'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {enrollments.map((enrollment) => (
                <div key={enrollment._id} className="p-4 border border-gray-100 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="font-medium text-primary-700">
                        {enrollment.user?.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{enrollment.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{enrollment.user?.email || 'No email'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Enrolled</p>
                      <p className="text-gray-900">
                        {enrollment.enrolledAt ? new Date(enrollment.enrolledAt).toLocaleDateString() : '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Progress</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary-600 rounded-full"
                            style={{ width: `${enrollment.progress || 0}%` }}
                          />
                        </div>
                        <span>{enrollment.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
