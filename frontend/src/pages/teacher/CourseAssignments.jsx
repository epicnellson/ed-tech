import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { courseApi } from '../../api/courseApi';
import { assignmentApi } from '../../api/assignmentApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { 
  ArrowLeft, Loader2, Users, FileText, Plus, Clock,
  CheckCircle, AlertCircle, Upload, X, File, Paperclip
} from 'lucide-react';

export default function CourseAssignments() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isTeacher } = useAuth();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    description: '',
    dueDate: '',
    maxScore: 100
  });
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => courseApi.getCourseById(id),
    enabled: !!id,
  });

  const { data: assignmentsData, isLoading: assignmentsLoading, refetch } = useQuery({
    queryKey: ['course-assignments', id],
    queryFn: () => assignmentApi.getCourseAssignments(id),
    enabled: !!id,
  });

  const course = courseData?.data;
  const assignments = assignmentsData?.data || [];

  const createAssignmentMutation = useMutation({
    mutationFn: ({ data, file }) => assignmentApi.createAssignment(data, file),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Assignment created as draft. Click publish to make it visible to students.', type: 'success' });
        setShowCreateModal(false);
        setNewAssignment({ title: '', description: '', dueDate: '', maxScore: 100 });
        setAttachment(null);
        setAttachmentPreview(null);
        refetch();
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to create assignment', type: 'error' });
    }
  });

  const publishMutation = useMutation({
    mutationFn: ({ id, isPublished }) => assignmentApi.togglePublish(id, isPublished),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ 
          title: response.data.isPublished ? 'Published' : 'Unpublished', 
          description: response.message, 
          type: 'success' 
        });
        refetch();
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to update publish status', type: 'error' });
    }
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'];
      if (!allowedTypes.includes(file.type)) {
        addToast({ title: 'Invalid File', description: 'Only PDF, DOC, DOCX, PPT, PPTX files are allowed', type: 'error' });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        addToast({ title: 'File Too Large', description: 'File size must be less than 50MB', type: 'error' });
        return;
      }
      setAttachment(file);
      setAttachmentPreview({ name: file.name, size: file.size, type: file.type });
    }
  };

  const handleCreateAssignment = (e) => {
    e.preventDefault();
    const data = {
      courseId: id,
      title: newAssignment.title,
      description: newAssignment.description,
      dueDate: newAssignment.dueDate || null,
      maxScore: parseInt(newAssignment.maxScore)
    };
    createAssignmentMutation.mutate({ data, file: attachment });
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only teachers can view assignments.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary-600 hover:underline">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (courseLoading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const getStatusBadge = (assignment) => {
    if (!assignment.isPublished) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          Draft - Not visible to students
        </span>
      );
    }
    
    if (!assignment.dueDate) return null;
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    const isOverdue = now > dueDate;
    
    if (isOverdue) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
          <AlertCircle className="w-3 h-3" />
          Overdue
        </span>
      );
    }
    
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    if (daysUntilDue <= 3) {
      return (
        <span className="flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
          <Clock className="w-3 h-3" />
          Due soon
        </span>
      );
    }
    
    return (
      <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
        <Clock className="w-3 h-3" />
        Upcoming
      </span>
    );
  };

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
            <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
            <p className="text-gray-600">{course?.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
          <button
            onClick={() => navigate(`/teacher/courses/${id}/students`)}
            className="btn-secondary"
          >
            Students
          </button>
          <button
            onClick={() => navigate(`/teacher/courses/${id}/live`)}
            className="btn-secondary"
          >
            Live
          </button>
        </div>
      </div>

      <div className="card">
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Assignments Yet</h3>
            <p className="text-gray-500 mb-4">Create assignments to assess your students</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Assignment
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => (
              <div
                key={assignment._id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/teacher/courses/${id}/assignments/${assignment._id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-50 rounded-lg">
                    <FileText className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                    <p className="text-sm text-gray-500">
                      {assignment.description?.substring(0, 100) || 'No description'}
                      {assignment.description?.length > 100 ? '...' : ''}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-gray-500">
                        Max Score: {assignment.maxScore || 100}
                      </span>
                      {assignment.dueDate && (
                        <span className="text-xs text-gray-500">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {assignment.attachment && (
                        <span className="flex items-center gap-1 text-xs text-primary-600">
                          <Paperclip className="w-3 h-3" />
                          Attached
                        </span>
                      )}
                      {getStatusBadge(assignment)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {assignment.isPublished ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        publishMutation.mutate({ id: assignment._id, isPublished: false });
                      }}
                      disabled={publishMutation.isPending}
                      className="text-xs px-2 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        publishMutation.mutate({ id: assignment._id, isPublished: true });
                      }}
                      disabled={publishMutation.isPending}
                      className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Publish
                    </button>
                  )}
                  {assignment.submissionsCount > 0 && (
                    <span className="flex items-center gap-1 text-sm text-gray-500">
                      <CheckCircle className="w-4 h-4" />
                      {assignment.submissionsCount} submissions
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <h3 className="font-medium text-gray-900 mb-2">Quick Stats</h3>
          <p className="text-3xl font-bold text-primary-600">{assignments.length}</p>
          <p className="text-sm text-gray-500">Total Assignments</p>
        </div>
        <div className="card">
          <h3 className="font-medium text-gray-900 mb-2">Need Grading</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {assignments.filter(a => a.pendingCount > 0).length}
          </p>
          <p className="text-sm text-gray-500">Assignments with pending submissions</p>
        </div>
        <div className="card">
          <h3 className="font-medium text-gray-900 mb-2">Course Actions</h3>
          <div className="space-y-2">
            <button
              onClick={() => navigate(`/teacher/courses/${id}/modules`)}
              className="w-full text-left text-sm text-primary-600 hover:text-primary-700"
            >
              → Edit Course Modules
            </button>
            <button
              onClick={() => navigate(`/teacher/courses/${id}/students`)}
              className="w-full text-left text-sm text-primary-600 hover:text-primary-700"
            >
              → View Student Progress
            </button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Create Assignment</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleCreateAssignment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                    className="input w-full"
                    placeholder="Enter assignment title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newAssignment.description}
                    onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                    className="input w-full h-24"
                    placeholder="Enter assignment description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Due Date
                    </label>
                    <input
                      type="datetime-local"
                      value={newAssignment.dueDate}
                      onChange={(e) => setNewAssignment({ ...newAssignment, dueDate: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Score
                    </label>
                    <input
                      type="number"
                      value={newAssignment.maxScore}
                      onChange={(e) => setNewAssignment({ ...newAssignment, maxScore: e.target.value })}
                      className="input w-full"
                      min="1"
                      max="1000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Attachment (PDF, DOC, PPT)
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    {attachmentPreview ? (
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <File className="w-8 h-8 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {attachmentPreview.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(attachmentPreview.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearAttachment}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="cursor-pointer text-center py-4"
                      >
                        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Click to upload assignment file
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          PDF, DOC, DOCX, PPT, PPTX (max 50MB)
                        </p>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createAssignmentMutation.isPending || !newAssignment.title}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {createAssignmentMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
