const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const lessonController = require('../controllers/lessonController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const upload = require('../middleware/upload');
const { authorizeCourse } = require('../middleware/authorization');

router.get(
  '/:courseId/lessons',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  authorizeCourse('view'),
  lessonController.getLessons
);

router.post(
  '/:courseId/lessons',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('moduleId').optional().isMongoId().withMessage('Invalid module ID'),
    body('type').optional().isIn(['video', 'text', 'assignment']),
    body('content').optional().trim(),
    body('videoUrl').optional().trim(),
  ],
  validate,
  authorizeCourse('edit'),
  lessonController.createLesson
);

router.patch(
  '/:courseId/lessons/:lessonId',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    param('lessonId').isMongoId().withMessage('Invalid lesson ID'),
  ],
  validate,
  authorizeCourse('edit'),
  lessonController.updateLesson
);

router.delete(
  '/:courseId/lessons/:lessonId',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    param('lessonId').isMongoId().withMessage('Invalid lesson ID'),
  ],
  validate,
  authorizeCourse('edit'),
  lessonController.deleteLesson
);

router.patch(
  '/:courseId/lessons/reorder',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    body('lessonIds').isArray().withMessage('Lesson IDs array required'),
  ],
  validate,
  authorizeCourse('edit'),
  lessonController.reorderLessons
);

router.post(
  '/:courseId/lessons/:lessonId/attachments',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    param('lessonId').isMongoId().withMessage('Invalid lesson ID'),
  ],
  validate,
  authorizeCourse('edit'),
  upload.single('file'),
  lessonController.uploadAttachment
);

router.delete(
  '/:courseId/lessons/:lessonId/attachments/:attachmentIndex',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    param('lessonId').isMongoId().withMessage('Invalid lesson ID'),
    param('attachmentIndex').isInt({ min: 0 }).withMessage('Invalid attachment index'),
  ],
  validate,
  authorizeCourse('edit'),
  lessonController.deleteAttachment
);

module.exports = router;
