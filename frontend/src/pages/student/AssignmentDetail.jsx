import { useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assignmentApi } from '../../api/assignmentApi';
import { courseApi } from '../../api/courseApi';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, Loader2, FileText, Calendar, Clock, 
  Upload, CheckCircle, AlertCircle, BookOpen, File, ExternalLink
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

export default function AssignmentDetail() {
  const { id: assignmentId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { isStudent } = useAuth();
  const fileInputRef = useRef(null);
  
  const [submissionText, setSubmissionText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: assignmentData, isLoading } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => assignmentApi.getAssignmentById(assignmentId),
    enabled: !!assignmentId,
  });

  const { data: submissionData } = useQuery({
    queryKey: ['my-submission', assignmentId],
    queryFn: () => assignmentApi.getMySubmission(assignmentId),
    enabled: !!assignmentId && isStudent,
  });

  const assignment = assignmentData?.data;
  const submission = submissionData?.data;

  const submitMutation = useMutation({
    mutationFn: (data) => assignmentApi.submitAssignment(assignmentId, data),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ 
          title: 'Success', 
          description: 'Assignment submitted successfully', 
          type: 'success' 
        });
        queryClient.invalidateQueries({ queryKey: ['my-submission', assignmentId] });
        setSubmissionText('');
        setSelectedFile(null);
      }
    },
    onError: (error) => {
      addToast({ 
        title: 'Error', 
        description: error.message || 'Failed to submit assignment', 
        type: 'error' 
      });
    },
  });

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!submissionText.trim() && !selectedFile) {
      addToast({ 
        title: 'Required', 
        description: 'Please provide text answer or attach a file', 
        type: 'warning' 
      });
      return;
    }

    const data = {};
    if (submissionText.trim()) {
      data.content = submissionText;
    }
    if (selectedFile) {
      data.fileUrl = selectedFile.name;
    }

    submitMutation.mutate(data);
  };

  const isPastDue = assignment?.dueDate && new Date(assignment.dueDate) < new Date();
  const canSubmit = !submission && !isPastDue && isStudent;

  if (!isStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only students can view assignments.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary-600 hover:underline">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Assignment not found</p>
        <Link to="/tasks" className="text-primary-600 hover:underline mt-2 inline-block">
          Back to Tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link to="/tasks" className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to Tasks
        </Link>
      </div>

      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{assignment.title}</h1>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <BookOpen className="w-4 h-4" />
              <span>{assignment.course?.title || 'Unknown Course'}</span>
            </div>
          </div>
          {submission ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
              <CheckCircle className="w-4 h-4" />
              Submitted
            </span>
          ) : isPastDue ? (
            <span className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-full">
              <AlertCircle className="w-4 h-4" />
              Past Due
            </span>
          ) : (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
              Pending
            </span>
          )}
        </div>

        {assignment.description && (
          <div className="prose max-w-none mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{assignment.description}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 border-t pt-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span>{assignment.maxScore || 100} points</span>
          </div>
        </div>
      </div>

      {submission && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Submission</h2>
          
          {submission.content && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Your Answer:</p>
              <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                {submission.content}
              </p>
            </div>
          )}

          {submission.fileUrl && (
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-1">Attached File:</p>
              <a 
                href={submission.fileUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-600 hover:underline p-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-primary-300"
              >
                <File className="w-5 h-5" />
                <span className="truncate">
                  {submission.fileUrl.split('/').pop() || 'View Attached File'}
                </span>
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
          )}

          <div className="text-sm text-gray-500">
            Submitted: {new Date(submission.submittedAt).toLocaleString()}
          </div>

          {submission.graded && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-green-800">Grade</span>
                <span className="text-lg font-bold text-green-700">
                  {submission.score}/{assignment.maxScore || 100}
                </span>
              </div>
              {submission.feedback && (
                <div>
                  <p className="text-sm text-green-700">Feedback:</p>
                  <p className="text-green-800">{submission.feedback}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {canSubmit && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Submit Your Work</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Written Answer (optional)
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                rows={6}
                className="input w-full"
                placeholder="Type your answer here..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Attach File (optional)
              </label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-primary-500 hover:text-primary-600"
              >
                <Upload className="w-4 h-4" />
                {selectedFile ? selectedFile.name : 'Choose File'}
              </button>
              {selectedFile && (
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="ml-2 text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitMutation.isPending || (!submissionText.trim() && !selectedFile)}
                className="btn-primary flex items-center gap-2"
              >
                {submitMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Submit Assignment
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {!canSubmit && !submission && (
        <div className="card bg-gray-50">
          <p className="text-gray-500 text-center">
            This assignment is no longer accepting submissions.
          </p>
        </div>
      )}
    </div>
  );
}
