import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../../api/courseApi';
import { studentApi } from '../../api/userApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { Skeleton } from '../../components/ui/Skeleton';
import { 
  CheckCircle, Circle, BookOpen, Video, FileText, Play, Radio, 
  File, FileVideo, Image as ImageIcon, Download, ExternalLink, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function CoursePlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('content');
  const [selectedLesson, setSelectedLesson] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: async () => {
      const response = await courseApi.getCourseById(id);
      return response.data;
    },
    refetchInterval: 60000,
  });

  const course = data;
  const lessons = course?.lessons || [];
  const modules = course?.modules || [];

  const getCurrentLessonIndex = () => {
    if (!selectedLesson) return -1;
    return lessons.findIndex(l => l._id === selectedLesson._id);
  };

  const getNextLesson = () => {
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex >= 0 && currentIndex < lessons.length - 1) {
      return lessons[currentIndex + 1];
    }
    return null;
  };

  const nextLesson = getNextLesson();

  useEffect(() => {
    if (lessons.length > 0 && !selectedLesson) {
      setSelectedLesson(lessons[0]);
    }
  }, [lessons, selectedLesson]);

  const getLessonsForModule = (moduleId) => {
    return lessons.filter(l => String(l.moduleId) === String(moduleId) || (!l.moduleId && !moduleId));
  };

  const getUnmoduleLessons = () => {
    return lessons.filter(l => !l.moduleId);
  };

  const progressMutation = useMutation({
    mutationFn: ({ lessonId, data }) => studentApi.updateLessonProgress(lessonId, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['course', id] });
      if (response?.data?.progress?.completed) {
        addToast({ title: 'Progress saved', description: 'Lesson marked as complete', type: 'success' });
      }
    },
    onError: () => {
      addToast({ title: 'Error', description: 'Failed to update progress. Make sure you are enrolled.', type: 'error' });
    },
  });

  const handleLessonClick = (lesson) => {
    setSelectedLesson(lesson);
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Link 
            to={`/courses/${id}`} 
            className="text-sm text-gray-500 hover:text-gray-700 mb-1 inline-block"
          >
            ← Back to Course
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{course.title}</h1>
        </div>
        {course.isLive && (
          <Link
            to={`/courses/${id}/live`}
            className="btn-primary bg-red-600 hover:bg-red-700 flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Radio className="w-4 h-4" />
            Join Live Class
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'content'
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Lessons
            </button>
          </div>

          {/* Content */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {modules.length > 0 ? (
                modules.map((module) => (
                  <div key={module._id} className="card">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary-600" />
                      {module.title}
                    </h3>
                    {getLessonsForModule(module._id).length === 0 ? (
                      <p className="text-gray-500 text-sm">No lessons in this module yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {getLessonsForModule(module._id).map((lesson, index) => (
                          <LessonItem 
                            key={lesson._id} 
                            lesson={lesson} 
                            index={index + 1}
                            isSelected={selectedLesson?._id === lesson._id}
                            onClick={() => handleLessonClick(lesson)}
                            progressMutation={progressMutation}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : null}

              {getUnmoduleLessons().length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Other Lessons</h3>
                  <div className="space-y-3">
                    {getUnmoduleLessons().map((lesson, index) => (
                      <LessonItem 
                        key={lesson._id} 
                        lesson={lesson} 
                        index={lessons.length > 0 ? lessons.indexOf(lesson) + 1 : index + 1}
                        isSelected={selectedLesson?._id === lesson._id}
                        onClick={() => handleLessonClick(lesson)}
                        progressMutation={progressMutation}
                      />
                    ))}
                  </div>
                </div>
              )}

              {modules.length === 0 && getUnmoduleLessons().length === 0 && (
                <div className="card">
                  <p className="text-gray-500">No lessons available yet.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Progress</h3>
            <div className="text-center py-4">
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-gray-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={351.86}
                    strokeDashoffset={351.86 - (351.86 * (course.progress || 0)) / 100}
                    className="text-primary-600"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-900">
                    {course.progress || 0}%
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">Course Progress</p>
            </div>
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Instructor</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-700 font-medium">
                  {course.teacher?.name?.charAt(0)}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{course.teacher?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const getFileIcon = (type) => {
  if (!type) return <File className="w-4 h-4" />;
  if (type.includes('video')) return <FileVideo className="w-4 h-4 text-blue-500" />;
  if (type.includes('image')) return <ImageIcon className="w-4 h-4 text-green-500" />;
  if (type.includes('pdf')) return <File className="w-4 h-4 text-red-500" />;
  if (type.includes('word') || type.includes('doc')) return <File className="w-4 h-4 text-blue-600" />;
  if (type.includes('presentation') || type.includes('ppt')) return <File className="w-4 h-4 text-orange-600" />;
  return <File className="w-4 h-4 text-gray-400" />;
};

const formatSize = (bytes) => {
  if (!bytes) return '';
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
};

function LessonItem({ lesson, index, isSelected, onClick, progressMutation }) {
  const getIcon = () => {
    switch (lesson.type) {
      case 'video':
        return <Video className="w-4 h-4 text-blue-500" />;
      case 'quiz':
        return <FileText className="w-4 h-4 text-orange-500" />;
      case 'assignment':
        return <FileText className="w-4 h-4 text-purple-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`p-4 border rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'border-primary-500 bg-primary-50 shadow-sm' 
          : 'border-gray-100 hover:border-primary-300 hover:bg-gray-50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-primary-200 text-primary-700' : 'bg-primary-100 text-primary-700'
        }`}>
          <span className="font-medium">{index}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {getIcon()}
            <h3 className="font-medium text-gray-900 truncate">{lesson.title}</h3>
          </div>
          {lesson.description && (
            <p className="text-sm text-gray-500 mt-1">{lesson.description}</p>
          )}
          
          {isSelected && lesson.videoUrl && (
            <div className="mt-3">
              <video
                src={lesson.videoUrl}
                controls
                className="w-full rounded-lg"
                onEnded={() => {
                  progressMutation.mutate({
                    lessonId: lesson._id,
                    data: { completed: true, watchTime: 100 }
                  });
                }}
              />
            </div>
          )}
          
          {isSelected && lesson.content && (
            <div className="mt-3 prose prose-sm max-w-none text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100 whitespace-pre-wrap">
              {lesson.content}
            </div>
          )}

          {isSelected && lesson.attachments && lesson.attachments.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Resources</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lesson.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-all group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(file.type)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate group-hover:text-primary-700">
                          {file.name}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Download className="w-4 h-4 text-gray-400 group-hover:text-primary-600 flex-shrink-0" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            {lesson.progress?.completed ? (
              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                <CheckCircle className="w-3 h-3 mr-1" />
                Completed
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  progressMutation.mutate({
                    lessonId: lesson._id,
                    data: { completed: true, watchTime: 100 }
                  });
                }}
                disabled={progressMutation.isPending}
                className="btn-secondary py-1 px-3 text-xs"
              >
                {progressMutation.isPending ? 'Saving...' : 'Mark as Complete'}
              </button>
            )}
            {nextLesson && (
              <button
                onClick={() => setSelectedLesson(nextLesson)}
                className="flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Next Lesson
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
