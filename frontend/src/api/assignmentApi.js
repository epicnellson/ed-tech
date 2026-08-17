import api from './client';

export const assignmentApi = {
  createAssignment: async (assignmentData, file = null) => {
    if (file) {
      const formData = new FormData();
      Object.keys(assignmentData).forEach(key => {
        if (assignmentData[key] !== null && assignmentData[key] !== undefined) {
          formData.append(key, assignmentData[key]);
        }
      });
      formData.append('attachment', file);
      const response = await api.post('/assignments', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    const response = await api.post('/assignments', assignmentData);
    return response.data;
  },

  getCourseAssignments: async (courseId) => {
    const response = await api.get(`/assignments/course/${courseId}`);
    return response.data;
  },

  getAssignmentById: async (id) => {
    const response = await api.get(`/assignments/${id}`);
    return response.data;
  },

  submitAssignment: async (id, data, file = null) => {
    if (file) {
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      });
      formData.append('file', file);
      const response = await api.post(`/assignments/${id}/submit`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    }
    const response = await api.post(`/assignments/${id}/submit`, data);
    return response.data;
  },

  getMySubmission: async (id) => {
    const response = await api.get(`/assignments/${id}/my-submission`);
    return response.data;
  },

  getSubmissions: async (assignmentId) => {
    const response = await api.get(`/assignments/${assignmentId}/submissions`);
    return response.data;
  },

  gradeSubmission: async (assignmentId, data) => {
    const response = await api.patch(`/assignments/${assignmentId}/grade`, data);
    return response.data;
  },

  getTeacherAssignments: async () => {
    const response = await api.get('/assignments/teacher');
    return response.data;
  },

  getStudentAssignments: async () => {
    const response = await api.get('/assignments/student');
    return response.data;
  },

  getUpcomingAssignments: async () => {
    const response = await api.get('/assignments/upcoming');
    return response.data;
  },

  getPendingGrading: async () => {
    const response = await api.get('/assignments/pending-grading');
    return response.data;
  },

  togglePublish: async (id, isPublished) => {
    const response = await api.patch(`/assignments/${id}/publish`, { isPublished });
    return response.data;
  },
};
