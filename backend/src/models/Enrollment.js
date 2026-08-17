const mongoose = require('mongoose');

const EnrollmentSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  studentEmail: {
    type: String,
    default: null
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  progress: {
    type: Number,
    default: 0
  },
  completed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'dropped', 'completed'],
    default: 'active'
  },
  invitedAt: {
    type: Date,
    default: null
  }
}, { timestamps: true });

EnrollmentSchema.index({ student: 1, course: 1 }, { unique: true });
EnrollmentSchema.index({ studentEmail: 1, course: 1 });
EnrollmentSchema.index({ student: 1 });
EnrollmentSchema.index({ course: 1 });
EnrollmentSchema.index({ completed: 1 });
EnrollmentSchema.index({ status: 1 });

module.exports = mongoose.model('Enrollment', EnrollmentSchema);
