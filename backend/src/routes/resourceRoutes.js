const express = require('express');
const multer = require('multer');
const { param, body } = require('express-validator');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { authorizeCourse, authorizeResource } = require('../middleware/authorization');
const { MAX_FILE_SIZE, ALLOWED_MIME_TYPES } = require('../services/storageAdapter');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'), false);
    }
  }
});

router.post(
  '/resources/upload',
  [
    auth,
    upload.single('file'),
    body('courseId').isMongoId().withMessage('Invalid course ID'),
    body('title').optional().trim().isLength({ max: 200 }),
  ],
  validate,
  authorizeCourse('edit'),
  resourceController.uploadResource
);

router.get(
  '/resources/course/:courseId',
  [
    auth,
    param('courseId').isMongoId().withMessage('Invalid course ID'),
  ],
  validate,
  authorizeCourse('view'),
  resourceController.getCourseResources
);

router.get(
  '/resources/:id',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid resource ID'),
  ],
  validate,
  authorizeResource('CourseResource'),
  resourceController.getResource
);

router.delete(
  '/resources/:id',
  [
    auth,
    param('id').isMongoId().withMessage('Invalid resource ID'),
  ],
  validate,
  authorizeResource('CourseResource'),
  resourceController.deleteResource
);

module.exports = router;
