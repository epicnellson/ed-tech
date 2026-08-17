const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

const { authorizeCourse } = require('../middleware/authorization');

router.post(
  '/',
  [
    auth,
    body('title')
      .trim()
      .notEmpty()
      .withMessage('Title is required')
      .isLength({ max: 200 })
      .withMessage('Title must not exceed 200 characters'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 5000 })
      .withMessage('Message must not exceed 5000 characters'),
    body('audienceType')
      .isIn(['course', 'institution', 'global'])
      .withMessage('Audience type must be course, institution, or global'),
    body('courseId')
      .optional()
      .isMongoId()
      .withMessage('Invalid course ID'),
  ],
  validate,
  (req, res, next) => {
    if (req.body.audienceType === 'course' && req.body.courseId) {
      return authorizeCourse('edit')(req, res, next);
    }
    // For institution/global, only admin should be allowed (this check is missing in controller too probably)
    if (req.user.role !== 'admin' && req.body.audienceType !== 'course') {
        return res.status(403).json({ success: false, message: 'Only admins can create non-course announcements' });
    }
    next();
  },
  announcementController.createAnnouncement
);

router.get(
  '/feed',
  auth,
  announcementController.getAnnouncementFeed
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
  authorizeCourse('view'),
  announcementController.getCourseAnnouncements
);

router.get(
  '/:id',
  [
    auth,
    param('id')
      .isMongoId()
      .withMessage('Invalid announcement ID'),
  ],
  validate,
  announcementController.getAnnouncementById
);

module.exports = router;
