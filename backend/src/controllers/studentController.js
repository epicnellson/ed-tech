const Enrollment = require('../models/Enrollment');
const LessonProgress = require('../models/LessonProgress');
const AssignmentSubmission = require('../models/AssignmentSubmission');
const Assignment = require('../models/Assignment');
const Lesson = require('../models/Lesson');
const Course = require('../models/Course');
const constants = require('../config/constants');

exports.getMyProgress = async (req, res) => {
  try {
    const userId = req.user.id;

    const enrollments = await Enrollment.find({ student: userId });
    const courseIds = enrollments.map(e => e.course);

    const coursesCompleted = enrollments.filter(e => e.completed).length;
    const totalEnrolled = enrollments.length;

    const lessons = await Lesson.find({ course: { $in: courseIds } }).select('_id course duration');
    const lessonIds = lessons.map(l => l._id);

    const lessonProgress = await LessonProgress.find({
      student: userId,
      lesson: { $in: lessonIds }
    });

    const totalWatchTime = lessonProgress.reduce((sum, p) => sum + (p.watchTime || 0), 0);
    const completedLessons = lessonProgress.filter(p => p.completed).length;

    const assignmentIds = await Assignment.find({ course: { $in: courseIds } }).select('_id');
    const assignmentIdList = assignmentIds.map(a => a._id);

    const submissions = await AssignmentSubmission.find({
      student: userId,
      assignment: { $in: assignmentIdList }
    });

    const gradedSubmissions = submissions.filter(s => s.score !== null);
    const avgScore = gradedSubmissions.length > 0
      ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length)
      : null;

    const recentlyCompleted = await Enrollment.find({ student: userId, completed: true })
      .populate('course', 'title courseCode thumbnail')
      .sort({ updatedAt: -1 })
      .limit(5);

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        totalEnrolledCourses: totalEnrolled,
        coursesCompleted,
        coursesInProgress: totalEnrolled - coursesCompleted,
        totalLessons: lessons.length,
        completedLessons,
        totalWatchTime: Math.round(totalWatchTime / 60),
        assignmentsSubmitted: submissions.length,
        assignmentsGraded: gradedSubmissions.length,
        averageScore: avgScore,
        recentlyCompleted
      }
    });
  } catch (error) {
    console.error('Error getting student progress:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get progress'
    });
  }
};

exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 10 } = req.query;

    const enrollments = await Enrollment.find({ student: userId }).select('course updatedAt');
    const courseIds = enrollments.map(e => e.course);

    const lessons = await Lesson.find({ course: { $in: courseIds } }).select('_id course title');
    const lessonIds = lessons.map(l => l._id);

    const lessonProgress = await LessonProgress.find({ student: userId, lesson: { $in: lessonIds } })
      .populate('lesson', 'title')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    const submissions = await AssignmentSubmission.find({ student: userId })
      .populate('assignment', 'title')
      .sort({ submittedAt: -1 })
      .limit(parseInt(limit));

    const recentLessons = lessonProgress.map(p => ({
      type: 'lesson',
      item: p.lesson,
      completed: p.completed,
      timestamp: p.updatedAt
    }));

    const recentSubmissions = submissions.map(s => ({
      type: 'submission',
      item: s.assignment,
      score: s.score,
      submittedAt: s.submittedAt,
      timestamp: s.submittedAt
    }));

    const combined = [...recentLessons, ...recentSubmissions]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: combined
    });
  } catch (error) {
    console.error('Error getting recent activity:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to get recent activity'
    });
  }
};

exports.updateLessonProgress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { lessonId } = req.params;
    const { completed, watchTime } = req.body;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Lesson not found'
      });
    }

    const enrollment = await Enrollment.findOne({ student: userId, course: lesson.course });
    if (!enrollment) {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'You are not enrolled in this course'
      });
    }

    let progress = await LessonProgress.findOne({ student: userId, lesson: lessonId });
    
    if (!progress) {
      progress = new LessonProgress({
        student: userId,
        lesson: lessonId,
        completed: completed || false,
        watchTime: watchTime || 0,
        completedAt: completed ? new Date() : null
      });
    } else {
      if (completed !== undefined) {
        progress.completed = completed;
        if (completed && !progress.completedAt) {
          progress.completedAt = new Date();
        }
      }
      if (watchTime !== undefined) {
        progress.watchTime = watchTime;
      }
    }

    await progress.save();

    // Update overall enrollment progress
    const totalLessons = await Lesson.countDocuments({ course: lesson.course, isPublished: true });
    const completedLessons = await LessonProgress.countDocuments({
      student: userId,
      lesson: { $in: await Lesson.find({ course: lesson.course, isPublished: true }).select('_id') },
      completed: true
    });

    const overallProgress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    enrollment.progress = overallProgress;
    enrollment.completed = overallProgress === 100;
    await enrollment.save();

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: {
        progress,
        overallProgress
      }
    });
  } catch (error) {
    console.error('Error updating lesson progress:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to update progress'
    });
  }
};
