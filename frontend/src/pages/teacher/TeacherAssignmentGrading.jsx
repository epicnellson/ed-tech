import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentApi } from '../../api/assignmentApi';
import { courseApi } from '../../api/courseApi';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, Loader2, FileText, CheckCircle, Clock, 
  Send, Star, User
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

export default function TeacherAssignmentGrading() {
  const { id: courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { isTeacher } = useAuth();
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingData, setGradingData] = useState({ score: '', feedback: '' });

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getCourseById(courseId),
    enabled: !!courseId,
  });

  const { data: assignmentsData, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['course-assignments', courseId],
    queryFn: () => assignmentApi.getCourseAssignments(courseId),
    enabled: !!courseId,
  });

  const course = courseData?.data;
  const assignments = assignmentsData?.data || [];
  const currentAssignment = assignmentId 
    ? assignments.find(a => a._id === assignmentId)
    : null;

  const { data: submissionsData, isLoading: submissionsLoading, refetch: refetchSubmissions } = useQuery({
    queryKey: ['assignment-submissions', assignmentId],
    queryFn: () => assignmentApi.getSubmissions(assignmentId),
    enabled: !!assignmentId,
  });

  const submissions = submissionsData?.data || [];

  const gradeMutation = useMutation({
    mutationFn: ({ submissionId, data }) => assignmentApi.gradeSubmission(assignmentId, { submissionId, ...data }),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Grade submitted successfully', type: 'success' });
        setGradingData({ score: '', feedback: '' });
        setSelectedSubmission(null);
        refetchSubmissions();
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to submit grade', type: 'error' });
    },
  });

  const handleGrade = (submissionId) => {
    const score = parseInt(gradingData.score);
    if (isNaN(score) || score < 0) {
      addToast({ title: 'Invalid Score', description: 'Please enter a valid score', type: 'warning' });
      return;
    }
    gradeMutation.mutate({ 
      submissionId, 
      data: { 
        score, 
        feedback: gradingData.feedback 
      } 
    });
  };

  const openGrading = (submission) => {
    setSelectedSubmission(submission);
    setGradingData({ 
      score: submission.score ?? '', 
      feedback: submission.feedback ?? '' 
    });
  };

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only teachers can grade assignments.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary-600 hover:underline">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (courseLoading || assignmentsLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assignment Grading</h1>
            <p className="text-gray-600">{course?.title}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assignment List */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Assignments</h2>
          {assignments.length === 0 ? (
            <p className="text-gray-500 text-sm">No assignments yet</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <button
                  key={assignment._id}
                  onClick={() => navigate(`/teacher/courses/${courseId}/assignments/${assignment._id}`)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    assignmentId === assignment._id 
                      ? 'bg-primary-50 border border-primary-200' 
                      : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  <p className="font-medium text-gray-900 text-sm">{assignment.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {assignment.maxScore || 100} points
                    {assignment.dueDate && ` • Due: ${new Date(assignment.dueDate).toLocaleDateString()}`}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Submissions */}
        <div className="lg:col-span-2 card">
          <h2 className="font-semibold text-gray-900 mb-4">
            {currentAssignment ? `Submissions: ${currentAssignment.title}` : 'Select an assignment'}
          </h2>
          
          {!assignmentId ? (
            <p className="text-gray-500 text-center py-8">
              Select an assignment from the list to view submissions
            </p>
          ) : submissionsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {submissions.map((submission) => (
                <div 
                  key={submission._id} 
                  className={`p-4 border rounded-lg ${
                    selectedSubmission?._id === submission._id 
                      ? 'border-primary-300 bg-primary-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {submission.student?.name || 'Unknown Student'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {submission.student?.email || 'No email'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Submitted: {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {submission.score !== null && submission.score !== undefined ? (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-medium text-gray-900">
                            {submission.score}/{currentAssignment?.maxScore || 100}
                          </span>
                        </div>
                      ) : (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {submission.content && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.content}</p>
                    </div>
                  )}

                  {submission.fileUrl && (
                    <div className="mt-3">
                      <a 
                        href={submission.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 hover:underline"
                      >
                        View Attachment
                      </a>
                    </div>
                  )}

                  {submission.feedback && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-sm text-green-800">Feedback: {submission.feedback}</p>
                    </div>
                  )}

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => openGrading(submission)}
                      className="btn-primary text-sm"
                    >
                      {submission.score !== null ? 'Update Grade' : 'Grade'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Grade: {selectedSubmission.student?.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score (out of {currentAssignment?.maxScore || 100})
                </label>
                <input
                  type="number"
                  value={gradingData.score}
                  onChange={(e) => setGradingData(prev => ({ ...prev, score: e.target.value }))}
                  min="0"
                  max={currentAssignment?.maxScore || 100}
                  className="input w-full"
                  placeholder="Enter score"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback (optional)
                </label>
                <textarea
                  value={gradingData.feedback}
                  onChange={(e) => setGradingData(prev => ({ ...prev, feedback: e.target.value }))}
                  rows={3}
                  className="input w-full"
                  placeholder="Provide feedback..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleGrade(selectedSubmission._id)}
                disabled={gradeMutation.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {gradeMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Grade
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
