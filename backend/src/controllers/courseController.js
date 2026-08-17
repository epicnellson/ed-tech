const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');
const constants = require('../config/constants');
const { io } = require('../server');
const { 
  canAccessCourse, 
  canEnrollInCourse, 
  canEditCourse,
  canViewCourseEnrollments 
} = require('../services/courseService');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const generateCourseCode = () => {
  const chars = constants.COURSE.CODE_CHARS;
  let code = '';
  for (let i = 0; i < constants.COURSE.CODE_LENGTH; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const buildPagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page: Number(page),
    limit: Number(limit),
    totalItems: total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

exports.getCourses = async (req, res) => {
  try {
    const { teacher, search, institution, category, page = constants.PAGINATION.DEFAULT_PAGE, limit = constants.PAGINATION.DEFAULT_LIMIT } = req.query;
    
    const pageNum = Math.max(1, parseInt(page) || constants.PAGINATION.DEFAULT_PAGE);
    const limitNum = Math.min(constants.PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit) || constants.PAGINATION.DEFAULT_LIMIT));
    
    let query = {};

    const user = await User.findById(req.user?.id);

    if (user) {
      if (user.role === 'student') {
        const enrollments = await Enrollment.find({ student: user._id }).select('course');
        const enrolledCourseIds = enrollments.map(e => e.course);
        query = {
          $or: [
            { institution: user.institution, privacy: { $ne: 'private' } },
            { privacy: 'public' },
            { _id: { $in: enrolledCourseIds } }
          ]
        };
      } else if (user.role === 'teacher') {
        // Teachers see their own courses by default in getCourses if no other filter
        // If they want to browse, they should see institution courses
        query = {
          $or: [
            { teacher: user._id },
            { institution: user.institution, privacy: { $ne: 'private' } },
            { privacy: 'public' }
          ]
        };
      } else if (user.role === 'admin') {
        query = {
          $or: [
            { institution: user.institution },
            { privacy: 'public' }
          ]
        };
      }
    } else {
      query = { privacy: 'public' };
    }

    if (institution) {
      query.$or = [{ institution }, { privacy: 'public' }];
    }

    if (teacher) {
      query.teacher = teacher;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      const safeSearch = escapeRegex(search);
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: safeSearch, $options: 'i' } },
          { description: { $regex: safeSearch, $options: 'i' } },
          { courseCode: { $regex: safeSearch, $options: 'i' } }
        ]
      });
    }

    const total = await Course.countDocuments(query);
    
    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: courses,
      pagination: buildPagination(pageNum, limitNum, total)
    });
  } catch (err) {
    console.error('GetCourses error:', err.message);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email');

    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    const user = await User.findById(req.user?.id);

    const hasAccess = await canAccessCourse(user, course);
    if (!hasAccess) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Not authorized to view this course' 
      });
    }

    const isTeacher = course.teacher.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';
    let enrolled = false;

    if (user && user.role === 'student') {
      const enrollment = await Enrollment.findOne({ student: user._id, course: course._id });
      enrolled = !!enrollment;
    }

    const showAllContent = isTeacher || isAdmin || enrolled;

    let lessonQuery = { course: course._id };
    if (!isTeacher && !isAdmin) {
      lessonQuery.isPublished = true;
    }

    let lessons;
    if (showAllContent) {
      lessons = await Lesson.find(lessonQuery).sort({ order: 1 });
    } else {
      // Only return metadata for non-enrolled users
      lessons = await Lesson.find(lessonQuery)
        .select('title order type moduleId isPublished')
        .sort({ order: 1 });
    }

    const quizzes = await Quiz.find({ course: course._id }).select('title description totalPoints createdAt');

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...course.toObject(),
        lessons,
        quizzes,
        modules: course.modules || [],
        enrolled
      }
    });
  } catch (err) {
    console.error('GetCourseById error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Course not found' 
      });
    }
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { 
      title, description, price, thumbnail, videoUrls, 
      courseCode, faculty, program, semester, privacy, category, level 
    } = req.body;

    if (!title || !description || !price) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Please enter title, description and price' 
      });
    }

    if (typeof title !== 'string' || title.trim().length < constants.COURSE.TITLE_MIN_LENGTH) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: `Title must be at least ${constants.COURSE.TITLE_MIN_LENGTH} characters` 
      });
    }

    if (typeof description !== 'string' || description.trim().length < constants.COURSE.DESCRIPTION_MIN_LENGTH) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: `Description must be at least ${constants.COURSE.DESCRIPTION_MIN_LENGTH} characters` 
      });
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Price must be a valid positive number' 
      });
    }

    if (videoUrls && !Array.isArray(videoUrls)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Video URLs must be an array' 
      });
    }

    if (!privacy || !constants.PRIVACY.VALUES.includes(privacy)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Valid privacy setting is required' 
      });
    }

    if (!category || category.trim().length === 0) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Category is required' 
      });
    }

    if (!level || level.trim().length === 0) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Level is required' 
      });
    }

    const teacher = await User.findById(req.user.id);
    if (!teacher) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Teacher not found' 
      });
    }

    if (!teacher.institution) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Teacher must have an institution set' 
      });
    }

    const finalCourseCode = courseCode && courseCode.trim() ? courseCode.trim().toUpperCase() : generateCourseCode();

    const existingCourse = await Course.findOne({ 
      institution: teacher.institution, 
      courseCode: finalCourseCode 
    });
    if (existingCourse) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Course code already exists for your institution' 
      });
    }

    const course = new Course({
      title: title.trim(),
      description: description.trim(),
      price: priceNum,
      thumbnail: thumbnail || '',
      videoUrls: videoUrls || [],
      teacher: req.user.id,
      institution: teacher.institution,
      courseCode: finalCourseCode,
      faculty: faculty || '',
      program: program || '',
      semester: semester || 1,
      privacy: privacy || constants.PRIVACY.DEFAULT,
      category: category.trim(),
      level: level.trim()
    });

    await course.save();
    await course.populate('teacher', 'name email');

    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: course
    });
  } catch (err) {
    console.error('CreateCourse error:', err.message);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    if (!canEditCourse(req.user, course)) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Not authorized to update this course' 
      });
    }

    const { 
      title, description, price, thumbnail, videoUrls, 
      courseCode, faculty, program, semester, privacy, category, level 
    } = req.body;

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length < constants.COURSE.TITLE_MIN_LENGTH) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
          success: false,
          message: `Title must be at least ${constants.COURSE.TITLE_MIN_LENGTH} characters` 
        });
      }
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length < constants.COURSE.DESCRIPTION_MIN_LENGTH) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
          success: false,
          message: `Description must be at least ${constants.COURSE.DESCRIPTION_MIN_LENGTH} characters` 
        });
      }
    }

    if (price !== undefined) {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum < 0) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
          success: false,
          message: 'Price must be a valid positive number' 
        });
      }
    }

    if (videoUrls && !Array.isArray(videoUrls)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Video URLs must be an array' 
      });
    }

    if (privacy !== undefined && !constants.PRIVACY.VALUES.includes(privacy)) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Privacy must be private, institution, or public' 
      });
    }

    if (courseCode !== undefined) {
      const newCourseCode = courseCode.trim().toUpperCase();
      if (newCourseCode !== course.courseCode) {
        const existingCourse = await Course.findOne({ 
          institution: course.institution, 
          courseCode: newCourseCode,
          _id: { $ne: course._id }
        });
        if (existingCourse) {
          return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
            success: false,
            message: 'Course code already exists for your institution' 
          });
        }
      }
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (videoUrls !== undefined) updateData.videoUrls = videoUrls;
    if (courseCode !== undefined) updateData.courseCode = courseCode.trim().toUpperCase();
    if (faculty !== undefined) updateData.faculty = faculty;
    if (program !== undefined) updateData.program = program;
    if (semester !== undefined) updateData.semester = semester;
    if (privacy !== undefined) updateData.privacy = privacy;
    if (category !== undefined) updateData.category = category.trim();
    if (level !== undefined) updateData.level = level.trim();

    course = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('teacher', 'name email');

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: course
    });
  } catch (err) {
    console.error('UpdateCourse error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Course not found' 
      });
    }
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    if (!canEditCourse(req.user, course)) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Not authorized to delete this course' 
      });
    }

    const courseId = course._id;

    await Promise.all([
      Lesson.deleteMany({ course: courseId }),
      require('../models/Assignment').deleteMany({ course: courseId }),
      require('../models/AssignmentSubmission').deleteMany({ course: courseId }),
      require('../models/Enrollment').deleteMany({ course: courseId }),
      require('../models/CourseResource').deleteMany({ course: courseId }),
      require('../models/Announcement').deleteMany({ course: courseId }),
      require('../models/Quiz').deleteMany({ course: courseId }),
      require('../models/QuizAttempt').deleteMany({ course: courseId })
    ]);

    await Course.findByIdAndDelete(req.params.id);

    res.status(constants.HTTP_STATUS.OK).json({ 
      success: true,
      message: 'Course removed' 
    });
  } catch (err) {
    console.error('DeleteCourse error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Course not found' 
      });
    }
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.getMyCourses = async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const teacher = await User.findById(req.user.id);
    if (!teacher) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Teacher not found' 
      });
    }

    const query = { 
      teacher: new mongoose.Types.ObjectId(req.user.id)
    };

    const courses = await Course.find(query)
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: courses
    });
  } catch (err) {
    console.error('GetMyCourses error:', err.message);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.goLive = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (!course.teacher) {
      return res.status(400).json({ success: false, message: 'Course has no teacher assigned' });
    }
    
    const teacherId = String(course.teacher);
    const isOwner = teacherId === userId;
    
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to start live session for this course' });
    }

    const crypto = require('crypto');
    const randomPart = crypto.randomBytes(4).toString('hex');
    const jitsiRoomName = `edtech-${id}-${randomPart}`;

    course.isLive = true;
    course.jitsiRoom = jitsiRoomName;
    await course.save();

    // Notify institutional room (discovery) - NO jitsiRoom
    io.to(`institution:${course.institution}`).emit('live-started', {
      courseId: course._id,
      title: course.title,
      institution: course.institution,
      teacherName: req.user.name
    });

    // Notify specific course room (enrolled) - WITH jitsiRoom
    io.to(String(course._id)).emit('live-started', {
      courseId: course._id,
      title: course.title,
      jitsiRoom: jitsiRoomName,
      isLive: true
    });

    res.status(200).json({ 
      success: true,
      data: {
        courseId: course._id,
        isLive: true,
        jitsiRoom: jitsiRoomName,
        liveUrl: `/live/${course._id}`
      }
    });
  } catch (err) {
    console.error('GoLive error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to start live session' });
  }
};

exports.stopLive = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ success: false, message: 'Invalid course ID' });
    }
    
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    if (!course.teacher) {
      return res.status(400).json({ success: false, message: 'Course has no teacher assigned' });
    }
    
    const teacherId = String(course.teacher);
    const isOwner = teacherId === userId;
    
    if (!isOwner && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to end live session for this course' });
    }

    course.isLive = false;
    course.jitsiRoom = null;
    await course.save();

    io.to(id).emit('live-ended', { courseId: id, reason: 'teacher_ended' });
    io.to(`institution:${course.institution}`).emit('live-ended', { 
      courseId: id, 
      reason: 'teacher_ended' 
    });

    res.status(200).json({ 
      success: true,
      message: 'Live session ended'
    });
  } catch (err) {
    console.error('StopLive error:', err.message);
    res.status(500).json({ success: false, message: 'Failed to end live session' });
  }
};

exports.enrollStudentByEmail = async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { email } = req.body;
    const userId = req.user.id;

    if (!email || typeof email !== 'string') {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Email is required'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.privacy !== 'private') {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'This endpoint is only for private courses'
      });
    }

    const teacherUser = await User.findById(userId);
    if (!teacherUser || !teacherUser.institution) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Teacher must have an institution set'
      });
    }

    let student = await User.findOne({ email: email.toLowerCase().trim() });

    if (!student) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'No user found with this email. The student must register first.'
      });
    }

    if (student.institution !== teacherUser.institution) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Student must be from the same institution'
      });
    }

    if (student.role !== 'student') {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Can only enroll students'
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: student._id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Student is already enrolled in this course'
      });
    }

    const enrollment = new Enrollment({
      student: student._id,
      studentEmail: student.email,
      course: courseId,
      progress: 0,
      completed: false,
      status: 'active',
      invitedAt: new Date()
    });

    await enrollment.save();
    await enrollment.populate([
      { path: 'student', select: 'name email studentId' },
      { path: 'course', select: 'title courseCode' }
    ]);

    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: enrollment,
      message: `Successfully enrolled ${student.name} in the course`
    });
  } catch (err) {
    console.error('EnrollStudentByEmail error:', err.message);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to enroll student'
    });
  }
};
