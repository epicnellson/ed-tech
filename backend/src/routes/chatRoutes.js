const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const auth = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');
const Course = require('../models/Course');
const { generateCourseAssistantReply, canAccessCourse } = require('../services/aiAssistantService');

router.post(
  '/course-assistant',
  [
    auth,
    body('courseId')
      .isMongoId()
      .withMessage('Invalid course ID'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 1, max: 1000 })
      .withMessage('Message must be between 1 and 1000 characters'),
  ],
  validate,
  async (req, res, next) => {
    try {
      const { courseId, message } = req.body;

      const course = await Course.findById(courseId).populate('teacher', 'name email');
      
      if (!course) {
        return res.status(404).json({
          success: false,
          message: 'Course not found'
        });
      }

      const hasAccess = await canAccessCourse(req.user, course);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'You do not have access to this course'
        });
      }

      const assistantResponse = await generateCourseAssistantReply({
        user: req.user,
        course,
        message
      });

      res.json({
        success: true,
        reply: assistantResponse.reply,
        metadata: {
          category: assistantResponse.category,
          courseTitle: course.title,
          timestamp: new Date().toISOString()
        }
      });

    } catch (err) {
      console.error('Course assistant error:', err.message);
      res.status(500).json({
        success: false,
        message: 'Failed to get assistant response'
      });
    }
  }
);

module.exports = router;
