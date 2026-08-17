const User = require('../models/User');
const bcrypt = require('bcryptjs');
const constants = require('../config/constants');

exports.getProfile = async (req, res) => {
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
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, bio, avatarUrl, department, faculty, program, currentSemester, studentId } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (name) updateData.name = name;
    if (bio !== undefined) updateData.bio = bio;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    if (department !== undefined) updateData.department = department;
    if (faculty) updateData.faculty = faculty;
    if (program !== undefined) updateData.program = program;
    if (currentSemester) updateData.currentSemester = currentSemester;
    if (studentId !== undefined) updateData.studentId = studentId;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('-password');

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: user,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(userId, { password: hashedPassword });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to change password'
    });
  }
};

exports.updateNotificationPreferences = async (req, res) => {
  try {
    const { emailOnAnnouncement, emailOnAssignmentDue, emailOnAssignmentGraded, emailOnEnrollment, inAppNotifications } = req.body;
    const userId = req.user.id;

    const updateData = {};
    if (emailOnAnnouncement !== undefined) updateData['notificationPreferences.emailOnAnnouncement'] = emailOnAnnouncement;
    if (emailOnAssignmentDue !== undefined) updateData['notificationPreferences.emailOnAssignmentDue'] = emailOnAssignmentDue;
    if (emailOnAssignmentGraded !== undefined) updateData['notificationPreferences.emailOnAssignmentGraded'] = emailOnAssignmentGraded;
    if (emailOnEnrollment !== undefined) updateData['notificationPreferences.emailOnEnrollment'] = emailOnEnrollment;
    if (inAppNotifications !== undefined) updateData['notificationPreferences.inAppNotifications'] = inAppNotifications;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true }
    ).select('notificationPreferences');

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: user.notificationPreferences,
      message: 'Notification preferences updated'
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
};
