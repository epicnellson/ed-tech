import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { courseApi } from '../../api/courseApi';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../context/AuthContext';
import { 
  Video, Loader2, Plus, Play, ArrowRight, BookOpen, Users, 
  Radio, Clock, Sparkles
} from 'lucide-react';

export default function QuickLive() {
  const navigate = useNavigate();
  const { user, isTeacher } = useAuth();
  const { addToast } = useToast();

  const [mode, setMode] = useState('select');
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [quickSessionTitle, setQuickSessionTitle] = useState('');

  const { data: coursesData, isLoading: coursesLoading } = useQuery({
    queryKey: ['my-courses'],
    queryFn: async () => {
      const response = await courseApi.getMyCourses();
      return response.data || [];
    },
    enabled: isTeacher,
  });

  const courses = coursesData || [];

  const createQuickCourseMutation = useMutation({
    mutationFn: async (title) => {
      const quickCourse = {
        title: title || `Live Session - ${new Date().toLocaleDateString()}`,
        description: 'Quick live session created for instant broadcasting',
        price: 0,
        category: 'Other',
        level: 'All Levels',
        privacy: 'institution',
        institution: user.institution,
        courseCode: `LIVE${Date.now().toString().slice(-6)}`,
        faculty: '',
        program: '',
        semester: 1,
      };
      return courseApi.createCourse(quickCourse);
    },
    onSuccess: (response) => {
      if (response.success) {
        setSelectedCourseId(response.data._id);
        setMode('go-live');
        addToast({ 
          title: 'Session Created', 
          description: 'Quick session created, ready to go live!', 
          type: 'success' 
        });
      }
    },
    onError: (error) => {
      addToast({ 
        title: 'Error', 
        description: error.message || 'Failed to create quick session', 
        type: 'error' 
      });
    },
  });

  const handleSelectCourse = (e) => {
    e.preventDefault();
    if (selectedCourseId) {
      navigate(`/teacher/courses/${selectedCourseId}/live`);
    }
  };

  const handleCreateQuickSession = (e) => {
    e.preventDefault();
    const title = quickSessionTitle.trim() || `Live Session - ${new Date().toLocaleDateString()}`;
    createQuickCourseMutation.mutate(title);
  };

  const handleStartLive = () => {
    if (selectedCourseId) {
      navigate(`/teacher/courses/${selectedCourseId}/live`);
    }
  };

  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-xl font-semibold text-gray-900">Access Denied</h2>
        <p className="text-gray-600 mt-2">Only teachers can host live classes.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 text-primary-600 hover:underline">
          Go to Dashboard
        </button>
      </div>
    );
  }

  if (coursesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-red-100 rounded-xl">
            <Radio className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Host Live Class</h1>
            <p className="text-gray-600">Start a live session instantly - no course required</p>
          </div>
        </div>
      </div>

      {courses.length > 0 ? (
        <div className="grid gap-6">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Select Existing Course
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose a course you've already created to go live with
            </p>
            
            <form onSubmit={handleSelectCourse}>
              <select
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
                className="input mb-4"
                required
              >
                <option value="">Select a course...</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title} ({course.courseCode})
                    {course.isLive ? ' - 🔴 LIVE' : ''}
                  </option>
                ))}
              </select>
              
              <button
                type="submit"
                disabled={!selectedCourseId}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                Go to Live Studio
              </button>
            </form>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          <div className="card border-2 border-dashed border-red-200 bg-red-50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Quick Session</h2>
                <p className="text-sm text-gray-500">Start a live session without creating a full course</p>
              </div>
            </div>

            <form onSubmit={handleCreateQuickSession}>
              <input
                type="text"
                value={quickSessionTitle}
                onChange={(e) => setQuickSessionTitle(e.target.value)}
                placeholder="Session title (optional)"
                className="input mb-4"
              />
              
              <button
                type="submit"
                disabled={createQuickCourseMutation.isPending}
                className="btn-primary w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
              >
                {createQuickCourseMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Create Quick Session & Go Live
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="card border-2 border-dashed border-red-200 bg-red-50">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Courses Yet - Start Instantly!
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't created any courses. Create a quick session to go live immediately, 
              or create a full course first for a more structured experience.
            </p>

            <div className="space-y-3 max-w-sm mx-auto">
              <form onSubmit={handleCreateQuickSession}>
                <input
                  type="text"
                  value={quickSessionTitle}
                  onChange={(e) => setQuickSessionTitle(e.target.value)}
                  placeholder="Session title (optional)"
                  className="input mb-3"
                />
                <button
                  type="submit"
                  disabled={createQuickCourseMutation.isPending}
                  className="btn-primary w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  {createQuickCourseMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  Start Quick Live Session
                </button>
              </form>
              
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-red-50 text-gray-500">or</span>
                </div>
              </div>

              <button
                onClick={() => navigate('/teacher/courses/new')}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Create Full Course First
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 card bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          How Live Classes Work
        </h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Students can join live sessions from their course page</li>
          <li>• Use this page to start broadcasting instantly</li>
          <li>• Students will see a "Live Now" indicator when you're broadcasting</li>
          <li>• You can also go live from any course's edit page</li>
        </ul>
      </div>
    </div>
  );
}
