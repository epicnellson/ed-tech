const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  dueDate: {
    type: Date,
    default: null
  },
  maxScore: {
    type: Number,
    default: 100,
    min: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  attachment: {
    url: {
      type: String,
      default: null
    },
    filename: {
      type: String,
      default: null
    },
    originalName: {
      type: String,
      default: null
    },
    mimeType: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number,
      default: null
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

AssignmentSchema.index({ course: 1 });
AssignmentSchema.index({ dueDate: 1 });
AssignmentSchema.index({ createdBy: 1 });
AssignmentSchema.index({ course: 1, dueDate: 1 });
AssignmentSchema.index({ isPublished: 1 });

module.exports = mongoose.model('Assignment', AssignmentSchema);
