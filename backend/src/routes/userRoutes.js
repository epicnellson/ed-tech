const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.get('/me/profile', auth, userController.getProfile);

router.patch(
  '/me/profile',
  [
    auth,
    body('name').optional().trim().isLength({ min: 2, max: 100 }),
    body('bio').optional().isLength({ max: 500 }),
  ],
  validate,
  userController.updateProfile
);

router.patch(
  '/me/change-password',
  [
    auth,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  userController.changePassword
);

router.patch(
  '/me/notification-preferences',
  auth,
  userController.updateNotificationPreferences
);

module.exports = router;
