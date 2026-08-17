import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../../api/courseApi';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { 
  ArrowLeft, Loader2, Plus, GripVertical, ChevronUp, ChevronDown, 
  Trash2, Edit2, BookOpen, Video, FileText, X, Save, PlayCircle, Upload, Paperclip
} from 'lucide-react';

export default function CourseModulesEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const { isTeacher } = useAuth();

  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [editingModuleId, setEditingModuleId] = useState(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState('');
  const [expandedModules, setExpandedModules] = useState({});
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content: '',
    videoUrl: '',
    type: 'video',
  });
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedLessonForUpload, setSelectedLessonForUpload] = useState(null);

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => courseApi.getCourseById(id),
    enabled: !!id,
  });

  const { data: lessonsData, isLoading: lessonsLoading, refetch: refetchLessons } = useQuery({
    queryKey: ['course-lessons', id],
    queryFn: () => courseApi.getLessons(id),
    enabled: !!id,
  });

  const course = courseData?.data;
  const allLessons = lessonsData?.data || [];

  useEffect(() => {
    if (course?.modules) {
      const expanded = {};
      course.modules.forEach(m => { expanded[m._id] = true; });
      setExpandedModules(expanded);
    }
  }, [course?.modules]);

  const addModuleMutation = useMutation({
    mutationFn: (title) => courseApi.addModule(id, title),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Module added', type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['course', id] });
        setNewModuleTitle('');
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to add module', type: 'error' });
    },
  });

  const updateModuleMutation = useMutation({
    mutationFn: ({ moduleId, data }) => courseApi.updateModule(id, moduleId, data),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Module updated', type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['course', id] });
        setEditingModuleId(null);
        setEditingModuleTitle('');
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to update module', type: 'error' });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId) => courseApi.deleteModule(id, moduleId),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Module deleted', type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['course', id] });
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to delete module', type: 'error' });
    },
  });

  const reorderModulesMutation = useMutation({
    mutationFn: (moduleIds) => courseApi.reorderModules(id, moduleIds),
    onSuccess: (response) => {
      if (response.success) {
        queryClient.invalidateQueries({ queryKey: ['course', id] });
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to reorder', type: 'error' });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: (lessonData) => courseApi.createLesson(id, lessonData),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Lesson added', type: 'success' });
        refetchLessons();
        setShowLessonModal(false);
        resetLessonForm();
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to add lesson', type: 'error' });
    },
  });

  const updateLessonMutation = useMutation({
    mutationFn: ({ lessonId, data }) => courseApi.updateLesson(id, lessonId, data),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Lesson updated', type: 'success' });
        refetchLessons();
        setShowLessonModal(false);
        setEditingLesson(null);
        resetLessonForm();
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to update lesson', type: 'error' });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: (lessonId) => courseApi.deleteLesson(id, lessonId),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'Lesson deleted', type: 'success' });
        refetchLessons();
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to delete lesson', type: 'error' });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: ({ lessonId, file }) => courseApi.uploadAttachment(id, lessonId, file),
    onSuccess: (response) => {
      if (response.success) {
        addToast({ title: 'Success', description: 'File uploaded successfully', type: 'success' });
        refetchLessons();
        setSelectedLessonForUpload(null);
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to upload file', type: 'error' });
    },
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLessonForUpload) return;
    
    setUploadingFile(true);
    uploadAttachmentMutation.mutate({ lessonId: selectedLessonForUpload, file });
    setUploadingFile(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetLessonForm = () => {
    setLessonForm({
      title: '',
      description: '',
      content: '',
      videoUrl: '',
      type: 'video',
    });
  };

  const handleAddModule = (e) => {
    e.preventDefault();
    if (!newModuleTitle.trim()) return;
    addModuleMutation.mutate(newModuleTitle.trim());
  };

  const handleUpdateModule = (moduleId) => {
    if (!editingModuleTitle.trim()) return;
    updateModuleMutation.mutate({ moduleId, data: { title: editingModuleTitle.trim() } });
  };

  const handleDeleteModule = (moduleId) => {
    if (window.confirm('Are you sure you want to delete this module and all its lessons?')) {
      deleteModuleMutation.mutate(moduleId);
    }
  };

  const moveModule = (index, direction) => {
    if (!course?.modules) return;
    const modules = [...course.modules];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= modules.length) return;
    
    [modules[index], modules[newIndex]] = [modules[newIndex], modules[index]];
    const moduleIds = modules.map(m => m._id);
    reorderModulesMutation.mutate(moduleIds);
  };

  const toggleModule = (moduleId) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const openAddLessonModal = (moduleId) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    resetLessonForm();
    setShowLessonModal(true);
  };

  const openEditLessonModal = (lesson) => {
    setEditingLesson(lesson);
    setSelectedModuleId(lesson.moduleId || null);
    setLessonForm({
      title: lesson.title || '',
      description: lesson.description || '',
      content: lesson.content || '',
      videoUrl: lesson.videoUrl || '',
      type: lesson.type || 'video',
    });
    setShowLessonModal(true);
  };

  const handleLessonSubmit = (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) {
      addToast({ title: 'Error', description: 'Lesson title is required', type: 'error' });
      return;
    }

    const lessonData = {
      ...lessonForm,
      moduleId: selectedModuleId,
    };

    if (editingLesson) {
      updateLessonMutation.mutate({ lessonId: editingLesson._id, data: lessonData });
    } else {
      createLessonMutation.mutate(lessonData);
    }
  };

  const handleDeleteLesson = (lessonId) => {
    if (window.confirm('Are you sure you want to delete this lesson?')) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const getLessonsForModule = (moduleId) => {
    return allLessons.filter(l => l.moduleId === moduleId || (!l.moduleId && moduleId === null));
  };

  const getModuleById = (moduleId) => {
    return course?.modules?.find(m => m._id === moduleId);
  };

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">You don't have permission to edit modules.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary-600 hover:underline">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (courseLoading || lessonsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/courses/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Modules</h1>
            <p className="text-gray-600">{course?.title}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/teacher/courses/${id}/students`)}
            className="btn-secondary"
          >
            View Students
          </button>
          <button
            onClick={() => navigate(`/teacher/courses/${id}/assignments`)}
            className="btn-secondary"
          >
            Assignments
          </button>
          <button
            onClick={() => navigate(`/teacher/courses/${id}/live`)}
            className="btn-primary"
          >
            Go Live
          </button>
        </div>
      </div>

      <div className="card mb-6">
        <form onSubmit={handleAddModule} className="flex gap-2">
          <input
            type="text"
            value={newModuleTitle}
            onChange={(e) => setNewModuleTitle(e.target.value)}
            placeholder="New module title..."
            className="input flex-1"
          />
          <button
            type="submit"
            disabled={addModuleMutation.isPending || !newModuleTitle.trim()}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Module
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {course?.modules?.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No modules yet. Add your first module above.</p>
          </div>
        )}

        {course?.modules?.map((module, index) => (
          <div key={module._id} className="card">
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveModule(index, 'up')}
                  disabled={index === 0}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => moveModule(index, 'down')}
                  disabled={index === course.modules.length - 1}
                  className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </button>
              </div>

              <div className="flex-1">
                {editingModuleId === module._id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editingModuleTitle}
                      onChange={(e) => setEditingModuleTitle(e.target.value)}
                      className="input flex-1"
                      autoFocus
                    />
                    <button
                      onClick={() => handleUpdateModule(module._id)}
                      className="btn-primary"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingModuleId(null)}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div 
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleModule(module._id)}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-5 h-5 text-gray-300" />
                      <h3 className="font-semibold text-gray-900">{module.title}</h3>
                      <span className="text-sm text-gray-500">
                        ({getLessonsForModule(module._id).length} lessons)
                      </span>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openAddLessonModal(module._id)}
                        className="p-2 hover:bg-green-50 rounded text-green-600"
                        title="Add Lesson"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingModuleId(module._id);
                          setEditingModuleTitle(module.title);
                        }}
                        className="p-2 hover:bg-gray-100 rounded"
                      >
                        <Edit2 className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDeleteModule(module._id)}
                        className="p-2 hover:bg-red-50 rounded"
                        disabled={deleteModuleMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {expandedModules[module._id] && (
              <div className="mt-4 ml-11 space-y-2">
                {getLessonsForModule(module._id).length === 0 ? (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">No lessons in this module</p>
                    <button
                      onClick={() => openAddLessonModal(module._id)}
                      className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Add Lesson
                    </button>
                  </div>
                ) : (
                  getLessonsForModule(module._id).map((lesson, lessonIndex) => (
                    <div
                      key={lesson._id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg group"
                    >
                      <div className="flex-1 flex items-center gap-3">
                        {lesson.type === 'video' ? (
                          <Video className="w-4 h-4 text-blue-500" />
                        ) : lesson.type === 'quiz' ? (
                          <FileText className="w-4 h-4 text-green-500" />
                        ) : (
                          <BookOpen className="w-4 h-4 text-gray-500" />
                        )}
                        <span className="text-sm text-gray-700">{lesson.title}</span>
                        {lesson.isPublished && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Published</span>
                        )}
                        {lesson.attachments && lesson.attachments.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded flex items-center gap-1">
                            <Paperclip className="w-3 h-3" />
                            {lesson.attachments.length}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileUpload}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLessonForUpload(lesson._id);
                          }}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="p-1.5 hover:bg-white rounded"
                          title="Upload file"
                          disabled={uploadAttachmentMutation.isPending}
                        >
                          <Upload className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        <button
                          onClick={() => openEditLessonModal(lesson)}
                          className="p-1.5 hover:bg-white rounded"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDeleteLesson(lesson._id)}
                          className="p-1.5 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {showLessonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingLesson ? 'Edit Lesson' : 'Add Lesson'}
              </h2>
              <button
                onClick={() => {
                  setShowLessonModal(false);
                  setEditingLesson(null);
                  resetLessonForm();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleLessonSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lesson Title *
                </label>
                <input
                  type="text"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="input"
                  placeholder="e.g., Introduction to the Course"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={lessonForm.type}
                  onChange={(e) => setLessonForm({ ...lessonForm, type: e.target.value })}
                  className="input"
                >
                  <option value="video">Video</option>
                  <option value="text">Text/Article</option>
                  <option value="quiz">Quiz</option>
                  <option value="assignment">Assignment</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Brief description of this lesson..."
                />
              </div>

              {lessonForm.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Video URL
                  </label>
                  <input
                    type="url"
                    value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    className="input"
                    placeholder="https://youtube.com/watch?v=..."
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  className="input"
                  rows={4}
                  placeholder="Lesson content (text, markdown, etc.)..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLessonModal(false);
                    setEditingLesson(null);
                    resetLessonForm();
                  }}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLessonMutation.isPending || updateLessonMutation.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {createLessonMutation.isPending || updateLessonMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingLesson ? 'Update Lesson' : 'Add Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
