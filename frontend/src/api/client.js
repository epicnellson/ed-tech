import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const { data, config } = response;
    
    if (!data || typeof data !== 'object') {
      return response;
    }

    if (data.hasOwnProperty('success')) {
      return response;
    }

    if (config.url?.includes('/quiz') || config.url?.includes('/lessons')) {
      if (data.msg || data._id || Array.isArray(data)) {
        return {
          ...response,
          data: {
            success: true,
            data: data,
            message: data.msg || null,
          },
        };
      }
    }

    if (Array.isArray(data)) {
      return {
        ...response,
        data: {
          success: true,
          data: data,
          message: null,
        },
      };
    }

    if (data._id) {
      return {
        ...response,
        data: {
          success: true,
          data: data,
          message: data.msg || null,
        },
      };
    }

    return response;
  },
  (error) => {
    const { response } = error;
    
    if (response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    const normalizedError = {
      success: false,
      message: response?.data?.message || response?.data?.msg || 'An error occurred',
      status: response?.status,
      data: null,
    };
    
    return Promise.reject(normalizedError);
  }
);

export const unwrapSuccess = (response) => {
  if (response?.data?.success) {
    return response.data;
  }
  return { success: true, data: response?.data, message: null };
};

export const handleApiError = (error) => {
  return {
    success: false,
    message: error?.message || 'An error occurred',
    data: null,
  };
};

export default api;
