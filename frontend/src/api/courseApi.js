import api from './client';

export const courseApi = {
  getCourses: async (params = {}) => {
    const response = await api.get('/courses', { params });
    return response.data;
  },

  getCourseById: async (id) => {
    const response = await api.get(`/courses/${id}`);
    return response.data;
  },

  getMyCourses: async () => {
    const response = await api.get('/courses/my-courses');
    return response.data;
  },

  createCourse: async (courseData) => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  updateCourse: async (id, courseData) => {
    const response = await api.put(`/courses/${id}`, courseData);
    return response.data;
  },

  deleteCourse: async (id) => {
    const response = await api.delete(`/courses/${id}`);
    return response.data;
  },

  goLive: async (id) => {
    const response = await api.post(`/courses/${id}/go-live`);
    return response.data;
  },

  stopLive: async (id) => {
    const response = await api.post(`/courses/${id}/stop-live`);
    return response.data;
  },

  enrollStudentByEmail: async (id, email) => {
    const response = await api.post(`/courses/${id}/enroll-student`, { email });
    return response.data;
  },

  // Module operations
  addModule: async (courseId, title) => {
    const response = await api.post(`/courses/${courseId}/modules`, { title });
    return response.data;
  },

  updateModule: async (courseId, moduleId, data) => {
    const response = await api.patch(`/courses/${courseId}/modules/${moduleId}`, data);
    return response.data;
  },

  deleteModule: async (courseId, moduleId) => {
    const response = await api.delete(`/courses/${courseId}/modules/${moduleId}`);
    return response.data;
  },

  reorderModules: async (courseId, moduleIds) => {
    const response = await api.patch(`/courses/${courseId}/modules/reorder`, { moduleIds });
    return response.data;
  },

  // Lesson operations
  getLessons: async (courseId) => {
    const response = await api.get(`/courses/${courseId}/lessons`);
    return response.data;
  },

  createLesson: async (courseId, lessonData) => {
    const response = await api.post(`/courses/${courseId}/lessons`, lessonData);
    return response.data;
  },

  updateLesson: async (courseId, lessonId, lessonData) => {
    const response = await api.patch(`/courses/${courseId}/lessons/${lessonId}`, lessonData);
    return response.data;
  },

  deleteLesson: async (courseId, lessonId) => {
    const response = await api.delete(`/courses/${courseId}/lessons/${lessonId}`);
    return response.data;
  },

  reorderLessons: async (courseId, lessonIds) => {
    const response = await api.patch(`/courses/${courseId}/lessons/reorder`, { lessonIds });
    return response.data;
  },

  uploadAttachment: async (courseId, lessonId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/courses/${courseId}/lessons/${lessonId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteAttachment: async (courseId, lessonId, attachmentIndex) => {
    const response = await api.delete(`/courses/${courseId}/lessons/${lessonId}/attachments/${attachmentIndex}`);
    return response.data;
  },
};

export const publicCourseApi = {
  getPublicCourses: async (params = {}) => {
    const response = await api.get('/public/courses', { params });
    return response.data;
  },

  getFeaturedCourses: async (params = {}) => {
    const response = await api.get('/public/courses/featured', { params });
    return response.data;
  },

  getPublicCourseById: async (id) => {
    const response = await api.get(`/public/courses/${id}`);
    return response.data;
  },
};
