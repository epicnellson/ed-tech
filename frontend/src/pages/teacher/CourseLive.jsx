import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../../api/courseApi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { useSocket } from '../../lib/socket';
import { 
  ArrowLeft, Loader2, Video, VideoOff, Mic, MicOff, 
  Camera, Send, Users, Circle, MessageSquare
} from 'lucide-react';

const JITSI_DOMAIN = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';

export default function CourseLive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, token } = useAuth();
  const { addToast } = useToast();
  const jitsiRef = useRef(null);
  const jitsiApiRef = useRef(null);

  const [isLive, setIsLive] = useState(false);
  const [jitsiRoom, setJitsiRoom] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [showChat, setShowChat] = useState(true);
  const messagesEndRef = useRef(null);

  const { data: courseData, isLoading: courseLoading } = useQuery({
    queryKey: ['course', id],
    queryFn: () => courseApi.getCourseById(id),
    enabled: !!id,
  });

  const course = courseData?.data;

  const { isConnected, messages, users: roomUsers, error: socketError, sendMessage, sendHeartbeat } = useSocket(id);

  useEffect(() => {
    if (course?.isLive) {
      setIsLive(true);
    }
  }, [course?.isLive]);

  useEffect(() => {
    if (socketError) {
      addToast({ title: 'Chat Error', description: socketError, type: 'error' });
    }
  }, [socketError, addToast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const [isTabActive, setIsTabActive] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabActive(!document.hidden);
    };

    const handleBeforeUnload = () => {
      if (isLive) {
        stopLiveMutation.mutate();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLive]);

  useEffect(() => {
    let heartbeatInterval;
    if (isLive && isConnected && isTabActive && document.hasFocus()) {
      sendHeartbeat();
      heartbeatInterval = setInterval(() => {
        if (isTabActive && document.hasFocus()) {
          sendHeartbeat();
        }
      }, 15000);
    }
    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [isLive, isConnected, isTabActive, sendHeartbeat]);

  const initializeJitsi = useCallback(() => {
    if (!isLive || !id || !jitsiRoom || jitsiApiRef.current) return;

    const roomName = jitsiRoom;
    
    if (jitsiRef.current) {
      try {
        jitsiApiRef.current = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiRef.current,
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
          },
          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_BACKGROUND: '#1f2937',
          },
          userInfo: {
            displayName: user?.name || 'Teacher',
          },
        });

        jitsiApiRef.current.addEventListener('videoConferenceLeft', () => {
          console.log('Left Jitsi conference');
        });
      } catch (error) {
        console.error('Failed to initialize Jitsi:', error);
      }
    }
  }, [isLive, id, user?.name]);

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

  const goLiveMutation = useMutation({
    mutationFn: () => courseApi.goLive(id),
    onSuccess: (response) => {
      if (response.success) {
        setIsLive(true);
        setJitsiRoom(response.data.jitsiRoom);
        addToast({ title: 'Live!', description: 'Your class is now live', type: 'success' });
        queryClient.invalidateQueries({ queryKey: ['course', id] });
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to go live', type: 'error' });
    },
  });

  const stopLiveMutation = useMutation({
    mutationFn: () => courseApi.stopLive(id),
    onSuccess: (response) => {
      if (response.success) {
        setIsLive(false);
        addToast({ title: 'Ended', description: 'Live class has ended', type: 'info' });
        queryClient.invalidateQueries({ queryKey: ['course', id] });
      }
    },
    onError: (error) => {
      addToast({ title: 'Error', description: error.message || 'Failed to end live session', type: 'error' });
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !isConnected) return;

    sendMessage({
      user: user?.name || 'Teacher',
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    });
    setNewMessage('');
  };

  if (user?.role !== 'teacher' && user?.role !== 'admin') {
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

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/courses/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">Live Class</h1>
              {isLive && (
                <span className="flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs font-medium rounded-full animate-pulse">
                  <Circle className="w-2 h-2 fill-white" />
                  LIVE
                </span>
              )}
            </div>
            <p className="text-gray-600">{course?.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLive && isConnected && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              {roomUsers.length} watching
            </div>
          )}
          <button
            onClick={() => navigate(`/teacher/courses/${id}/students`)}
            className="btn-secondary"
          >
            View Students
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-3 order-1">
          <div className="card p-0 overflow-hidden">
            <div className="aspect-video bg-gray-900 relative flex items-center justify-center">
              {isLive ? (
                <div ref={jitsiRef} className="w-full h-full" />
              ) : (
                <div className="text-center">
                  <VideoOff className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Start your live class</p>
                </div>
              )}
              
              {isLive && (
                <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                  <button
                    onClick={() => {
                      if (jitsiApiRef.current) {
                        jitsiApiRef.current.executeCommand('toggleAudio');
                      }
                      setIsMuted(!isMuted);
                    }}
                    className={`p-2 rounded-full ${isMuted ? 'bg-red-500 text-white' : 'bg-white text-gray-700'}`}
                  >
                    {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      if (jitsiApiRef.current) {
                        jitsiApiRef.current.executeCommand('toggleVideo');
                      }
                      setIsVideoOn(!isVideoOn);
                    }}
                    className={`p-2 rounded-full ${!isVideoOn ? 'bg-red-500 text-white' : 'bg-white text-gray-700'}`}
                  >
                    {isVideoOn ? <Camera className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="font-medium text-primary-700">{user?.name?.charAt(0) || 'T'}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user?.name || 'Teacher'}</p>
                  <p className="text-sm text-gray-500">Host</p>
                </div>
              </div>

              {!isLive ? (
                <button
                  onClick={() => goLiveMutation.mutate()}
                  disabled={goLiveMutation.isPending}
                  className="btn-primary flex items-center gap-2 bg-red-600 hover:bg-red-700"
                >
                  {goLiveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  Start Class
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (window.confirm('End this live class?')) {
                      stopLiveMutation.mutate();
                    }
                  }}
                  disabled={stopLiveMutation.isPending}
                  className="btn-primary bg-red-600 hover:bg-red-700"
                >
                  {stopLiveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'End Class'
                  )}
                </button>
              )}
            </div>
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
            <h3 className="hidden lg:block font-semibold text-gray-900 mb-4">Live Chat</h3>

            {showChat && (
              <>
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] lg:min-h-0">
              {messages.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-8">
                  {isLive ? 'Chat messages will appear here' : 'Start the class to enable chat'}
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
                placeholder={isLive && isConnected ? 'Send a message...' : 'Start class to chat'}
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
