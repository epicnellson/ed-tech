const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const courseController = require('../controllers/courseController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { authorizeCourse } = require('../middleware/authorization');

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('teacher').optional().isMongoId(),
    query('search').optional().trim(),
    query('institution').optional().trim(),
    query('category').optional().trim(),
  ],
  validate,
  courseController.getCourses
);

router.get(
  '/my-courses',
  auth,
  courseController.getMyCourses
);

router.get(
  '/:id',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  authorizeCourse('view'),
  courseController.getCourseById
);

router.post(
  '/',
  [
    auth,
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Course title is required')
      .isLength({ min: 3, max: 200 })
      .withMessage('Title must be between 3 and 200 characters'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Course description is required')
      .isLength({ min: 10, max: 2000 })
      .withMessage('Description must be between 10 and 2000 characters'),
    body('price')
      .isNumeric()
      .withMessage('Price must be a number')
      .custom(value => value >= 0)
      .withMessage('Price must be 0 or greater'),
    body('institution')
      .trim()
      .notEmpty()
      .withMessage('Institution is required'),
    body('courseCode')
      .trim()
      .notEmpty()
      .withMessage('Course code is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Course code must be between 2 and 20 characters'),
    body('faculty')
      .optional()
      .isIn(['FICT', 'FBMG', 'FCMB', 'FABE_FDI']),
    body('program')
      .optional()
      .trim(),
    body('semester')
      .optional()
      .isInt({ min: 1, max: 8 }),
    body('privacy')
      .optional()
      .isIn(['private', 'institution', 'public']),
    body('category')
      .trim()
      .notEmpty()
      .withMessage('Category is required'),
    body('level')
      .trim()
      .notEmpty()
      .withMessage('Level is required'),
    body('thumbnail')
      .optional()
      .isURL()
      .withMessage('Thumbnail must be a valid URL'),
    body('videoUrls')
      .optional()
      .isArray()
      .withMessage('Video URLs must be an array'),
  ],
  validate,
  courseController.createCourse
);

router.put(
  '/:id',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid course ID'),
    body('title')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Course title cannot be empty')
      .isLength({ min: 3, max: 200 }),
    body('description')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Course description cannot be empty')
      .isLength({ min: 10, max: 2000 }),
    body('price')
      .optional()
      .isNumeric()
      .withMessage('Price must be a number')
      .custom(value => value >= 0),
    body('thumbnail')
      .optional()
      .isURL()
      .withMessage('Thumbnail must be a valid URL'),
    body('courseCode')
      .optional()
      .trim()
      .isLength({ min: 2, max: 20 }),
    body('faculty')
      .optional()
      .isIn(['FICT', 'FBMG', 'FCMB', 'FABE_FDI']),
    body('program')
      .optional()
      .trim(),
    body('semester')
      .optional()
      .isInt({ min: 1, max: 8 }),
    body('privacy')
      .optional()
      .isIn(['private', 'institution', 'public']),
    body('category')
      .optional()
      .trim(),
    body('level')
      .optional()
      .trim(),
    body('videoUrls')
      .optional()
      .isArray(),
  ],
  validate,
  authorizeCourse('edit'),
  courseController.updateCourse
);

router.delete(
  '/:id',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  authorizeCourse('delete'),
  courseController.deleteCourse
);

router.post(
  '/:id/stop-live',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  authorizeCourse('edit'),
  courseController.stopLive
);

router.post(
  '/:id/go-live',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  authorizeCourse('edit'),
  courseController.goLive
);

// @route   POST /api/courses/:id/enroll-student
// @desc    Enroll a student by email (for private courses)
// @access  Private (Course owner only)
router.post(
  '/:id/enroll-student',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid course ID'),
    body('email')
      .isEmail()
      .withMessage('Valid email is required')
      .normalizeEmail(),
  ],
  validate,
  authorizeCourse('edit'),
  courseController.enrollStudentByEmail
);

module.exports = router;
