import api from './client';

export const notificationApi = {
  getNotifications: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

export const announcementApi = {
  createAnnouncement: async (data) => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  getAnnouncementFeed: async () => {
    const response = await api.get('/announcements/feed');
    return response.data;
  },

  getCourseAnnouncements: async (courseId) => {
    const response = await api.get(`/announcements/course/${courseId}`);
    return response.data;
  },

  getAnnouncementById: async (id) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },
};
