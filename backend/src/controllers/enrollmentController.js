const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');
const User = require('../models/User');
const constants = require('../config/constants');

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

exports.enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Course ID is required' 
      });
    }

    if (typeof courseId !== 'string' || courseId.trim().length === 0) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Invalid course ID' 
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (!user.institution) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'You must have an institution set to enroll in courses' 
      });
    }

    if (course.institution !== user.institution) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'You can only enroll in courses from your institution' 
      });
    }

    if (course.privacy === 'private') {
      const existingEnrollment = await Enrollment.findOne({
        student: req.user.id,
        course: courseId
      });
      
      if (existingEnrollment) {
        return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
          success: false,
          message: 'Already enrolled in this course' 
        });
      }
      
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'This is a private course. You need an invitation to enroll.' 
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: req.user.id,
      course: courseId
    });

    if (existingEnrollment) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Already enrolled in this course' 
      });
    }

    const enrollment = new Enrollment({
      student: req.user.id,
      course: courseId,
      progress: 0,
      completed: false
    });

    await enrollment.save();
    await enrollment.populate([
      { path: 'student', select: 'name email' },
      { path: 'course', select: 'title description price thumbnail' }
    ]);

    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: enrollment
    });
  } catch (err) {
    console.error('EnrollCourse error:', err.message);
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

exports.getMyEnrollments = async (req, res) => {
  try {
    const { page = constants.PAGINATION.DEFAULT_PAGE, limit = constants.PAGINATION.DEFAULT_LIMIT } = req.query;
    const pageNum = Math.max(1, parseInt(page) || constants.PAGINATION.DEFAULT_PAGE);
    const limitNum = Math.min(constants.PAGINATION.MAX_LIMIT, Math.max(1, parseInt(limit) || constants.PAGINATION.DEFAULT_LIMIT));

    const user = await User.findById(req.user.id);
    if (!user || !user.institution) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'User must have an institution set' 
      });
    }

    const total = await Enrollment.countDocuments({ student: req.user.id });

    const enrollments = await Enrollment.find({ student: req.user.id })
      .populate({
        path: 'course',
        match: { 
          $or: [
            { institution: user.institution },
            { privacy: 'public' }
          ]
        },
        select: 'title description price thumbnail videoUrls teacher institution privacy',
        populate: { path: 'teacher', select: 'name email' }
      })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    const validEnrollments = enrollments.filter(e => e.course !== null);
    
    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: validEnrollments,
      pagination: buildPagination(pageNum, limitNum, total)
    });
  } catch (err) {
    console.error('GetMyEnrollments error:', err.message);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Progress must be between 0 and 100' 
      });
    }

    const enrollment = await Enrollment.findById(req.params.id)
      .populate({
        path: 'course',
        select: 'institution teacher'
      });

    if (!enrollment) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Enrollment not found' 
      });
    }

    if (enrollment.student.toString() !== req.user.id) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Not authorized to update this enrollment' 
      });
    }

    const user = await User.findById(req.user.id);
    if (enrollment.course.institution !== user.institution) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Not authorized to update this enrollment' 
      });
    }

    enrollment.progress = progress;
    enrollment.completed = progress === 100;

    await enrollment.save();
    await enrollment.populate([
      { path: 'student', select: 'name email' },
      { path: 'course', select: 'title description price thumbnail' }
    ]);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: enrollment
    });
  } catch (err) {
    console.error('UpdateProgress error:', err.message);
    if (err.kind === 'ObjectId') {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Enrollment not found' 
      });
    }
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate({
        path: 'course',
        select: 'title description price thumbnail videoUrls teacher institution',
        populate: { path: 'teacher', select: 'name email' }
      })
      .populate('student', 'name email');

    if (!enrollment) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Enrollment not found' 
      });
    }

    const user = await User.findById(req.user.id);
    if (enrollment.student._id.toString() !== req.user.id && 
        enrollment.course.teacher._id.toString() !== req.user.id &&
        req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Not authorized to view this enrollment' 
      });
    }

    if (enrollment.course.institution !== user.institution && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Not authorized to view this enrollment' 
      });
    }

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: enrollment
    });
  } catch (err) {
    console.error('GetEnrollmentById error:', err.message);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.getCourseEnrollments = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    const user = await User.findById(req.user.id);
    if (course.teacher.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Not authorized to view enrollments' 
      });
    }

    if (course.institution !== user.institution && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'Not authorized to view enrollments for this course' 
      });
    }

    const enrollments = await Enrollment.find({ course: req.params.courseId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    const processedEnrollments = enrollments.map(e => {
      const enrollment = e.toObject();
      if (!enrollment.student && enrollment.studentEmail) {
        enrollment.user = {
          name: 'Pending Invite',
          email: enrollment.studentEmail
        };
        enrollment.isPending = true;
      }
      return enrollment;
    });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: processedEnrollments
    });
  } catch (err) {
    console.error('GetCourseEnrollments error:', err.message);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.autoEnrollForCurrentSemester = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (!user.program || !user.currentSemester) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'User must have program and semester set' 
      });
    }

    if (!user.institution) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'User must have an institution set' 
      });
    }

    const courses = await Course.find({
      program: user.program,
      semester: user.currentSemester,
      institution: user.institution,
      $or: [
        { privacy: 'institution' },
        { privacy: 'public' }
      ]
    });

    if (courses.length === 0) {
      return res.status(constants.HTTP_STATUS.OK).json({ 
        success: true,
        message: 'No courses found for your program and semester',
        data: [] 
      });
    }

    const existingEnrollments = await Enrollment.find({
      student: user._id,
      course: { $in: courses.map(c => c._id) }
    });

    const existingCourseIds = existingEnrollments.map(e => e.course.toString());

    const newCourses = courses.filter(c => !existingCourseIds.includes(c._id.toString()));

    const newEnrollments = await Promise.all(
      newCourses.map(course => {
        const enrollment = new Enrollment({
          student: user._id,
          course: course._id,
          progress: 0,
          completed: false
        });
        return enrollment.save();
      })
    );

    const allEnrollments = await Enrollment.find({ student: user._id })
      .populate({
        path: 'course',
        match: { 
          $or: [
            { institution: user.institution },
            { privacy: 'public' }
          ]
        },
        select: 'title description price thumbnail videoUrls teacher program semester',
        populate: { path: 'teacher', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    const validEnrollments = allEnrollments.filter(e => e.course !== null);

    const newlyEnrolledCourses = newEnrollments.map(e => 
      validEnrollments.find(a => a._id.toString() === e._id.toString())
    ).filter(Boolean);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: `Enrolled in ${newEnrollments.length} new course(s)`,
      data: {
        totalEnrollments: validEnrollments.length,
        enrollments: validEnrollments,
        newlyEnrolled: newlyEnrolledCourses
      }
    });
  } catch (err) {
    console.error('AutoEnrollForCurrentSemester error:', err.message);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.joinByCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'Course code is required' 
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (!user.institution) {
      return res.status(constants.HTTP_STATUS.BAD_REQUEST).json({ 
        success: false,
        message: 'You must have an institution set to join courses' 
      });
    }

    const course = await Course.findOne({
      courseCode: code.trim().toUpperCase(),
      institution: user.institution
    }).populate('teacher', 'name email');

    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({ 
        success: false,
        message: 'Course not found for your institution' 
      });
    }

    if (course.privacy === 'private') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({ 
        success: false,
        message: 'This is a private course. You need an invitation to enroll.' 
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      student: user._id,
      course: course._id
    });

    if (existingEnrollment) {
      await existingEnrollment.populate([
        { path: 'student', select: 'name email' },
        { path: 'course', select: 'title description price thumbnail videoUrls teacher courseCode' }
      ]);
      return res.status(constants.HTTP_STATUS.OK).json({ 
        success: true,
        message: 'Already enrolled in this course',
        data: existingEnrollment
      });
    }

    const enrollment = new Enrollment({
      student: user._id,
      course: course._id,
      progress: 0,
      completed: false
    });

    await enrollment.save();
    await enrollment.populate([
      { path: 'student', select: 'name email' },
      { path: 'course', select: 'title description price thumbnail videoUrls teacher courseCode' }
    ]);

    res.status(constants.HTTP_STATUS.CREATED).json({ 
      success: true,
      message: 'Successfully enrolled in course',
      data: enrollment 
    });
  } catch (err) {
    console.error('JoinByCode error:', err.message);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};
