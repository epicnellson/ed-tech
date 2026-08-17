const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Lesson = require('../models/Lesson');
const LessonProgress = require('../models/LessonProgress');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { canAccessCourse, canEditCourse } = require('../services/courseService');

const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

const errorResponse = (res, status, message) => {
  return res.status(status).json({
    success: false,
    message,
    data: null
  });
};

const successResponse = (res, status, data, message = null) => {
  return res.status(status).json({
    success: true,
    message,
    data
  });
};

exports.createQuiz = async (req, res) => {
  try {
    const { title, description, courseId, questions, passingScore, timeLimit, isPublished } = req.body;

    if (!title || !courseId) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Title and course are required');
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    if (!canEditCourse(req.user, course)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to create quiz for this course');
    }

    const totalPoints = (questions || []).reduce((sum, q) => sum + (q.points || 0), 0);

    const quiz = new Quiz({
      title,
      description: description || '',
      course: courseId,
      questions: questions || [],
      passingScore: passingScore || 50,
      timeLimit,
      isPublished: isPublished || false,
      totalPoints
    });

    await quiz.save();
    return successResponse(res, HTTP_STATUS.CREATED, quiz);
  } catch (err) {
    console.error('CreateQuiz error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};

exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('course', 'title teacher');

    if (!quiz) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Quiz not found');
    }

    const user = await User.findById(req.user?.id);
    const hasAccess = await canAccessCourse(user, quiz.course);

    if (!hasAccess) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to view this quiz');
    }

    if (quiz.questions && quiz.questions.length > 0) {
      quiz.questions = quiz.questions.map(q => ({
        _id: q._id,
        question: q.question,
        options: q.options,
        points: q.points
      }));
    }

    return successResponse(res, HTTP_STATUS.OK, quiz);
  } catch (err) {
    console.error('GetQuizById error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};

exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body;
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Quiz not found');
    }

    const course = await Course.findById(quiz.course);
    const user = await User.findById(req.user.id);

    const hasAccess = await canAccessCourse(user, course);
    if (!hasAccess) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to take this quiz');
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: quiz.course
    });

    if (!enrollment) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'You must be enrolled to take this quiz');
    }

    const existingAttempt = await QuizAttempt.findOne({
      quiz: quizId,
      student: req.user.id
    }).sort({ createdAt: -1 });

    if (existingAttempt) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'You have already attempted this quiz');
    }

    let score = 0;
    const gradedAnswers = (answers || []).map((answer, index) => {
      const question = quiz.questions[index];
      if (!question) return null;

      const isCorrect = answer.selectedAnswer === question.correctAnswer;
      const points = isCorrect ? question.points : 0;
      score += points;

      return {
        questionIndex: index,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        points
      };
    }).filter(Boolean);

    const totalPoints = quiz.totalPoints || 1;
    const percentage = Math.round((score / totalPoints) * 100);
    const passed = percentage >= (quiz.passingScore || 50);

    const attempt = new QuizAttempt({
      quiz: quizId,
      student: req.user.id,
      answers: gradedAnswers,
      score,
      totalPoints,
      percentage,
      passed
    });

    await attempt.save();

    return successResponse(res, HTTP_STATUS.OK, {
      id: attempt._id,
      score,
      totalPoints,
      percentage,
      passed
    });
  } catch (err) {
    console.error('SubmitQuiz error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};

exports.getQuizAttempts = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Quiz not found');
    }

    const course = await Course.findById(quiz.course);
    if (!canEditCourse(req.user, course)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized');
    }

    const attempts = await QuizAttempt.find({ quiz: quizId })
      .populate('student', 'name email')
      .sort({ createdAt: -1 });

    return successResponse(res, HTTP_STATUS.OK, attempts);
  } catch (err) {
    console.error('GetQuizAttempts error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};

exports.getMyQuizAttempts = async (req, res) => {
  try {
    const quizId = req.params.id;
    const quiz = await Quiz.findById(quizId);

    if (!quiz) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Quiz not found');
    }

    const attempts = await QuizAttempt.find({ quiz: quizId, student: req.user.id })
      .sort({ createdAt: -1 });

    return successResponse(res, HTTP_STATUS.OK, attempts);
  } catch (err) {
    console.error('GetMyQuizAttempts error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};

exports.createLesson = async (req, res) => {
  try {
    const { title, description, courseId, content, videoUrl, order, isPublished } = req.body;

    if (!title || !courseId) {
      return errorResponse(res, HTTP_STATUS.BAD_REQUEST, 'Title and course are required');
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Course not found');
    }

    if (!canEditCourse(req.user, course)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to create lesson for this course');
    }

    const existingLessons = await Lesson.countDocuments({ course: courseId });
    const lessonOrder = order !== undefined ? order : existingLessons;

    const lesson = new Lesson({
      title,
      description: description || '',
      course: courseId,
      content: content || '',
      videoUrl: videoUrl || '',
      order: lessonOrder,
      isPublished: isPublished || false
    });

    await lesson.save();
    return successResponse(res, HTTP_STATUS.CREATED, lesson);
  } catch (err) {
    console.error('CreateLesson error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};

exports.getLessonById = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('course', 'title teacher');

    if (!lesson) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Lesson not found');
    }

    const user = await User.findById(req.user?.id);
    const hasAccess = await canAccessCourse(user, lesson.course);

    if (!hasAccess) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to view this lesson');
    }

    let progress = null;
    if (user) {
      progress = await LessonProgress.findOne({
        lesson: lesson._id,
        student: user._id
      });
    }

    return successResponse(res, HTTP_STATUS.OK, {
      ...lesson.toObject(),
      progress: progress ? {
        completed: progress.completed,
        watchTime: progress.watchTime
      } : null
    });
  } catch (err) {
    console.error('GetLessonById error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};

exports.updateLessonProgress = async (req, res) => {
  try {
    const { completed, watchTime } = req.body;
    const lessonId = req.params.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Lesson not found');
    }

    const course = await Course.findById(lesson.course);
    const user = await User.findById(req.user.id);

    const hasAccess = await canAccessCourse(user, course);
    if (!hasAccess) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized');
    }

    const enrollment = await Enrollment.findOne({
      student: req.user.id,
      course: lesson.course
    });

    if (!enrollment) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'You must be enrolled to track progress');
    }

    let progress = await LessonProgress.findOne({
      lesson: lessonId,
      student: req.user.id
    });

    if (!progress) {
      progress = new LessonProgress({
        lesson: lessonId,
        student: req.user.id
      });
    }

    if (completed !== undefined) {
      progress.completed = completed;
      if (completed) {
        progress.completedAt = new Date();
      }
    }

    if (watchTime !== undefined) {
      progress.watchTime = watchTime;
    }

    await progress.save();

    const courseLessons = await Lesson.find({ course: lesson.course });
    const completedLessons = await LessonProgress.find({
      lesson: { $in: courseLessons.map(l => l._id) },
      student: req.user.id,
      completed: true
    });

    const progressPercentage = courseLessons.length > 0 
      ? Math.round((completedLessons.length / courseLessons.length) * 100)
      : 0;

    enrollment.progress = progressPercentage;
    if (progressPercentage === 100) {
      enrollment.completed = true;
    }
    await enrollment.save();

    return successResponse(res, HTTP_STATUS.OK, {
      completed: progress.completed,
      watchTime: progress.watchTime,
      courseProgress: progressPercentage
    });
  } catch (err) {
    console.error('UpdateLessonProgress error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const { title, description, content, videoUrl, order, isPublished } = req.body;
    const lessonId = req.params.id;

    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Lesson not found');
    }

    const course = await Course.findById(lesson.course);
    if (!canEditCourse(req.user, course)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to update this lesson');
    }

    if (title !== undefined) lesson.title = title;
    if (description !== undefined) lesson.description = description;
    if (content !== undefined) lesson.content = content;
    if (videoUrl !== undefined) lesson.videoUrl = videoUrl;
    if (order !== undefined) lesson.order = order;
    if (isPublished !== undefined) lesson.isPublished = isPublished;

    await lesson.save();

    return successResponse(res, HTTP_STATUS.OK, lesson);
  } catch (err) {
    console.error('UpdateLesson error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quizId = req.params.id;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Quiz not found');
    }

    const course = await Course.findById(quiz.course);
    if (!canEditCourse(req.user, course)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to delete this quiz');
    }

    await QuizAttempt.deleteMany({ quiz: quizId });
    await Quiz.findByIdAndDelete(quizId);

    return successResponse(res, HTTP_STATUS.OK, { message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error('DeleteQuiz error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};

exports.resetQuizAttempts = async (req, res) => {
  try {
    const quizId = req.params.id;
    const { userId } = req.body;

    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return errorResponse(res, HTTP_STATUS.NOT_FOUND, 'Quiz not found');
    }

    const course = await Course.findById(quiz.course);
    if (!canEditCourse(req.user, course)) {
      return errorResponse(res, HTTP_STATUS.FORBIDDEN, 'Not authorized to reset attempts');
    }

    await QuizAttempt.deleteMany({ quiz: quizId, student: userId });

    return successResponse(res, HTTP_STATUS.OK, { message: 'Quiz attempts reset successfully' });
  } catch (err) {
    console.error('ResetQuizAttempts error:', err.message);
    return errorResponse(res, HTTP_STATUS.SERVER_ERROR, 'Server error');
  }
};
