const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const assignmentController = require('../controllers/assignmentController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { authorizeAssignment } = require('../middleware/authorization');
const upload = require('../middleware/upload');

router.post(
  '/',
  [
    auth,
    upload.single('attachment'),
    body('courseId')
      .isMongoId()
      .withMessage('Invalid course ID'),
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title must not exceed 200 characters'),
    body('description')
      .optional()
      .isLength({ max: 5000 })
      .withMessage('Description must not exceed 5000 characters'),
    body('maxScore')
      .optional()
      .isInt({ min: 1, max: 1000 })
      .withMessage('Max score must be between 1 and 1000'),
  ],
  validate,
  assignmentController.createAssignment
);

router.get(
  '/teacher',
  auth,
  assignmentController.getTeacherAssignments
);

router.get(
  '/student',
  auth,
  assignmentController.getStudentAssignments
);

router.get(
  '/upcoming',
  auth,
  assignmentController.getUpcomingAssignments
);

router.get(
  '/pending-grading',
  auth,
  assignmentController.getPendingGrading
);

router.get(
  '/course/:courseId',
  [
    auth,
    param('courseId')
      .isMongoId()
      .withMessage('Invalid course ID'),
  ],
  validate,
  assignmentController.getCourseAssignments
);

router.get(
  '/:id',
  [
    auth,
    param('id')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
  ],
  validate,
  authorizeAssignment('view'),
  assignmentController.getAssignmentById
);

router.post(
  '/:id/submit',
  [
    auth,
    upload.single('file'),
    param('id')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
    body('content')
      .optional()
      .isLength({ max: 10000 })
      .withMessage('Content must not exceed 10000 characters'),
  ],
  validate,
  authorizeAssignment('submit'),
  assignmentController.submitAssignment
);

router.get(
  '/:id/my-submission',
  [
    auth,
    param('id')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
  ],
  validate,
  authorizeAssignment('view'),
  assignmentController.getMySubmission
);

router.get(
  '/:assignmentId/submissions',
  [
    auth,
    param('assignmentId')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
  ],
  validate,
  authorizeAssignment('grade'),
  assignmentController.getSubmissions
);

router.patch(
  '/:assignmentId/grade',
  [
    auth,
    param('assignmentId')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
    body('submissionId')
      .isMongoId()
      .withMessage('Invalid submission ID'),
    body('score')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Score must be a positive number'),
    body('feedback')
      .optional()
      .isLength({ max: 2000 })
      .withMessage('Feedback must not exceed 2000 characters'),
  ],
  validate,
  authorizeAssignment('grade'),
  assignmentController.gradeSubmission
);

router.patch(
  '/:id/publish',
  [
    auth,
    param('id')
      .isMongoId()
      .withMessage('Invalid assignment ID'),
    body('isPublished')
      .optional()
      .isBoolean()
      .withMessage('isPublished must be a boolean'),
  ],
  validate,
  authorizeAssignment('edit'),
  assignmentController.togglePublish
);

module.exports = router;
