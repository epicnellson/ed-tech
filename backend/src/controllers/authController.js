const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const constants = require('../config/constants');
const logger = require('../services/logger');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role, institution } = req.body;

    if (!name || !email || !password) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Please enter all required fields' 
      });
    }

    if (!institution || institution.trim().length === 0) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Institution is required' 
      });
    }

    if (name.length < constants.USER.NAME_MIN_LENGTH || name.length > constants.USER.NAME_MAX_LENGTH) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: `Name must be between ${constants.USER.NAME_MIN_LENGTH} and ${constants.USER.NAME_MAX_LENGTH} characters` 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Please enter a valid email address' 
      });
    }

    if (password.length < constants.USER.PASSWORD_MIN_LENGTH) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: `Password must be at least ${constants.USER.PASSWORD_MIN_LENGTH} characters` 
      });
    }

    if (role && !constants.ROLES.VALUES.includes(role)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Invalid role' 
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'User already exists' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || constants.ROLES.DEFAULT,
      institution: institution.trim(),
      isActive: true
    });

    await user.save();

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: constants.JWT.EXPIRES_IN });

    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institution: user.institution
        }
      }
    });
  } catch (err) {
    logger.error('Register error', { error: err.message, stack: err.stack });
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Please enter all fields' 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Please enter a valid email address' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    if (!user.isActive) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Your account has been deactivated. Please contact admin.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Invalid credentials' 
      });
    }

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: constants.JWT.EXPIRES_IN });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institution: user.institution
        }
      }
    });
  } catch (err) {
    logger.error('Login error', { error: err.message, stack: err.stack });
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: user
    });
  } catch (err) {
    logger.error('GetMe error', { error: err.message, userId: req.user?.id });
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Please enter your email address' 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Please enter a valid email address' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(constants.HTTP_STATUS.OK).json({ 
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.' 
      });
    }

    const resetToken = crypto.randomBytes(constants.RESET_PASSWORD.TOKEN_LENGTH).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    user.resetPasswordToken = resetTokenHash;
    user.resetPasswordExpires = new Date(Date.now() + constants.RESET_PASSWORD.TOKEN_EXPIRY_MINUTES * 60 * 1000);
    
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    logger.info('Password reset requested', { email: user.email, userId: user.id });
    
    if (process.env.NODE_ENV !== 'production') {
      console.log('========================================');
      console.log('PASSWORD RESET LINK (DEV MODE):');
      console.log(resetUrl);
      console.log('========================================');
      console.log(`Token expires in ${constants.RESET_PASSWORD.TOKEN_EXPIRY_MINUTES} minutes`);
      console.log('In production, this would be sent via email.');
      console.log('========================================');
    }

    res.status(constants.HTTP_STATUS.OK).json({ 
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.' 
    });
  } catch (err) {
    logger.error('ForgotPassword error', { error: err.message, stack: err.stack });
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Reset token is required' 
      });
    }

    if (!password) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Please enter a new password' 
      });
    }

    if (password.length < constants.USER.PASSWORD_MIN_LENGTH) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: `Password must be at least ${constants.USER.PASSWORD_MIN_LENGTH} characters` 
      });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Invalid or expired reset token' 
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    
    await user.save();

    logger.info('Password reset successful', { userId: user.id });

    res.status(constants.HTTP_STATUS.OK).json({ 
      success: true,
      message: 'Password reset successful. You can now log in with your new password.' 
    });
  } catch (err) {
    logger.error('ResetPassword error', { error: err.message, stack: err.stack });
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Reset token is required' 
      });
    }

    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: resetTokenHash,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Invalid or expired reset token' 
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({ 
      success: true,
      message: 'Token is valid' 
    });
  } catch (err) {
    logger.error('ValidateResetToken error', { error: err.message, stack: err.stack });
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { token: googleToken } = req.body;

    if (!googleToken) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Google token is required' 
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      logger.error('Google Client ID not configured');
      return res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
        success: false,
        message: 'Google authentication is not configured' 
      });
    }

    const ticket = await client.verifyIdToken({
      idToken: googleToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.avatar) {
          user.avatar = picture;
        }
        await user.save();
      }
    } else {
      const emailDomain = email.split('@')[1];
      let institution = emailDomain;
      
      if (emailDomain === 'gmail.com' || emailDomain === 'google.com') {
        institution = 'Google';
      }

      user = new User({
        name: name || 'Google User',
        email: email.toLowerCase(),
        googleId: googleId,
        avatar: picture || '',
        role: constants.ROLES.DEFAULT,
        institution: institution,
        isActive: true,
        password: crypto.randomBytes(20).toString('hex'),
      });

      await user.save();
    }

    if (!user.isActive) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Your account has been deactivated. Please contact admin.' 
      });
    }

    const jwtPayload = { user: { id: user.id, role: user.role } };
    const jwtToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: constants.JWT.EXPIRES_IN });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        token: jwtToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institution: user.institution,
          avatar: user.avatar
        }
      }
    });
  } catch (err) {
    logger.error('Google auth error', { error: err.message, stack: err.stack });
    
    if (err.message.includes('Invalid token') || err.message.includes('Wrong recipient')) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Invalid Google token' 
      });
    }
    
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error during Google authentication' 
    });
  }
};
