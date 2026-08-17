const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const { authRateLimiter } = require('../middleware/rateLimiter');

router.post(
  '/register',
  authRateLimiter,
  [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters')
      .matches(/\d/)
      .withMessage('Password must contain at least one number'),
    body('role')
      .optional()
      .isIn(['student', 'teacher'])
      .withMessage('Role must be either student or teacher'),
    body('institution')
      .trim()
      .notEmpty()
      .withMessage('Institution is required'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  authRateLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  validate,
  authController.login
);

router.get('/me', auth, authController.getMe);

router.post(
  '/forgot-password',
  authRateLimiter,
  [
    body('email')
      .isEmail()
      .withMessage('Please provide a valid email')
      .normalizeEmail(),
  ],
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  validate,
  authController.resetPassword
);

router.get(
  '/reset-password/:token',
  [
    param('token')
      .notEmpty()
      .withMessage('Reset token is required'),
  ],
  validate,
  authController.validateResetToken
);

router.post(
  '/google',
  authRateLimiter,
  [
    body('token')
      .notEmpty()
      .withMessage('Google token is required'),
  ],
  validate,
  authController.googleAuth
);

module.exports = router;
