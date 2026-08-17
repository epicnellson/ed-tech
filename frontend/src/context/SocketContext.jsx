import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [institution, setInstitution] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData?.institution) {
        socketRef.current.emit('join-institution', { institution: userData.institution });
        setInstitution(userData.institution);
      }
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  const joinRoom = useCallback((courseId) => {
    if (socketRef.current && isConnected && courseId) {
      socketRef.current.emit('join-room', { courseId });
      setCurrentRoom(courseId);
    }
  }, [isConnected]);

  const leaveRoom = useCallback((courseId) => {
    if (socketRef.current && courseId) {
      socketRef.current.emit('leave-room', { courseId });
      if (currentRoom === courseId) {
        setCurrentRoom(null);
      }
    }
  }, [currentRoom]);

  const sendMessage = useCallback((courseId, message) => {
    if (socketRef.current && isConnected && courseId) {
      socketRef.current.emit('chat-message', { courseId, message });
    }
  }, [isConnected]);

  const sendHeartbeat = useCallback((courseId) => {
    if (socketRef.current && isConnected && courseId) {
      socketRef.current.emit('teacher-heartbeat', { courseId });
    }
  }, [isConnected]);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, callback);
      }
    };
  }, []);

  const off = useCallback((event) => {
    if (socketRef.current) {
      socketRef.current.off(event);
    }
  }, []);

  const value = {
    socket: socketRef.current,
    isConnected,
    institution,
    currentRoom,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendHeartbeat,
    on,
    off,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocketContext() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within a SocketProvider');
  }
  return context;
}

export default SocketContext;
