const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  content: {
    type: String,
    default: ''
  },
  videoUrl: {
    type: String,
    default: ''
  },
  order: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['video', 'text', 'quiz', 'assignment'],
    default: 'video'
  },
  attachments: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

LessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model('Lesson', LessonSchema);
