const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const LessonProgress = require('../models/LessonProgress');
const Lesson = require('../models/Lesson');
const constants = require('../config/constants');

exports.getTeacherCoursesAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const courses = await Course.find({ teacher: userId, isArchived: false })
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const courseIds = courses.map(c => c._id);

    const enrollmentCounts = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds } } },
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);

    const enrollmentMap = {};
    enrollmentCounts.forEach(e => {
      enrollmentMap[e._id.toString()] = e.count;
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeStudentsCounts = await Enrollment.aggregate([
      { 
        $match: { 
          course: { $in: courseIds },
          updatedAt: { $gte: sevenDaysAgo }
        } 
      },
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);

    const activeMap = {};
    activeStudentsCounts.forEach(e => {
      activeMap[e._id.toString()] = e.count;
    });

    const completionCounts = await Enrollment.aggregate([
      { $match: { course: { $in: courseIds }, completed: true } },
      { $group: { _id: '$course', count: { $sum: 1 } } }
    ]);

    const completedMap = {};
    completionCounts.forEach(e => {
      completedMap[e._id.toString()] = e.count;
    });

    const analytics = courses.map(course => {
      const enrolled = enrollmentMap[course._id.toString()] || 0;
      const completed = completedMap[course._id.toString()] || 0;
      return {
        _id: course._id,
        title: course.title,
        courseCode: course.courseCode,
        thumbnail: course.thumbnail,
        enrollmentsCount: enrolled,
        activeStudents: activeMap[course._id.toString()] || 0,
        completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0
      };
    });

    const total = await Course.countDocuments({ teacher: userId, isArchived: false });

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: analytics,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting teacher courses analytics:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get courses analytics'
    });
  }
};

exports.getCourseAnalytics = async (req, res) => {
  try {
    const { courseId } = req.params;
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

    const enrollments = await Enrollment.find({ course: courseId })
      .populate('student', 'name email studentId')
      .sort({ updatedAt: -1 });

    const assignmentIds = await Assignment.find({ course: courseId }).select('_id');
    const assignmentIdList = assignmentIds.map(a => a._id);

    const submissions = await AssignmentSubmission.find({
      assignment: { $in: assignmentIdList }
    });

    const submissionsByStudent = {};
    submissions.forEach(s => {
      if (!submissionsByStudent[s.student.toString()]) {
        submissionsByStudent[s.student.toString()] = [];
      }
      submissionsByStudent[s.student.toString()].push(s);
    });

    const lessonIds = await Lesson.find({ course: courseId }).select('_id');
    const lessonIdList = lessonIds.map(l => l._id);

    const lessonProgress = await LessonProgress.find({
      lesson: { $in: lessonIdList },
      student: { $in: enrollments.map(e => e.student._id) }
    });

    const progressByStudent = {};
    lessonProgress.forEach(p => {
      if (!progressByStudent[p.student.toString()]) {
        progressByStudent[p.student.toString()] = { completed: 0, total: 0 };
      }
      progressByStudent[p.student.toString()].total += 1;
      if (p.completed) {
        progressByStudent[p.student.toString()].completed += 1;
      }
    });

    const students = enrollments.map(enrollment => {
      const studentSubmissions = submissionsByStudent[enrollment.student._id.toString()] || [];
      const avgScore = studentSubmissions.length > 0
        ? Math.round(studentSubmissions.reduce((sum, s) => sum + (s.score || 0), 0) / studentSubmissions.length)
        : null;
      
      const lessonProgressData = progressByStudent[enrollment.student._id.toString()] || { completed: 0, total: lessonIdList.length };
      const lessonProgressPercent = lessonIdList.length > 0 
        ? Math.round((lessonProgressData.completed / lessonIdList.length) * 100)
        : 0;

      return {
        _id: enrollment.student._id._id,
        name: enrollment.student.name,
        email: enrollment.student.email,
        studentId: enrollment.student.studentId,
        progress: enrollment.progress,
        completed: enrollment.completed,
        lessonProgress: lessonProgressPercent,
        assignmentScore: avgScore,
        enrolledAt: enrollment.createdAt,
        lastActivity: enrollment.updatedAt
      };
    });

    const enrolledCount = enrollments.length;
    const completedCount = enrollments.filter(e => e.completed).length;
    const avgProgress = enrolledCount > 0
      ? Math.round(enrollments.reduce((sum, e) => sum + e.progress, 0) / enrolledCount)
      : 0;
    const avgAssignmentScore = submissions.length > 0
      ? Math.round(submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length)
      : null;

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        course: {
          _id: course._id,
          title: course.title,
          courseCode: course.courseCode,
          enrollmentsCount: enrolledCount,
          completionRate: enrolledCount > 0 ? Math.round((completedCount / enrolledCount) * 100) : 0,
          averageProgress: avgProgress,
          averageAssignmentScore: avgAssignmentScore,
          totalLessons: lessonIdList.length,
          totalAssignments: assignmentIdList.length
        },
        students
      }
    });
  } catch (error) {
    console.error('Error getting course analytics:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get course analytics'
    });
  }
};

exports.getAdminOverview = async (req, res) => {
  try {
    const [
      totalUsers,
      totalStudents,
      totalTeachers,
      totalCourses,
      totalEnrollments,
      activeInstitutions
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'teacher' }),
      Course.countDocuments({ isArchived: false }),
      Enrollment.countDocuments(),
      User.distinct('institution')
    ]);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalUsers,
        totalStudents,
        totalTeachers,
        totalCourses,
        totalEnrollments,
        activeInstitutions: activeInstitutions.length
      }
    });
  } catch (error) {
    console.error('Error getting admin overview:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get admin overview'
    });
  }
};

exports.getAdminInstitutionStats = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const institutions = await User.distinct('institution');
    const institutionList = institutions.slice(skip, skip + parseInt(limit));

    const stats = await Promise.all(
      institutionList.map(async (institution) => {
        const [users, teachers, courses, enrollments] = await Promise.all([
          User.countDocuments({ institution }),
          User.countDocuments({ institution, role: 'teacher' }),
          Course.countDocuments({ institution, isArchived: false }),
          Enrollment.countDocuments()
        ]);

        const studentIds = await User.find({ institution, role: 'student' }).select('_id');
        const recentEnrollments = await Enrollment.countDocuments({
          student: { $in: studentIds.map(s => s._id) },
          updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        });

        return {
          institution,
          users,
          teachers,
          courses,
          enrollments,
          activeStudents: recentEnrollments
        };
      })
    );

    const total = institutions.length;

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: stats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error getting institution stats:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get institution stats'
    });
  }
};

exports.getTopCourses = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const enrollmentCounts = await Enrollment.aggregate([
      { $group: { _id: '$course', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) }
    ]);

    const courseIds = enrollmentCounts.map(e => e._id);
    const courses = await Course.find({ _id: { $in: courseIds } })
      .populate('teacher', 'name')
      .lean();

    const courseMap = {};
    courses.forEach(c => {
      courseMap[c._id.toString()] = c;
    });

    const topCourses = enrollmentCounts.map(e => ({
      ...courseMap[e._id.toString()],
      enrollmentsCount: e.count
    })).filter(c => c.title);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: topCourses
    });
  } catch (error) {
    console.error('Error getting top courses:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get top courses'
    });
  }
};

exports.getTeacherDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    // TODO: Optimize with MongoDB aggregation pipelines instead of multiple countDocuments
    // Current: Multiple separate queries - works but scales poorly with large datasets
    // Future: Use $lookup for enrollments, single pipeline for all counts
    const [
      coursesCount,
      totalStudents,
      liveSessions,
      assignmentsCount
    ] = await Promise.all([
      Course.countDocuments({ teacher: userId, isArchived: false }),
      Enrollment.aggregate([
        { $match: { course: { $in: await Course.find({ teacher: userId }).select('_id') } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ]),
      Course.countDocuments({ teacher: userId, isLive: true, isArchived: false }),
      Assignment.aggregate([
        { $match: { course: { $in: await Course.find({ teacher: userId }).select('_id') } } },
        { $group: { _id: null, count: { $sum: 1 } } }
      ])
    ]);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        coursesCount,
        totalStudents: totalStudents[0]?.count || 0,
        liveSessions,
        assignmentsCount: assignmentsCount[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Error getting teacher dashboard stats:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get dashboard stats'
    });
  }
};

exports.exportInstitutionStatsCSV = async (req, res) => {
  try {
    const institutions = await User.distinct('institution');

    const stats = await Promise.all(
      institutions.map(async (institution) => {
        const [users, teachers, courses, enrollments] = await Promise.all([
          User.countDocuments({ institution }),
          User.countDocuments({ institution, role: 'teacher' }),
          Course.countDocuments({ institution, isArchived: false }),
          Enrollment.countDocuments()
        ]);

        return { institution, users, teachers, courses, enrollments };
      })
    );

    const headers = ['Institution', 'Users', 'Teachers', 'Courses', 'Enrollments'];
    const csvRows = [headers.join(',')];

    stats.forEach(row => {
      csvRows.push([
        `"${row.institution}"`,
        row.users,
        row.teachers,
        row.courses,
        row.enrollments
      ].join(','));
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=institution-stats.csv');
    res.send(csvRows.join('\n'));
  } catch (error) {
    console.error('Error exporting CSV:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to export CSV'
    });
  }
};
