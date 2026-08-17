const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.get(
  '/',
  auth,
  notificationController.getNotifications
);

router.get(
  '/unread-count',
  auth,
  notificationController.getUnreadCount
);

router.patch(
  '/:id/read',
  [
    auth,
    param('id')
      .isMongoId()
      .withMessage('Invalid notification ID'),
  ],
  validate,
  notificationController.markAsRead
);

router.patch(
  '/read-all',
  auth,
  notificationController.markAllAsRead
);

router.delete(
  '/:id',
  [
    auth,
    param('id')
      .isMongoId()
      .withMessage('Invalid notification ID'),
  ],
  validate,
  notificationController.deleteNotification
);

module.exports = router;
