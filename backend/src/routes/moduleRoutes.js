const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const moduleController = require('../controllers/moduleController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

const { authorizeCourse } = require('../middleware/authorization');

router.post(
  '/:courseId/modules',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    body('title').trim().notEmpty().withMessage('Title is required'),
  ],
  validate,
  authorizeCourse('edit'),
  moduleController.addModule
);

router.patch(
  '/:courseId/modules/:moduleId',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    param('moduleId').isMongoId().withMessage('Invalid module ID'),
  ],
  validate,
  authorizeCourse('edit'),
  moduleController.updateModule
);

router.delete(
  '/:courseId/modules/:moduleId',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    param('moduleId').isMongoId().withMessage('Invalid module ID'),
  ],
  validate,
  authorizeCourse('edit'),
  moduleController.deleteModule
);

router.patch(
  '/:courseId/modules/reorder',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
    body('moduleIds').isArray().withMessage('Module IDs array required'),
  ],
  validate,
  authorizeCourse('edit'),
  moduleController.reorderModules
);

module.exports = router;
