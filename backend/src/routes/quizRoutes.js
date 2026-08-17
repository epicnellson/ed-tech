const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');
const { body, param } = require('express-validator');
const { validate } = require('../middleware/errorHandler');

router.post(
  '/',
  [
    auth,
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('courseId').isMongoId().withMessage('Invalid course ID'),
    body('questions').optional().isArray(),
    body('passingScore').optional().isInt({ min: 0, max: 100 }),
    body('timeLimit').optional().isInt({ min: 1 }),
  ],
  validate,
  quizController.createQuiz
);

router.get(
  '/:id',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid quiz ID'),
  ],
  validate,
  quizController.getQuizById
);

router.post(
  '/:id/submit',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid quiz ID'),
    body('answers').isArray().withMessage('Answers must be an array'),
  ],
  validate,
  quizController.submitQuiz
);

router.get(
  '/:id/attempts',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid quiz ID'),
  ],
  validate,
  quizController.getQuizAttempts
);

router.get(
  '/:id/my-attempts',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid quiz ID'),
  ],
  validate,
  quizController.getMyQuizAttempts
);

router.post(
  '/lessons',
  [
    auth,
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('courseId').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  quizController.createLesson
);

router.get(
  '/lessons/:id',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid lesson ID'),
  ],
  validate,
  quizController.getLessonById
);

router.patch(
  '/lessons/:id/progress',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid lesson ID'),
    body('completed').optional().isBoolean(),
    body('watchTime').optional().isInt({ min: 0 }),
  ],
  validate,
  quizController.updateLessonProgress
);

router.patch(
  '/lessons/:id',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid lesson ID'),
    body('title').optional().trim().notEmpty(),
    body('description').optional(),
    body('content').optional(),
    body('videoUrl').optional(),
    body('order').optional().isInt({ min: 0 }),
    body('isPublished').optional().isBoolean(),
  ],
  validate,
  quizController.updateLesson
);

router.delete(
  '/:id',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid quiz ID'),
  ],
  validate,
  quizController.deleteQuiz
);

router.delete(
  '/:id/attempts',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid quiz ID'),
    body('userId').isMongoId().withMessage('Invalid user ID'),
  ],
  validate,
  quizController.resetQuizAttempts
);

module.exports = router;
