const Announcement = require('../models/Announcement');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const notificationService = require('../services/notificationService');

const constants = require('../config/constants');

const isTeacherOfCourse = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) return false;
  return course.teacher.toString() === user.id || user.role === 'admin';
};

exports.createAnnouncement = async (req, res) => {
  try {
    const { courseId, title, message, audienceType } = req.body;
    const userId = req.user.id;

    let course = null;
    let institution = null;

    if (audienceType === 'course') {
      if (!courseId) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Course ID is required for course announcements'
        });
      }

      course = await Course.findById(courseId);
      if (!course) {
        return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Course not found'
        });
      }

      const isTeacher = await isTeacherOfCourse(req.user, courseId);
      if (!isTeacher) {
        return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Only course teachers can create course announcements'
        });
      }

      institution = course.institution;
    } else if (audienceType === 'institution') {
      const user = await User.findById(userId);
      institution = user.institution;

      if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
        return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Only teachers and admins can create institution announcements'
        });
      }
    } else if (audienceType === 'global') {
      if (req.user.role !== 'admin') {
        return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Only admins can create global announcements'
        });
      }
    }

    const announcement = await Announcement.create({
      course: courseId || null,
      title,
      message,
      createdBy: userId,
      audienceType: audienceType || 'course',
      institution
    });

    await announcement.populate('createdBy', 'name email');

    notificationService.notifyAnnouncement(announcement, course, institution);

    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: announcement,
      message: 'Announcement created successfully'
    });
  } catch (error) {
    console.error('Error creating announcement:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to create announcement'
    });
  }
};

exports.getCourseAnnouncements = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    const { allowed } = await canAccessCourse(req.user, courseId);
    if (!allowed) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have access to this course'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const announcements = await Announcement.find({ 
      $or: [
        { course: courseId },
        { audienceType: { $in: ['institution', 'global'] } }
      ]
    })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Announcement.countDocuments({ 
      $or: [
        { course: courseId },
        { audienceType: { $in: ['institution', 'global'] } }
      ]
    });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting course announcements:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get announcements'
    });
  }
};

exports.getAnnouncementFeed = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    let courseIds = [];
    if (user.role === 'student') {
      const enrollments = await Enrollment.find({ student: userId }).select('course');
      courseIds = enrollments.map(e => e.course);
    } else if (user.role === 'teacher') {
      const teacherCourses = await Course.find({ teacher: userId }).select('_id');
      courseIds = teacherCourses.map(c => c._id);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const announcements = await Announcement.find({
      $or: [
        { course: { $in: courseIds } },
        { audienceType: 'global' },
        { audienceType: 'institution', institution: user.institution }
      ]
    })
      .populate('course', 'title courseCode')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Announcement.countDocuments({
      $or: [
        { course: { $in: courseIds } },
        { audienceType: 'global' },
        { audienceType: 'institution', institution: user.institution }
      ]
    });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: announcements,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting announcement feed:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get announcements'
    });
  }
};

exports.getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findById(id)
      .populate('course', 'title courseCode')
      .populate('createdBy', 'name email');

    if (!announcement) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Announcement not found'
      });
    }

    if (announcement.course) {
      const { allowed } = await canAccessCourse(req.user, announcement.course._id);
      if (!allowed) {
        return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have access to this announcement'
        });
      }
    } else if (announcement.audienceType === 'institution') {
      const user = await User.findById(req.user.id);
      if (user.institution !== announcement.institution && req.user.role !== 'admin') {
        return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You do not have access to this announcement'
        });
      }
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('Error getting announcement:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get announcement'
    });
  }
};

const canAccessCourse = async (user, courseId, requiredRoles = ['student', 'teacher', 'admin']) => {
  const course = await Course.findById(courseId);
  if (!course) return { allowed: false, course: null };

  if (requiredRoles.includes(user.role)) {
    if (user.role === 'admin') return { allowed: true, course };
    if (user.role === 'teacher' && course.teacher.toString() === user.id) return { allowed: true, course };
    if (user.role === 'student') {
      const enrollment = await Enrollment.findOne({ student: user.id, course: courseId });
      if (enrollment) return { allowed: true, course };
    }
  }
  return { allowed: false, course };
};
