const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const constants = require('../config/constants');

exports.getLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    const isTeacher = course.teacher.toString() === userId;
    const isAdmin = userRole === 'admin';
    let isEnrolled = false;

    if (!isTeacher && !isAdmin) {
      const Enrollment = require('../models/Enrollment');
      const enrollment = await Enrollment.findOne({ student: userId, course: courseId });
      isEnrolled = !!enrollment;

      if (!isEnrolled) {
        return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'You must be enrolled in this course to view lessons'
        });
      }
    }

    let query = { course: courseId };
    if (!isTeacher && !isAdmin) {
      query.isPublished = true;
    }

    const lessons = await Lesson.find(query)
      .populate('course', 'title courseCode')
      .sort({ order: 1 });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: lessons
    });
  } catch (error) {
    console.error('Error getting lessons:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get lessons'
    });
  }
};

exports.createLesson = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, content, videoUrl, type, moduleId } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    const maxOrder = await Lesson.countDocuments({ course: courseId });
    
    const lesson = new Lesson({
      title,
      description: description || '',
      content: content || '',
      videoUrl: videoUrl || '',
      type: type || 'video',
      course: courseId,
      moduleId: moduleId || null,
      order: maxOrder,
    });

    await lesson.save();
    await lesson.populate('course', 'title courseCode');

    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: lesson,
      message: 'Lesson created successfully'
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to create lesson'
    });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const { title, description, content, videoUrl, type, isPublished, moduleId, order } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    if (title) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (content !== undefined) lesson.content = content;
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
    if (type) lesson.type = type;
    if (isPublished !== undefined) lesson.isPublished = isPublished;
    if (moduleId !== undefined) lesson.moduleId = moduleId;
    if (order !== undefined) lesson.order = order;

    await lesson.save();
    await lesson.populate('course', 'title courseCode');

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: lesson,
      message: 'Lesson updated successfully'
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to update lesson'
    });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    const lesson = await Lesson.findOneAndDelete({ _id: lessonId, course: courseId });
    if (!lesson) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: 'Lesson deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete lesson'
    });
  }
};

exports.reorderLessons = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { lessonIds } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    for (let i = 0; i < lessonIds.length; i++) {
      await Lesson.findByIdAndUpdate(lessonIds[i], { order: i });
    }

    const lessons = await Lesson.find({ course: courseId }).sort({ order: 1 });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: lessons,
      message: 'Lessons reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering lessons:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to reorder lessons'
    });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const fileUrl = req.file.path ? `/uploads/${req.file.filename}` : req.file.location;
    const attachment = {
      name: req.file.originalname,
      url: fileUrl,
      type: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date()
    };

    lesson.attachments = lesson.attachments || [];
    lesson.attachments.push(attachment);
    await lesson.save();

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: lesson,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload file'
    });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const { courseId, lessonId, attachmentIndex } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    const lesson = await Lesson.findOne({ _id: lessonId, course: courseId });
    if (!lesson) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const index = parseInt(attachmentIndex);
    if (isNaN(index) || index < 0 || index >= (lesson.attachments || []).length) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid attachment index'
      });
    }

    lesson.attachments.splice(index, 1);
    await lesson.save();

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: lesson,
      message: 'Attachment deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete attachment'
    });
  }
};
