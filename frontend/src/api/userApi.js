import api from './client';

export const userApi = {
  getProfile: async () => {
    const response = await api.get('/users/me/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.patch('/users/me/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.patch('/users/me/change-password', { currentPassword, newPassword });
    return response.data;
  },

  updateNotificationPreferences: async (preferences) => {
    const response = await api.patch('/users/me/notification-preferences', preferences);
    return response.data;
  },
};

export const studentApi = {
  getMyProgress: async () => {
    const response = await api.get('/students/me/progress');
    return response.data;
  },

  getRecentActivity: async () => {
    const response = await api.get('/students/me/recent-activity');
    return response.data;
  },

  updateLessonProgress: async (lessonId, data) => {
    const response = await api.post(`/students/lessons/${lessonId}/progress`, data);
    return response.data;
  },
};

export const adminApi = {
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  updateUserStatus: async (userId, isActive) => {
    const response = await api.patch(`/admin/users/${userId}/status`, { isActive });
    return response.data;
  },

  getCourses: async (params = {}) => {
    const response = await api.get('/admin/courses', { params });
    return response.data;
  },

  updateCourseArchive: async (courseId, isArchived) => {
    const response = await api.patch(`/admin/courses/${courseId}/archive`, { isArchived });
    return response.data;
  },

  getEnrollments: async (params = {}) => {
    const response = await api.get('/admin/enrollments', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

export const analyticsApi = {
  getTeacherDashboardStats: async () => {
    const response = await api.get('/analytics/teacher/dashboard');
    return response.data;
  },

  getTeacherCoursesAnalytics: async () => {
    const response = await api.get('/analytics/teacher/courses');
    return response.data;
  },

  getCourseAnalytics: async (courseId) => {
    const response = await api.get(`/analytics/teacher/courses/${courseId}`);
    return response.data;
  },
};
