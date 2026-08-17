const mongoose = require('mongoose');

const ModuleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  order: {
    type: Number,
    default: 0
  }
});

const CourseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  thumbnail: {
    type: String
  },
  videoUrls: [{
    type: String
  }],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  institution: {
    type: String,
    required: true,
    trim: true
  },
  courseCode: {
    type: String,
    required: true,
    trim: true
  },
  faculty: {
    type: String,
    required: true
  },
  facultyCode: {
    type: String,
    default: null
  },
  program: {
    type: String,
    required: true
  },
  programCode: {
    type: String,
    default: null
  },
  semester: {
    type: Number,
    min: 1,
    max: 8,
    required: true
  },
  privacy: {
    type: String,
    enum: ['private', 'institution', 'public'],
    default: 'institution'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  level: {
    type: String,
    required: true,
    trim: true
  },
  isLive: {
    type: Boolean,
    default: false
  },
  jitsiRoom: {
    type: String,
    default: null
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  modules: [ModuleSchema],
  featured: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

CourseSchema.index({ institution: 1, courseCode: 1 }, { unique: true });
CourseSchema.index({ isArchived: 1 });
CourseSchema.index({ institution: 1, isArchived: 1 });
CourseSchema.index({ teacher: 1 });
CourseSchema.index({ teacher: 1, isArchived: 1 });
CourseSchema.index({ teacher: 1, isLive: 1 });
CourseSchema.index({ privacy: 1 });
CourseSchema.index({ category: 1 });
CourseSchema.index({ facultyCode: 1 });
CourseSchema.index({ title: 'text', description: 'text', courseCode: 'text' });
CourseSchema.index({ featured: 1, privacy: 1 });

CourseSchema.pre('deleteOne', { document: true, query: false }, async function() {
  const courseId = this._id;
  
  const Lesson = require('./Lesson');
  const Assignment = require('./Assignment');
  const AssignmentSubmission = require('./AssignmentSubmission');
  const Enrollment = require('./Enrollment');
  const CourseResource = require('./CourseResource');
  const Quiz = require('./Quiz');
  const Announcement = require('./Announcement');
  
  try {
    await Promise.all([
      Lesson.deleteMany({ course: courseId }),
      Assignment.deleteMany({ course: courseId }),
      AssignmentSubmission.deleteMany({ course: courseId }),
      Enrollment.deleteMany({ course: courseId }),
      CourseResource.deleteMany({ course: courseId }),
      Quiz.deleteMany({ course: courseId }),
      Announcement.deleteMany({ course: courseId }),
    ]);
    console.log(`Cascade deleted all related documents for course ${courseId}`);
  } catch (err) {
    console.error('Error in course cascade delete:', err);
    throw err;
  }
});

CourseSchema.pre('deleteMany', async function() {
  const filter = this.getFilter();
  const courses = await this.model.find(filter).select('_id');
  const courseIds = courses.map(c => c._id);
  
  const Lesson = require('./Lesson');
  const Assignment = require('./Assignment');
  const AssignmentSubmission = require('./AssignmentSubmission');
  const Enrollment = require('./Enrollment');
  const CourseResource = require('./CourseResource');
  const Quiz = require('./Quiz');
  const Announcement = require('./Announcement');
  
  try {
    await Promise.all([
      Lesson.deleteMany({ course: { $in: courseIds } }),
      Assignment.deleteMany({ course: { $in: courseIds } }),
      AssignmentSubmission.deleteMany({ course: { $in: courseIds } }),
      Enrollment.deleteMany({ course: { $in: courseIds } }),
      CourseResource.deleteMany({ course: { $in: courseIds } }),
      Quiz.deleteMany({ course: { $in: courseIds } }),
      Announcement.deleteMany({ course: { $in: courseIds } }),
    ]);
    console.log(`Cascade deleted all related documents for ${courseIds.length} courses`);
  } catch (err) {
    console.error('Error in course cascade deleteMany:', err);
    throw err;
  }
});

module.exports = mongoose.model('Course', CourseSchema);
