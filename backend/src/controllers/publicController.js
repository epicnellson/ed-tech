const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const constants = require('../config/constants');

exports.getPublicCourses = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, faculty, program, search } = req.query;

    const query = { privacy: 'public', isArchived: false };

    if (category) query.category = category;
    if (faculty) query.faculty = faculty;
    if (program) query.program = program;
    if (search) {
      query.$text = { $search: search };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate('teacher', 'name')
        .select('title description thumbnail category level faculty program price courseCode')
        .sort({ featured: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Course.countDocuments(query)
    ]);

    const categories = await Course.distinct('category', { privacy: 'public', isArchived: false });
    const faculties = await Course.distinct('faculty', { privacy: 'public', isArchived: false });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: courses,
      filters: { categories, faculties },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting public courses:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get courses'
    });
  }
};

exports.getPublicCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('teacher', 'name email avatarUrl bio')
      .select('title description thumbnail category level faculty program price courseCode institution modules');

    if (!course || course.privacy !== 'public') {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    const enrollmentCount = await Enrollment.countDocuments({ course: id });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...course.toObject(),
        enrollmentCount
      }
    });
  } catch (error) {
    console.error('Error getting public course:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get course'
    });
  }
};

exports.getFeaturedCourses = async (req, res) => {
  try {
    const { limit = 6 } = req.query;

    const courses = await Course.find({ privacy: 'public', isArchived: false, featured: true })
      .populate('teacher', 'name')
      .select('title description thumbnail category level price courseCode')
      .limit(parseInt(limit));

    if (courses.length === 0) {
      const recent = await Course.find({ privacy: 'public', isArchived: false })
        .populate('teacher', 'name')
        .select('title description thumbnail category level price courseCode')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));
      return res.status(constants.HTTP_STATUS.OK).json({
        success: true,
        data: recent
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Error getting featured courses:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get featured courses'
    });
  }
};
