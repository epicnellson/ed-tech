const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const notificationService = require('../services/notificationService');

const constants = require('../config/constants');

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

const isTeacherOfCourse = async (user, courseId) => {
  const course = await Course.findById(courseId);
  if (!course) return false;
  return course.teacher.toString() === user.id || user.role === 'admin';
};

exports.createAssignment = async (req, res) => {
  try {
    const { courseId, title, description, dueDate, maxScore } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
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
        message: 'Only course teachers can create assignments'
      });
    }

    let attachment = null;
    if (req.file) {
      attachment = {
        url: req.file.path ? `/uploads/${req.file.filename}` : req.file.location,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        fileSize: req.file.size
      };
    }

    const assignment = await Assignment.create({
      course: courseId,
      title,
      description: description || '',
      dueDate: dueDate || null,
      maxScore: maxScore || 100,
      isPublished: false,
      attachment,
      createdBy: userId
    });

    await assignment.populate('course');

    notificationService.notifyAssignmentCreated(assignment, course);

    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: assignment,
      message: 'Assignment created successfully'
    });
  } catch (error) {
    console.error('Error creating assignment:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to create assignment'
    });
  }
};

exports.getTeacherAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const teacherCourses = await Course.find({ teacher: userId });
    const courseIds = teacherCourses.map(c => c._id);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const assignments = await Assignment.find({ course: { $in: courseIds } })
      .populate('course', 'title courseCode')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Assignment.countDocuments({ course: { $in: courseIds } });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: assignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting teacher assignments:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get assignments'
    });
  }
};

exports.getStudentAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const enrollments = await Enrollment.find({ student: userId }).select('course');
    const courseIds = enrollments.map(e => e.course);

    let query = { 
      course: { $in: courseIds },
      isPublished: true
    };

    if (status === 'upcoming') {
      query.dueDate = { $gte: new Date() };
    } else if (status === 'past') {
      query.dueDate = { $lt: new Date() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const assignments = await Assignment.find(query)
      .populate('course', 'title courseCode')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const submissions = await AssignmentSubmission.find({
      student: userId,
      assignment: { $in: assignments.map(a => a._id) }
    });

    const submissionMap = {};
    submissions.forEach(s => {
      submissionMap[s.assignment.toString()] = s;
    });

    const assignmentsWithStatus = assignments.map(assignment => ({
      ...assignment.toObject(),
      submission: submissionMap[assignment._id.toString()] || null,
      status: submissionMap[assignment._id.toString()] 
        ? (submissionMap[assignment._id.toString()].score !== null ? 'graded' : 'submitted')
        : 'not_started'
    }));

    const total = await Assignment.countDocuments(query);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: assignmentsWithStatus,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting student assignments:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get assignments'
    });
  }
};

exports.getCourseAssignments = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const { allowed, course } = await canAccessCourse(req.user, courseId);
    if (!allowed) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have access to this course'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let assignmentQuery = { course: courseId };
    if (req.user.role === 'student') {
      assignmentQuery.isPublished = true;
    }

    const assignments = await Assignment.find(assignmentQuery)
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    let submissions = [];
    if (req.user.role === 'student') {
      submissions = await AssignmentSubmission.find({
        student: userId,
        assignment: { $in: assignments.map(a => a._id) }
      });
    }

    const submissionMap = {};
    submissions.forEach(s => {
      submissionMap[s.assignment.toString()] = s;
    });

    const assignmentsWithSubmission = assignments.map(assignment => ({
      ...assignment.toObject(),
      mySubmission: submissionMap[assignment._id.toString()] || null,
      status: submissionMap[assignment._id.toString()]
        ? (submissionMap[assignment._id.toString()].score !== null ? 'graded' : 'submitted')
        : 'not_started'
    }));

    const total = await Assignment.countDocuments({ course: courseId });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: assignmentsWithSubmission,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting course assignments:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get assignments'
    });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const assignment = await Assignment.findById(id).populate('course', 'title courseCode teacher');
    if (!assignment) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const isCourseOwner = assignment.course.teacher.toString() === userId;
    const isAdmin = userRole === 'admin';
    const isEnrolled = await checkEnrollment(userId, assignment.course._id.toString());

    if (!isCourseOwner && !isAdmin && !isEnrolled) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have access to this assignment'
      });
    }

    if (userRole === 'student' && !assignment.isPublished) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'This assignment is not yet published'
      });
    }

    let submission = null;
    if (userRole === 'student') {
      submission = await AssignmentSubmission.findOne({
        assignment: id,
        student: userId
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        ...assignment.toObject(),
        mySubmission: submission
      }
    });
  } catch (error) {
    console.error('Error getting assignment:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get assignment'
    });
  }
};

const checkEnrollment = async (userId, courseId) => {
  const Enrollment = require('../models/Enrollment');
  const enrollment = await Enrollment.findOne({ student: userId, course: courseId });
  return !!enrollment;
};

exports.submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const assignment = await Assignment.findById(id).populate('course');
    if (!assignment) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    // Check if enrolled
    const Enrollment = require('../models/Enrollment');
    const enrollment = await Enrollment.findOne({ student: userId, course: assignment.course._id });
    if (!enrollment) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    if (!assignment.isPublished) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'This assignment is not yet published'
      });
    }

    let fileUrl = req.body.fileUrl;
    if (req.file) {
      fileUrl = req.file.path ? `/uploads/${req.file.filename}` : req.file.location;
    }

    let submission = await AssignmentSubmission.findOne({
      assignment: id,
      student: userId
    });

    if (submission) {
      // If already graded, don't allow resubmission unless you want to allow it
      if (submission.score !== null) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Cannot resubmit a graded assignment'
        });
      }

      submission.content = content || submission.content;
      if (fileUrl) {
        submission.fileUrl = fileUrl;
      }
      submission.submittedAt = new Date();
      await submission.save();
    } else {
      submission = await AssignmentSubmission.create({
        assignment: id,
        student: userId,
        course: assignment.course._id,
        content: content || '',
        fileUrl: fileUrl || null,
        submittedAt: new Date()
      });
    }

    await submission.populate([
      { path: 'student', select: 'name email' },
      { path: 'assignment', select: 'title maxScore' }
    ]);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: submission,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting assignment:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to submit assignment'
    });
  }
};

exports.getMySubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const { allowed } = await canAccessCourse(req.user, assignment.course);
    if (!allowed) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You do not have access to this assignment'
      });
    }

    const submission = await AssignmentSubmission.findOne({
      assignment: id,
      student: userId
    }).populate('assignment', 'title description dueDate maxScore');

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Error getting submission:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get submission'
    });
  }
};

exports.getSubmissions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { page = 1, limit = 20, graded } = req.query;

    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const isTeacher = await isTeacherOfCourse(req.user, assignment.course._id);
    if (!isTeacher) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only teachers can view submissions'
      });
    }

    let query = { assignment: assignmentId };
    if (graded === 'true') {
      query.score = { $ne: null };
    } else if (graded === 'false') {
      query.score = null;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const submissions = await AssignmentSubmission.find(query)
      .populate('student', 'name email studentId')
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AssignmentSubmission.countDocuments(query);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: submissions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting submissions:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get submissions'
    });
  }
};

exports.gradeSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { submissionId, score, feedback } = req.body;
    const userId = req.user.id;

    const assignment = await Assignment.findById(assignmentId).populate('course');
    if (!assignment) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const isTeacher = await isTeacherOfCourse(req.user, assignment.course._id);
    if (!isTeacher) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only teachers can grade submissions'
      });
    }

    const submission = await AssignmentSubmission.findById(submissionId);
    if (!submission || submission.assignment.toString() !== assignmentId) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Submission not found'
      });
    }

    if (score !== undefined) {
      submission.score = Math.min(Math.max(score, 0), assignment.maxScore);
    }
    if (feedback !== undefined) {
      submission.feedback = feedback;
    }
    submission.gradedAt = new Date();
    submission.gradedBy = userId;
    await submission.save();

    await submission.populate([
      { path: 'student', select: 'name email' },
      { path: 'assignment', select: 'title maxScore' }
    ]);

    notificationService.notifyAssignmentGraded(submission, assignment, assignment.course, submission.student);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: submission,
      message: 'Submission graded successfully'
    });
  } catch (error) {
    console.error('Error grading submission:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to grade submission'
    });
  }
};

exports.getUpcomingAssignments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 5 } = req.query;

    const enrollments = await Enrollment.find({ student: userId }).select('course');
    const courseIds = enrollments.map(e => e.course);

    const assignments = await Assignment.find({
      course: { $in: courseIds },
      dueDate: { $gte: new Date() }
    })
      .populate('course', 'title courseCode')
      .sort({ dueDate: 1 })
      .limit(parseInt(limit));

    const submissions = await AssignmentSubmission.find({
      student: userId,
      assignment: { $in: assignments.map(a => a._id) }
    });

    const submissionMap = {};
    submissions.forEach(s => {
      submissionMap[s.assignment.toString()] = s;
    });

    const upcomingAssignments = assignments.map(assignment => ({
      ...assignment.toObject(),
      status: submissionMap[assignment._id.toString()]
        ? (submissionMap[assignment._id.toString()].score !== null ? 'graded' : 'submitted')
        : 'not_started'
    }));

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: upcomingAssignments
    });
  } catch (error) {
    console.error('Error getting upcoming assignments:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get upcoming assignments'
    });
  }
};

exports.getPendingGrading = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const teacherCourses = await Course.find({ teacher: userId });
    const courseIds = teacherCourses.map(c => c._id);

    const assignments = await Assignment.find({ course: { $in: courseIds } }).select('_id course');
    const assignmentIds = assignments.map(a => a._id);

    const pendingCount = await AssignmentSubmission.countDocuments({
      assignment: { $in: assignmentIds },
      score: null,
      submittedAt: { $ne: null }
    });

    const pendingSubmissions = await AssignmentSubmission.find({
      assignment: { $in: assignmentIds },
      score: null,
      submittedAt: { $ne: null }
    })
      .populate('assignment', 'title dueDate maxScore')
      .populate('course', 'title courseCode')
      .populate('student', 'name email')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit));

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalPending: pendingCount,
        submissions: pendingSubmissions
      }
    });
  } catch (error) {
    console.error('Error getting pending grading:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get pending grading'
    });
  }
};

exports.togglePublish = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;
    const userId = req.user.id;

    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Assignment not found'
      });
    }

    const isTeacher = await isTeacherOfCourse(req.user, assignment.course);
    if (!isTeacher) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Only course teachers can publish/unpublish assignments'
      });
    }

    assignment.isPublished = isPublished !== undefined ? isPublished : !assignment.isPublished;
    await assignment.save();

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: assignment,
      message: assignment.isPublished ? 'Assignment published' : 'Assignment unpublished'
    });
  } catch (error) {
    console.error('Error toggling assignment publish:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to toggle assignment publish status'
    });
  }
};
