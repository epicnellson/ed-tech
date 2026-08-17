import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { courseApi } from '../../api/courseApi';
import { useSocket } from '../../lib/socket';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { 
  ArrowLeft, Video, VideoOff, Users, Send, Circle,
  MessageSquare, MonitorPlay
} from 'lucide-react';
import { Skeleton } from '../../components/ui/Skeleton';

const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';

export default function CourseLiveView() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const jitsiRef = useRef(null);
  const jitsiApiRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [showChat, setShowChat] = useState(true);
  const messagesEndRef = useRef(null);

  const { data: courseData, isLoading } = useQuery({
    queryKey: ['course', courseId],
    queryFn: () => courseApi.getCourseById(courseId),
    enabled: !!courseId,
    refetchInterval: 10000,
  });

  const course = courseData?.data;
  const isLive = course?.isLive === true;
  const jitsiRoom = course?.jitsiRoom;

  const { isConnected, messages, users, error, sendMessage } = useSocket(courseId);

  useEffect(() => {
    if (error) {
      addToast({ title: 'Connection Error', description: error, type: 'error' });
    }
  }, [error, addToast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeJitsi = useCallback(() => {
    if (!isLive || !courseId || !jitsiRoom || jitsiApiRef.current) return;

    const roomName = jitsiRoom;
    
    if (jitsiRef.current) {
      try {
        jitsiApiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiRef.current,
          configOverjoin: {
            startWithAudioMuted: true,
            startWithVideoMuted: true,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverjoin: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#1f2937',
          },
          userInfo: {
            displayName: user?.name || 'Student',
          },
        });
      } catch (err) {
        console.error('Failed to initialize Jitsi:', err);
      }
    }
  }, [isLive, courseId, user?.name]);

  useEffect(() => {
    if (isLive && isConnected && jitsiRoom) {
      const timer = setTimeout(() => {
        initializeJitsi();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isLive, isConnected, jitsiRoom, initializeJitsi]);

  useEffect(() => {
    return () => {
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
    };
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    sendMessage({
      user: user?.name || 'Student',
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    });
    setNewMessage('');
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3">
            <Skeleton className="aspect-video w-full" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Course not found</p>
        <Link to="/dashboard" className="text-primary-600 hover:underline mt-2 inline-block">
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/courses/${courseId}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Live Class</h1>
              {isLive ? (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full animate-pulse">
                  <Circle className="w-2 h-2 fill-white" />
                  LIVE
                </span>
              ) : (
                <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs font-medium rounded-full">
                  OFFLINE
                </span>
              )}
            </div>
            <p className="text-gray-600">{course.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              {users.length} watching
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 order-1">
          <div className="card p-0 overflow-hidden">
            <div className="aspect-video bg-gray-900 relative flex items-center justify-center">
              {isLive ? (
                <div ref={jitsiRef} className="w-full h-full" />
              ) : (
                <div className="text-center p-8">
                  <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No Live Class Right Now</p>
                  <p className="text-gray-500 mt-2">
                    {course.teacher?.name || 'The teacher'} hasn't started a live session yet.
                  </p>
                  <p className="text-sm text-gray-600 mt-4">
                    Check back later or refresh the page when the class goes live.
                  </p>
                </div>
              )}
            </div>

            {!isLive && (
              <div className="p-4 border-t border-gray-200">
                <Link to={`/courses/${courseId}`} className="btn-secondary">
                  Back to Course
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 order-2 lg:order-3">
          <div className="card flex flex-col lg:h-[500px]">
            <button
              onClick={() => setShowChat(!showChat)}
              className="flex items-center justify-between lg:hidden w-full mb-2"
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Chat</h3>
              </div>
              <span className="text-sm text-gray-500">
                {showChat ? 'Hide' : 'Show'}
              </span>
            </button>
            <div className="hidden lg:flex items-center gap-2 mb-4">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <h3 className="font-semibold text-gray-900">Live Chat</h3>
            </div>

            {showChat && (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] lg:min-h-0">
              {!isLive ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Chat will be available when the class goes live
                </p>
              ) : !isConnected ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  Connecting to chat...
                </p>
              ) : messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  No messages yet. Say hi!
                </p>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="font-medium text-gray-900">{msg.user}: </span>
                    <span className="text-gray-700">{msg.text}</span>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={isLive && isConnected ? 'Send a message...' : 'Waiting for live...'}
                disabled={!isLive || !isConnected}
                className="input flex-1"
              />
              <button
                type="submit"
                disabled={!isLive || !isConnected || !newMessage.trim()}
                className="btn-primary p-2"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
