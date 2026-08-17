const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { authorizeCourse } = require('../middleware/authorization');

// @route   POST /api/enrollments
// @desc    Enroll in a course
// @access  Private (Student only)
router.post(
  '/',
  [
    auth,
    body('courseId')
      .isMongoId()
      .withMessage('Invalid course ID'),
  ],
  validate,
  enrollmentController.enrollCourse
);

// @route   POST /api/enrollments/auto-enroll
// @desc    Auto-enroll for current semester based on program
// @access  Private (Student only)
router.post('/auto-enroll', auth, enrollmentController.autoEnrollForCurrentSemester);

// @route   POST /api/enrollments/join-by-code
// @desc    Join a course by course code
// @access  Private (Student only)
router.post(
  '/join-by-code',
  [
    auth,
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Course code is required')
      .isLength({ min: 2, max: 20 })
      .withMessage('Course code must be between 2 and 20 characters'),
  ],
  validate,
  enrollmentController.joinByCode
);

// @route   GET /api/enrollments/me
// @desc    Get current user's enrollments
// @access  Private
router.get('/me', auth, enrollmentController.getMyEnrollments);

// @route   GET /api/enrollments/course/:courseId
// @desc    Get enrollments for a specific course
// @access  Private (Teacher - own courses only)
router.get(
  '/course/:courseId',
  [
    auth,
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID'),
  ],
  validate,
  authorizeCourse('view'),
  enrollmentController.getCourseEnrollments
);

// @route   GET /api/enrollments/:id
// @desc    Get enrollment by ID
// @access  Private
router.get(
  '/:id',
  [
    auth,
    param('id')
      .isMongoId()
      .withMessage('Invalid enrollment ID'),
  ],
  validate,
  enrollmentController.getEnrollmentById
);

// @route   PATCH /api/enrollments/:id/progress
// @desc    Update enrollment progress
// @access  Private
router.patch(
  '/:id/progress',
  [
    auth,
    param('id')
      .isMongoId()
      .withMessage('Invalid enrollment ID'),
    body('progress')
      .isInt({ min: 0, max: 100 })
      .withMessage('Progress must be between 0 and 100'),
  ],
  validate,
  enrollmentController.updateProgress
);

module.exports = router;
