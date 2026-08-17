const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const User = require('../models/User');
const CourseResource = require('../models/CourseResource');
const logger = require('../services/logger');

const authorizeCourse = (action = 'edit') => {
  return async (req, res, next) => {
    try {
      const courseId = req.params.id || req.params.courseId;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message: 'Course ID is required'
        });
      }

      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      // Handle case where teacher field might be undefined
      const teacherId = course.teacher ? course.teacher.toString() : null;
      const isOwner = teacherId === userId;
      const isAdmin = userRole === 'admin';

      if (action === 'edit' || action === 'delete') {
        if (!isOwner && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to ' + action + ' this course'
          });
        }
      }

      if (action === 'view') {
        const isEnrolled = await checkEnrollment(userId, courseId);
        const isPublic = course.privacy === 'public';
        const isInstitution = course.institution === req.user.institution;

        if (!isPublic && !isInstitution && !isOwner && !isAdmin && !isEnrolled) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to view this course'
          });
        }
      }

      req.course = course;
      next();
    } catch (err) {
      logger.error('Authorization error', { error: err.message, courseId: req.params.id || req.params.courseId });
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

const authorizeAssignment = (action = 'edit') => {
  return async (req, res, next) => {
    try {
      const assignmentId = req.params.id || req.params.assignmentId;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!assignmentId) {
        return res.status(400).json({
          success: false,
          message: 'Assignment ID is required'
        });
      }

      const assignment = await Assignment.findById(assignmentId);

      if (!assignment) {
        return res.status(404).json({
          success: false,
          message: 'Assignment not found'
        });
      }

      const course = await Course.findById(assignment.course);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found for this assignment'
        });
      }

      const isCourseOwner = course.teacher ? course.teacher.toString() === userId : false;
      const isAdmin = userRole === 'admin';

      if (action === 'edit' || action === 'delete' || action === 'grade') {
        if (!isCourseOwner && !isAdmin) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to ' + action + ' this assignment'
          });
        }
      }

      if (action === 'view') {
        const isEnrolled = await checkEnrollment(userId, assignment.course.toString());
        
        if (!isCourseOwner && !isAdmin && !isEnrolled) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to view this assignment'
          });
        }
      }

      req.assignment = assignment;
      req.course = course;
      next();
    } catch (err) {
      logger.error('Assignment authorization error', { error: err.message, assignmentId: req.params.id || req.params.assignmentId });
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

const checkEnrollment = async (userId, courseId) => {
  const Enrollment = require('../models/Enrollment');
  const enrollment = await Enrollment.findOne({ student: userId, course: courseId });
  return !!enrollment;
};

const authorizeResource = (resourceModel = 'CourseResource') => {
  return async (req, res, next) => {
    try {
      const resourceId = req.params.id;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        });
      }

      let resource;
      let courseId;

      if (resourceModel === 'CourseResource') {
        resource = await CourseResource.findById(resourceId);
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Resource not found'
          });
        }
        courseId = resource.course;
      } else if (resourceModel === 'Assignment') {
        resource = await Assignment.findById(resourceId);
        if (!resource) {
          return res.status(404).json({
            success: false,
            message: 'Assignment not found'
          });
        }
        courseId = resource.course;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Unknown resource model'
        });
      }

      const course = await Course.findById(courseId);
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const isOwner = course.teacher.toString() === userId;
      const isAdmin = userRole === 'admin';

      if (isOwner || isAdmin) {
        req.course = course;
        req.resource = resource;
        return next();
      }

      const isEnrolled = await checkEnrollment(userId, courseId);
      if (!isEnrolled) {
        logger.warn('Unauthorized resource access attempt', { userId, resourceId, courseId });
        return res.status(403).json({
          success: false,
          message: 'You must be enrolled in this course to access this resource'
        });
      }

      req.course = course;
      req.resource = resource;
      next();
    } catch (err) {
      logger.error('Resource authorization error', { error: err.message, resourceId: req.params.id });
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};

const requireTeacherOrAdmin = (req, res, next) => {
  const userRole = req.user.role;
  
  if (userRole !== 'teacher' && userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teacher or admin privileges required.'
    });
  }
  
  next();
};

const requireAdmin = (req, res, next) => {
  const userRole = req.user.role;
  
  if (userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  
  next();
};

module.exports = {
  authorizeCourse,
  authorizeAssignment,
  requireTeacherOrAdmin,
  requireAdmin,
  authorizeResource
};
