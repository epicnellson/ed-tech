export const UserRoles = {
  STUDENT: 'student',
  TEACHER: 'teacher',
  ADMIN: 'admin',
};

export const CoursePrivacy = {
  PRIVATE: 'private',
  INSTITUTION: 'institution',
  PUBLIC: 'public',
};

export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

/** @typedef {'student' | 'teacher' | 'admin'} UserRole */
/** @typedef {'private' | 'institution' | 'public'} CoursePrivacyType */
