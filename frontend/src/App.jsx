import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/dashboard/Dashboard';
import CourseStream from './pages/dashboard/CourseStream';
import Tasks from './pages/dashboard/Tasks';
import CourseList from './pages/courses/CourseList';
import CourseDetail from './pages/courses/CourseDetail';
import MyCourses from './pages/courses/MyCourses';
import CoursePlayer from './pages/courses/CoursePlayer';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import PublicCourses from './pages/courses/PublicCourses';
import Landing from './pages/Landing';
import CreateCourse from './pages/teacher/CreateCourse';
import EditCourse from './pages/teacher/EditCourse';
import CourseModulesEditor from './pages/teacher/CourseModulesEditor';
import CourseStudents from './pages/teacher/CourseStudents';
import CourseAssignments from './pages/teacher/CourseAssignments';
import CourseLive from './pages/teacher/CourseLive';
import QuickLive from './pages/teacher/QuickLive';
import TeacherAssignmentGrading from './pages/teacher/TeacherAssignmentGrading';
import CourseLiveView from './pages/student/CourseLiveView';
import AssignmentDetail from './pages/student/AssignmentDetail';
import JoinByCodePage from './pages/JoinByCode';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <SocketProvider>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/join" element={<JoinByCodePage />} />
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute>
          <Register />
        </PublicRoute>
      } />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      } />
      <Route path="/reset-password/:token" element={
        <PublicRoute>
          <ResetPassword />
        </PublicRoute>
      } />
      
      {/* Public Course Catalog */}
      <Route path="/courses/public" element={
        <PublicCourses />
      } />

      {/* Protected Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AppLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        
        {/* Dashboard */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="stream" element={<CourseStream />} />
        <Route path="tasks" element={<Tasks />} />
        
        {/* Course Routes */}
        <Route path="courses" element={<CourseList />} />
        <Route path="courses/my" element={<MyCourses />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="courses/:id/learn" element={<CoursePlayer />} />
        <Route path="courses/:id/live" element={<CourseLiveView />} />
        <Route path="assignments/:id" element={<AssignmentDetail />} />
        
        {/* Teacher Routes */}
        <Route path="teacher/courses" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <MyCourses />
          </ProtectedRoute>
        } />
        <Route path="teacher/courses/new" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <CreateCourse />
          </ProtectedRoute>
        } />
        <Route path="teacher/courses/:id/edit" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <EditCourse />
          </ProtectedRoute>
        } />
        <Route path="teacher/courses/:id/modules" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <CourseModulesEditor />
          </ProtectedRoute>
        } />
        <Route path="teacher/courses/:id/students" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <CourseStudents />
          </ProtectedRoute>
        } />
        <Route path="teacher/courses/:id/assignments" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <CourseAssignments />
          </ProtectedRoute>
        } />
        <Route path="teacher/courses/:id/live" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <CourseLive />
          </ProtectedRoute>
        } />
        <Route path="teacher/live" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <QuickLive />
          </ProtectedRoute>
        } />
        <Route path="teacher/courses/:id/assignments/:assignmentId" element={
          <ProtectedRoute allowedRoles={['teacher', 'admin']}>
            <TeacherAssignmentGrading />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/users" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="admin/courses" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCourses />
          </ProtectedRoute>
        } />
        <Route path="admin/*" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Route>

      {/* Catch all - redirect to landing */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </SocketProvider>
  );
}
