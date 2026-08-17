const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');
const { param, query, body } = require('express-validator');
const { validate } = require('../middleware/errorHandler');

router.use(auth, isAdmin);

router.get(
  '/users',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('institution').optional().trim(),
    query('role').optional().isIn(['student', 'teacher', 'admin']),
    query('search').optional().trim(),
    query('isActive').optional().isBoolean(),
  ],
  validate,
  adminController.getUsers
);

router.patch(
  '/users/:id/status',
  [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('isActive').isBoolean().withMessage('isActive must be a boolean'),
  ],
  validate,
  adminController.updateUserStatus
);

router.get(
  '/courses',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('institution').optional().trim(),
    query('privacy').optional().isIn(['private', 'institution', 'public']),
    query('search').optional().trim(),
    query('isArchived').optional().isBoolean(),
  ],
  validate,
  adminController.getCourses
);

router.patch(
  '/courses/:id/archive',
  [
    param('id').isMongoId().withMessage('Invalid course ID'),
    body('isArchived').isBoolean().withMessage('isArchived must be a boolean'),
  ],
  validate,
  adminController.updateCourseArchive
);

router.get(
  '/enrollments',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('institution').optional().trim(),
    query('courseId').optional().isMongoId(),
    query('userId').optional().isMongoId(),
  ],
  validate,
  adminController.getEnrollments
);

router.get('/stats', adminController.getStats);

module.exports = router;
