import { io } from 'socket.io-client';
import { useEffect, useState, useRef, useCallback } from 'react';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export function useSocket(courseId) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No authentication token');
      return;
    }

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      setError(null);
      if (courseId) {
        socketRef.current.emit('join-room', { courseId });
      }
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('chat-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    socketRef.current.on('room-users', (roomUsers) => {
      setUsers(roomUsers);
    });

    socketRef.current.on('user-connected', (user) => {
      setUsers(prev => [...prev, user]);
    });

    socketRef.current.on('user-disconnected', ({ userId }) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
    });

    socketRef.current.on('live-started', (data) => {
      window.dispatchEvent(new CustomEvent('live-started', { detail: data }));
    });

    socketRef.current.on('live-ended', (data) => {
      window.dispatchEvent(new CustomEvent('live-ended', { detail: data }));
    });

    socketRef.current.on('error', ({ msg }) => {
      setError(msg);
    });
  }, [courseId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setMessages([]);
    setUsers([]);
  }, []);

  const sendMessage = useCallback((message) => {
    if (socketRef.current && isConnected && courseId) {
      socketRef.current.emit('chat-message', { courseId, message });
    }
  }, [courseId, isConnected]);

  const sendHeartbeat = useCallback(() => {
    if (socketRef.current && isConnected && courseId) {
      socketRef.current.emit('teacher-heartbeat', { courseId });
    }
  }, [courseId, isConnected]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, messages, users, error, sendMessage, sendHeartbeat };
}

export function useInstitutionSocket(institution) {
  const [isConnected, setIsConnected] = useState(false);
  const [liveCourses, setLiveCourses] = useState([]);
  const socketRef = useRef(null);

  const connect = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token || !institution) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current.on('connect', () => {
      setIsConnected(true);
      socketRef.current.emit('join-institution', { institution });
    });

    socketRef.current.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current.on('live-started', (data) => {
      setLiveCourses(prev => {
        if (prev.find(c => c.courseId === data.courseId)) return prev;
        return [...prev, data];
      });
      window.dispatchEvent(new CustomEvent('live-started', { detail: data }));
    });

    socketRef.current.on('live-ended', (data) => {
      setLiveCourses(prev => prev.filter(c => c.courseId !== data.courseId));
      window.dispatchEvent(new CustomEvent('live-ended', { detail: data }));
    });
  }, [institution]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setLiveCourses([]);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, liveCourses };
}

export default getSocket;
