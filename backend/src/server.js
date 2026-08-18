require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const path = require('path');
const connectDB = require('./config/db');
const { validateEnv } = require('./config/validateEnv');
const { rateLimit } = require('./middleware/rateLimiter');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');
const User = require('./models/User');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const logger = require('./services/logger');

validateEnv();

const app = express();
const server = http.createServer(app);

const isProduction = process.env.NODE_ENV === 'production';

function normalizeOrigin(url) {
  if (!url) return '';
  url = url.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  return url.replace(/\/+$/, '');
}

const allowedOrigin = isProduction ? normalizeOrigin(process.env.CLIENT_URL) : true;

const corsOptions = {
  origin: allowedOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true
};

const io = socketio(server, {
  cors: corsOptions
});

module.exports = { io };

connectDB();

const MAX_BODY_SIZE = '20mb'; // Limit request body size

app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: MAX_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_BODY_SIZE }));
app.use(cors(corsOptions));

if (!isProduction) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts, please try again later'
});

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later'
});

app.use('/api/auth', authRateLimit, require('./routes/auth'));
app.use('/api', apiRateLimit, require('./routes/resourceRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/courses', require('./routes/moduleRoutes'));
app.use('/api/courses', require('./routes/lessonRoutes'));
app.use('/api/enrollments', require('./routes/enrollments'));
app.use('/api/admin', require('./routes/admin'));
// Quiz routes removed - feature no longer needed
// app.use('/api/quiz', require('./routes/quizRoutes'));
app.use('/api/metadata', require('./routes/metadataRoutes'));
app.use('/api/assignments', require('./routes/assignmentRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/students', require('./routes/studentRoutes'));
app.use('/api/public', require('./routes/publicRoutes'));
app.use('/api/users', require('./routes/userRoutes'));

app.use(notFound);
app.use(errorHandler);

const rooms = new Map();

const teacherHeartbeats = new Map();

const TEACHER_HEARTBEAT_INTERVAL = 15000;
const TEACHER_HEARTBEAT_TIMEOUT = 120000;

const cleanupHeartbeat = (courseId) => {
  teacherHeartbeats.delete(courseId);
};

const setupHeartbeatTimeout = (io, courseId) => {
  setTimeout(async () => {
    const lastHeartbeat = teacherHeartbeats.get(courseId);
    if (lastHeartbeat && Date.now() - lastHeartbeat > TEACHER_HEARTBEAT_TIMEOUT) {
      try {
        const course = await Course.findById(courseId);
        if (course && course.isLive) {
          course.isLive = false;
          await course.save();
          console.log(`Auto-ended live session for course ${courseId} due to heartbeat timeout`);
          io.to(courseId).emit('live-ended', { courseId, reason: 'teacher_disconnected' });
        }
      } catch (err) {
        console.error('Error auto-ending live session:', err);
      }
      cleanupHeartbeat(courseId);
    }
  }, TEACHER_HEARTBEAT_TIMEOUT + 5000);
};

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.query.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.user.id).select('id name email institution role');
    
    if (!user) {
      return next(new Error('User not found'));
    }

    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id, 'User:', socket.user?.name);

  socket.on('join-room', async ({ courseId }) => {
    try {
      if (!courseId) {
        socket.emit('error', { msg: 'Course ID is required' });
        return;
      }

      const course = await Course.findById(courseId);
      if (!course) {
        socket.emit('error', { msg: 'Course not found' });
        return;
      }

      if (!course.teacher) {
        socket.emit('error', { msg: 'Course has no teacher assigned' });
        return;
      }

      const teacherId = String(course.teacher);
      const userId = String(socket.user._id);

      if (course.institution !== socket.user.institution) {
        socket.emit('error', { msg: 'You can only join live sessions for your institution' });
        return;
      }

      if (course.privacy === 'private') {
        const isTeacher = teacherId === userId;
        const isAdmin = socket.user.role === 'admin';
        
        if (!isTeacher && !isAdmin) {
          const enrollment = await Enrollment.findOne({
            student: socket.user._id,
            course: courseId
          });
          
          if (!enrollment) {
            socket.emit('error', { msg: 'You must be enrolled in this private course to join the live session' });
            return;
          }
        }
      }

      const isEnrolled = await Enrollment.findOne({
        student: socket.user._id,
        course: courseId
      });

      const isTeacher = teacherId === userId;
      const isAdmin = socket.user.role === 'admin';

      if (!isEnrolled && !isTeacher && !isAdmin) {
        socket.emit('error', { msg: 'You must be enrolled in this course to join the live session' });
        return;
      }

      socket.join(courseId);
      socket.join(`institution:${socket.user.institution}`);
      console.log(`User ${socket.user.name} (${socket.user._id}) joined room ${courseId}`);

      if (!rooms.has(courseId)) {
        rooms.set(courseId, new Set());
      }
      rooms.get(courseId).add({ id: userId, socketId: socket.id, name: socket.user.name, isTeacher });

      socket.to(courseId).emit('user-connected', { 
        userId: socket.user._id, 
        userName: socket.user.name, 
        socketId: socket.id 
      });

      const usersInRoom = Array.from(rooms.get(courseId));
      socket.emit('room-users', usersInRoom);
    } catch (err) {
      console.error('Join room error:', err);
      socket.emit('error', { msg: 'Failed to join room' });
    }
  });

  socket.on('teacher-heartbeat', async ({ courseId }) => {
    if (!courseId) return;
    
    try {
      const course = await Course.findById(courseId);
      if (!course) return;
      
      const userId = String(socket.user._id);
      const teacherId = String(course.teacher);
      
      if (userId !== teacherId && socket.user.role !== 'admin') {
        console.warn(`Unauthorized heartbeat attempt from user ${userId} for course ${courseId}`);
        return;
      }
      
      teacherHeartbeats.set(courseId, Date.now());
      console.log(`Received valid heartbeat from teacher for course ${courseId}`);
    } catch (err) {
      console.error('Heartbeat error:', err);
    }
  });

  socket.on('join-institution', ({ institution }) => {
    if (!institution) return;
    if (institution !== socket.user.institution) {
      socket.emit('error', { msg: 'Cannot join another institution\'s room' });
      return;
    }
    socket.join(`institution:${institution}`);
    console.log(`User ${socket.user.name} joined institution room: ${institution}`);
  });

  socket.on('signal', ({ courseId, signalData, targetSocketId }) => {
    if (!courseId || !signalData || !targetSocketId) return;

    const senderRooms = Array.from(socket.rooms);
    if (!senderRooms.includes(courseId)) {
      socket.emit('error', { msg: 'You can only signal within rooms you have joined' });
      return;
    }

    const targetSockets = io.sockets.sockets;
    const targetSocket = targetSockets.get(targetSocketId);
    if (!targetSocket || !targetSocket.rooms.has(courseId)) {
      socket.emit('error', { msg: 'Target user is not in the same room' });
      return;
    }

    io.to(targetSocketId).emit('signal', {
      userId: socket.user._id,
      signalData
    });
  });

  socket.on('chat-message', ({ courseId, message }) => {
    if (!courseId || !message) return;

    if (!socket.rooms.has(courseId)) {
      socket.emit('error', { msg: 'You must join the room before sending messages' });
      return;
    }

    const senderRooms = Array.from(socket.rooms);
    if (!senderRooms.includes(courseId)) {
      socket.emit('error', { msg: 'You can only message in rooms you have joined' });
      return;
    }

    io.to(courseId).emit('chat-message', {
      ...message,
      senderId: socket.user._id,
      senderName: socket.user.name,
      timestamp: Date.now()
    });
  });

  socket.on('disconnect', async () => {
    console.log('Client disconnected:', socket.id);

    for (const [courseId, users] of rooms.entries()) {
      const user = Array.from(users).find(u => u.socketId === socket.id);
      if (user) {
        users.delete(user);
        
        const course = await Course.findById(courseId);
        if (course && user.isTeacher && course.isLive) {
          setupHeartbeatTimeout(io, courseId);
        }
        
        socket.to(courseId).emit('user-disconnected', { userId: user.id });
        if (users.size === 0) {
          rooms.delete(courseId);
        }
      }
    }
  });

  socket.on('leave-room', ({ courseId }) => {
    if (!courseId) return;
    socket.leave(courseId);
    if (rooms.has(courseId)) {
      const userId = String(socket.user._id);
      const user = Array.from(rooms.get(courseId)).find(u => u.id === userId);
      if (user) {
        rooms.get(courseId).delete(user);
        socket.to(courseId).emit('user-disconnected', { userId: socket.user._id });
      }
    }
    console.log(`User ${socket.user._id} left room ${courseId}`);
  });
});

const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason: reason?.message || reason, stack: reason?.stack });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use!`);
    console.error(`   Another instance of this server might be running.`);
    console.error(`\n   Solutions:`);
    console.error(`   1. Kill the process using port ${PORT}:`);
    console.error(`      - Windows: npx kill-port ${PORT}`);
    console.error(`      - macOS/Linux: npx kill-port ${PORT} or lsof -ti:${PORT} | xargs kill`);
    console.error(`   2. Or change the port in .env file:`);
    console.error(`      - Add: PORT=${parseInt(PORT) + 1}`);
    console.error(`      - Then restart with: npm run dev\n`);
    process.exit(1);
  }
  console.error('Server error:', err);
  process.exit(1);
});

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
    } catch (err) {
      logger.error('Error closing MongoDB connection', { error: err.message });
    }
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

server.listen(PORT, () => {
  console.log(`✅ Server started on port ${PORT}`);
  console.log(`   Environment: ${isProduction ? 'production' : 'development'}`);
  if (!isProduction) {
    console.log(`   API URL: http://localhost:${PORT}/api`);
  }
});
