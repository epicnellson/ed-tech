const CourseResource = require('../models/CourseResource');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { storageAdapter, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } = require('../services/storageAdapter');
const logger = require('../services/logger');
const constants = require('../config/constants');

const canAccessCourse = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) return { allowed: false, course: null };

  if (user.role === 'admin') return { allowed: true, course };
  if (user.role === 'teacher' && course.teacher.toString() === user.id) return { allowed: true, course };
  if (user.role === 'student') {
    if (course.privacy === 'public') return { allowed: true, course };
    const enrollment = await Enrollment.findOne({ student: user.id, course: courseId });
    if (enrollment) return { allowed: true, course };
    if (course.privacy === 'institution' && course.institution === user.institution) return { allowed: true, course };
  }
  return { allowed: false, course };
};

const isTeacherOfCourse = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) return false;
  return course.teacher.toString() === user.id || user.role === 'admin';
};

exports.uploadResource = async (req, res) => {
  try {
    const { courseId, title, description } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No file provided'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    const isTeacher = await isTeacherOfCourse(req.user, courseId);
    if (!isTeacher) {
      logger.warn('Unauthorized resource upload attempt', { userId, courseId });
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only course teachers can upload resources'
      });
    }

    storageAdapter.validateFile(req.file);

    const uploadResult = await storageAdapter.upload(req.file);

    const resource = await CourseResource.create({
      course: courseId,
      uploadedBy: userId,
      title: title || req.file.originalname,
      description: description || '',
      fileUrl: uploadResult.url,
      fileType: storageAdapter.getFileType(req.file.mimetype),
      mimeType: req.file.mimetype,
      originalFileName: req.file.originalname,
      size: req.file.size
    });

    await resource.populate('uploadedBy', 'name');

    logger.info('Resource uploaded', { resourceId: resource._id, courseId, userId });

    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: resource,
      message: 'Resource uploaded successfully'
    });
  } catch (error) {
    logger.error('Resource upload failed', { error: error.message, userId: req.user?.id });
    
    if (error.message.includes('File type not allowed') || error.message.includes('exceeds maximum')) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: error.message
      });
    }

    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload resource'
    });
  }
};

exports.getCourseResources = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const { allowed } = await canAccessCourse(req.user, courseId);
    if (!allowed) {
      logger.warn('Unauthorized resource access attempt', { userId, courseId });
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have access to this course'
      });
    }

    const resources = await CourseResource.find({ course: courseId })
      .populate('uploadedBy', 'name')
      .sort({ createdAt: -1 });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: resources
    });
  } catch (error) {
    logger.error('Get course resources failed', { error: error.message, courseId: req.params.courseId });
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get resources'
    });
  }
};

exports.getResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resource = await CourseResource.findById(id).populate('uploadedBy', 'name');
    if (!resource) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Resource not found'
      });
    }

    const { allowed } = await canAccessCourse(req.user, resource.course);
    if (!allowed) {
      logger.warn('Unauthorized resource access attempt', { userId, resourceId: id });
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have access to this resource'
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: resource
    });
  } catch (error) {
    logger.error('Get resource failed', { error: error.message, resourceId: req.params.id });
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get resource'
    });
  }
};

exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const resource = await CourseResource.findById(id);
    if (!resource) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Resource not found'
      });
    }

    const isTeacher = await isTeacherOfCourse(req.user, resource.course);
    if (!isTeacher) {
      logger.warn('Unauthorized resource delete attempt', { userId, resourceId: id });
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only course teachers can delete resources'
      });
    }

    await storageAdapter.delete(resource.fileUrl);
    await resource.deleteOne();

    logger.info('Resource deleted', { resourceId: id, courseId: resource.course, userId });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    logger.error('Delete resource failed', { error: error.message, resourceId: req.params.id });
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete resource'
    });
  }
};
