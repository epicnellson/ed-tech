const mongoose = require('mongoose');

const AssignmentSubmissionSchema = new mongoose.Schema({
  assignment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String,
    default: null
  },
  score: {
    type: Number,
    default: null,
    min: 0
  },
  feedback: {
    type: String,
    default: ''
  },
  submittedAt: {
    type: Date,
    default: null
  },
  gradedAt: {
    type: Date,
    default: null
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, { timestamps: true });

AssignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });
AssignmentSubmissionSchema.index({ assignment: 1 });
AssignmentSubmissionSchema.index({ student: 1 });
AssignmentSubmissionSchema.index({ course: 1 });
AssignmentSubmissionSchema.index({ score: 1 });

module.exports = mongoose.model('AssignmentSubmission', AssignmentSubmissionSchema);
