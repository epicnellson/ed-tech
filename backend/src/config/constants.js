module.exports = {
  JWT: {
    EXPIRES_IN: '7d',
    SECRET_MIN_LENGTH: 32,
  },

  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  COURSE: {
    CODE_LENGTH: 6,
    CODE_CHARS: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    TITLE_MIN_LENGTH: 3,
    TITLE_MAX_LENGTH: 200,
    DESCRIPTION_MIN_LENGTH: 10,
    DESCRIPTION_MAX_LENGTH: 2000,
  },

  PRIVACY: {
    VALUES: ['private', 'institution', 'public'],
    DEFAULT: 'institution',
  },

  ROLES: {
    VALUES: ['student', 'teacher', 'admin'],
    DEFAULT: 'student',
  },

  USER: {
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    PASSWORD_MIN_LENGTH: 6,
  },

  FACULTIES: ['FICT', 'FBMG', 'FCMB', 'FABE_FDI'],

  SEMESTERS: {
    MIN: 1,
    MAX: 8,
  },

  RATE_LIMIT: {
    AUTH_WINDOW_MS: 15 * 60 * 1000,
    AUTH_MAX_REQUESTS: 10,
  },

  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    TOO_MANY_REQUESTS: 429,
    SERVER_ERROR: 500,
  },

  RESET_PASSWORD: {
    TOKEN_EXPIRY_MINUTES: 30,
    TOKEN_LENGTH: 32,
  },
};
