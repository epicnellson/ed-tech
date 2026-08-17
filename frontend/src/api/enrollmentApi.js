import api from './client';

export const enrollmentApi = {
  enrollCourse: async (courseId) => {
    const response = await api.post('/enrollments', { courseId });
    return response.data;
  },

  autoEnroll: async () => {
    const response = await api.post('/enrollments/auto-enroll');
    return response.data;
  },

  joinByCode: async (code) => {
    const response = await api.post('/enrollments/join-by-code', { code });
    return response.data;
  },

  getMyEnrollments: async () => {
    const response = await api.get('/enrollments/me');
    return response.data;
  },

  getCourseEnrollments: async (courseId) => {
    const response = await api.get(`/enrollments/course/${courseId}`);
    return response.data;
  },

  getEnrollmentById: async (id) => {
    const response = await api.get(`/enrollments/${id}`);
    return response.data;
  },

  updateProgress: async (id, progress) => {
    const response = await api.patch(`/enrollments/${id}/progress`, { progress });
    return response.data;
  },
};
