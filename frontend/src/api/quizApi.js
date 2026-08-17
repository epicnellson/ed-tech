/**
 * @deprecated Quiz functionality is disabled in this version.
 * These API methods will not work as the quiz routes are commented out.
 * Keeping this file for reference only.
 */
import api from './client';

export const quizApi = {
  createQuiz: async (quizData) => {
    console.warn('Quiz functionality is disabled');
    return { success: false, message: 'Quiz feature is disabled' };
  },

  getQuizById: async (id) => {
    console.warn('Quiz functionality is disabled');
    return { success: false, message: 'Quiz feature is disabled' };
  },

  submitQuiz: async (id, answers) => {
    console.warn('Quiz functionality is disabled');
    return { success: false, message: 'Quiz feature is disabled' };
  },

  getQuizAttempts: async (id) => {
    console.warn('Quiz functionality is disabled');
    return { success: false, message: 'Quiz feature is disabled' };
  },

  getMyAttempts: async (id) => {
    console.warn('Quiz functionality is disabled');
    return { success: false, message: 'Quiz feature is disabled' };
  },
};

export const quizManagementApi = {
  deleteQuiz: async (id) => {
    console.warn('Quiz functionality is disabled');
    return { success: false, message: 'Quiz feature is disabled' };
  },
  
  resetQuizAttempts: async (quizId, userId) => {
    console.warn('Quiz functionality is disabled');
    return { success: false, message: 'Quiz feature is disabled' };
  },
};
