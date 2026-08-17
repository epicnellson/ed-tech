import api from './client';

export const resourceApi = {
  uploadResource: async (formData) => {
    const response = await api.post('/resources/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getCourseResources: async (courseId) => {
    const response = await api.get(`/resources/course/${courseId}`);
    return response.data;
  },

  deleteResource: async (resourceId) => {
    const response = await api.delete(`/resources/${resourceId}`);
    return response.data;
  },
};

export const searchApi = {
  searchCourses: async (query) => {
    const response = await api.get('/courses', { params: { search: query } });
    return response.data;
  },
};
