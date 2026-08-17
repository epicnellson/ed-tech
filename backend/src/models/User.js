const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  },
  institution: {
    type: String,
    required: true,
    trim: true
  },
  studentId: {
    type: String,
    trim: true,
    sparse: true
  },
  department: {
    type: String,
    trim: true
  },
  faculty: {
    type: String,
    enum: ['FICT', 'FBMG', 'FCMB', 'FABE_FDI'],
    required: false
  },
  program: {
    type: String,
    required: false
  },
  currentSemester: {
    type: Number,
    min: 1,
    max: 8,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  googleId: {
    type: String,
    sparse: true,
    unique: true,
    default: null
  },
  avatar: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  avatarUrl: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    default: '',
    maxLength: 500
  },
  notificationPreferences: {
    emailOnAnnouncement: { type: Boolean, default: true },
    emailOnAssignmentDue: { type: Boolean, default: true },
    emailOnAssignmentGraded: { type: Boolean, default: true },
    emailOnEnrollment: { type: Boolean, default: false },
    inAppNotifications: { type: Boolean, default: true }
  }
}, { timestamps: true });

UserSchema.index({ institution: 1 });
UserSchema.index({ role: 1 });

module.exports = mongoose.model('User', UserSchema);
