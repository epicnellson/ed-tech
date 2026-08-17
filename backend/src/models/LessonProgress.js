const mongoose = require('mongoose');

const LessonProgressSchema = new mongoose.Schema({
  lesson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lesson',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Date
  },
  watchTime: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

LessonProgressSchema.index({ lesson: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('LessonProgress', LessonProgressSchema);
