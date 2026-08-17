const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    default: null
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  audienceType: {
    type: String,
    enum: ['course', 'institution', 'global'],
    default: 'course'
  },
  institution: {
    type: String,
    default: null
  }
}, { timestamps: true });

AnnouncementSchema.index({ course: 1 });
AnnouncementSchema.index({ audienceType: 1 });
AnnouncementSchema.index({ institution: 1 });
AnnouncementSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);
