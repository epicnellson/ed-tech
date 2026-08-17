import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../../api/courseApi';
import { enrollmentApi } from '../../api/enrollmentApi';
import { assignmentApi } from '../../api/assignmentApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { Trash2, Edit2, Play, Upload, File, X, Loader2, FileText, Plus } from 'lucide-react';
import { resourceApi } from '../../api/resourceApi';

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isStudent } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  
  const { data, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await courseApi.getCourseById(id);
      return response;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  const enrollMutation = useMutation({
    mutationFn: () => enrollmentApi.enrollCourse(id),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Successfully enrolled in course', type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['course', id] });
        queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to enroll', type: 'error' });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: (data) => assignmentApi.createAssignment({ ...data, courseId: id }),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Assignment created', type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['course-assignments', id] });
        setShowAssignmentForm(false);
        setNewAssignment({ title: '', description: '', dueDate: '', maxScore: 100 });
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to create assignment', type: 'error' });
    },
  });

  const stopLiveMutation = useMutation({
    mutationFn: () => courseApi.stopLive(id),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Ended', description: 'Live class has ended', type: 'info' });
        queryClient.invalidateQueries({ queryKey: ['course', id] });
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to end live session', type: 'error' });
    },
  });

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('courseId', id);
      formData.append('title', file.name);
      
      await resourceApi.uploadResource(formData);
      addToast({ title: 'Success', description: 'File uploaded successfully', type: 'success' });
      queryClient.invalidateQueries({ queryKey: ['course', id] });
    } catch (error) {
      addToast({ title: 'Error', description: error.message || 'Failed to upload file', type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const course = data?.data;
  const isTeacher = course?.teacher?._id === user?._id || course?.teacher === user?._id;
  const isEnrolled = course?.enrolled === true || data?.data?.lessons?.some(l => l.progress) || false;

  const { data: assignmentsData } = useQuery({
    queryKey: ['course-assignments', id],
    queryFn: () => assignmentApi.getCourseAssignments(id),
    enabled: !!id,
  });

  const assignments = assignmentsData?.data || [];

  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [newAssignment, setNewAssignment] = useState({ title: '', description: '', dueDate: '', maxScore: 100 });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-6">
          <Skeleton className="w-48 h-32 rounded-lg" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Course not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-48 h-32 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
            {course.thumbnail && (
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover rounded-lg" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">{course.title}</h1>
                <p className="text-gray-500">{course.courseCode}</p>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize self-start">
                {course.privacy}
              </span>
            </div>
            
            <p className="mt-2 text-gray-600 line-clamp-2">{course.description}</p>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 text-sm text-gray-500">
              <span>{course.category}</span>
              <span className="hidden sm:inline">•</span>
              <span>{course.level}</span>
              <span className="hidden sm:inline">•</span>
              <span>Semester {course.semester}</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-4">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-primary-600">
                  {course.price === 0 ? 'Free' : `$${course.price}`}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {isStudent && !isEnrolled && !isTeacher && (
                  <button
                    onClick={() => enrollMutation.mutate()}
                    disabled={enrollMutation.isPending}
                    className="btn-primary"
                  >
                    {enrollMutation.isPending ? 'Enrolling...' : 'Enroll Now'}
                  </button>
                )}

                {isEnrolled && (
                  <button
                    onClick={() => navigate(`/courses/${id}/learn`)}
                    className="btn-primary"
                  >
                    Continue Learning
                  </button>
                )}

                {isEnrolled && course.isLive && (
                  <button
                    onClick={() => navigate(`/courses/${id}/live`)}
                    className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2"
                  >
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    Join Live Class
                  </button>
                )}
                
                {isTeacher && (
                  <div className="flex flex-wrap gap-2">
                    <Link to={`/teacher/courses/${id}/edit`} className="btn-secondary">
                      Edit
                    </Link>
                    <Link to={`/teacher/courses/${id}/modules`} className="btn-secondary">
                      Modules
                    </Link>
                    <Link 
                      to={`/teacher/courses/${id}/live`} 
                      className={`btn-primary ${course.isLive ? 'bg-red-600 hover:bg-red-700' : ''}`}
                    >
                      {course.isLive ? 'View Live' : 'Go Live'}
                    </Link>
                    {course.isLive && (
                      <button
                        onClick={() => {
                          if (window.confirm('End this live class?')) {
                            stopLiveMutation.mutate();
                          }
                        }}
                        disabled={stopLiveMutation.isPending}
                        className="btn-secondary text-red-600 border-red-200 hover:bg-red-50"
                      >
                        {stopLiveMutation.isPending ? 'Ending...' : 'Stop Live'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Course Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lessons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Course Content</h2>
            {course.lessons?.length === 0 ? (
              <p className="text-gray-500">No lessons available yet.</p>
            ) : (
              <div className="space-y-2">
                {course.lessons?.map((lesson, index) => (
                  <div
                    key={lesson._id}
                    className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg"
                  >
                    <span className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm text-gray-600">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{lesson.title}</p>
                      {lesson.description && (
                        <p className="text-sm text-gray-500">{lesson.description}</p>
                      )}
                    </div>
                    {lesson.progress?.completed && (
                      <span className="text-green-600">✓</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assignments */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
              {isTeacher && (
                <button
                  onClick={() => setShowAssignmentForm(true)}
                  className="btn-primary text-sm flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              )}
            </div>
            
            {showAssignmentForm && (
              <div className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h3 className="font-medium text-gray-900 mb-3">New Assignment</h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Assignment title"
                    className="input w-full"
                  />
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Description (optional)"
                    rows={2}
                    className="input w-full"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500">Due Date</label>
                      <input
                        type="date"
                        value={newAssignment.dueDate}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, dueDate: e.target.value }))}
                        className="input w-full"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Max Score</label>
                      <input
                        type="number"
                        value={newAssignment.maxScore}
                        onChange={(e) => setNewAssignment(prev => ({ ...prev, maxScore: parseInt(e.target.value) || 100 }))}
                        min="1"
                        max="1000"
                        className="input w-full"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowAssignmentForm(false)}
                      className="btn-secondary text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => createAssignmentMutation.mutate(newAssignment)}
                      disabled={createAssignmentMutation.isPending || !newAssignment.title.trim()}
                      className="btn-primary text-sm"
                    >
                      {createAssignmentMutation.isPending ? 'Creating...' : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {assignments.length === 0 ? (
              <p className="text-gray-500 text-sm">No assignments yet.</p>
            ) : (
              <div className="space-y-2">
                {assignments.map((assignment) => (
                  <div
                    key={assignment._id}
                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">{assignment.title}</p>
                        <p className="text-sm text-gray-500">
                          {assignment.maxScore || 100} points
                          {assignment.dueDate && ` • Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    {isTeacher && (
                      <Link
                        to={`/teacher/courses/${id}/assignments/${assignment._id}`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        View Submissions
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Instructor</h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium">
                  {course.teacher?.name?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{course.teacher?.name}</p>
                <p className="text-sm text-gray-500">{course.teacher?.email}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Course Details</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Faculty</dt>
                <dd className="text-gray-900">{course.faculty || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Program</dt>
                <dd className="text-gray-900">{course.program || 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Semester</dt>
                <dd className="text-gray-900">{course.semester}</dd>
              </div>
            </dl>
          </div>

          {/* File Upload - Teacher Only */}
          {isTeacher && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3">Course Resources</h3>
              <input
                type="file"
                ref={fileInputRef}
                onChange={uploadFile}
                accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {uploading ? 'Uploading...' : 'Attach Notes'}
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                PDF, DOC, PPT up to 10MB
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
