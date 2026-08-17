const mongoose = require('mongoose');

const CourseResourceSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  fileUrl: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'xls', 'xlsx', 'image', 'video', 'zip', 'other'],
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  originalFileName: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  }
}, { timestamps: true });

CourseResourceSchema.index({ course: 1 });
CourseResourceSchema.index({ uploadedBy: 1 });
CourseResourceSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CourseResource', CourseResourceSchema);
