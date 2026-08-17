const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const canAccessCourse = async (user, course) => {
  if (!course) return false;
  
  if (!user) {
    return course.privacy === 'public';
  }

  if (course.privacy === 'public') {
    return true;
  }

  if (course.institution !== user.institution) {
    return false;
  }

  if (course.privacy === 'institution') {
    return true;
  }

  if (course.privacy === 'private') {
    if (!course.teacher) return false;
    const isTeacher = course.teacher.toString() === user._id.toString();
    const isAdmin = user.role === 'admin';
    if (isTeacher || isAdmin) {
      return true;
    }

    const enrollment = await Enrollment.findOne({
      student: user._id,
      course: course._id
    });
    return !!enrollment;
  }

  return false;
};

const canEnrollInCourse = async (user, course) => {
  if (!user || !user.institution) {
    return { allowed: false, reason: 'User must be logged in and have an institution' };
  }

  if (course.institution !== user.institution) {
    return { allowed: false, reason: 'You can only enroll in courses from your institution' };
  }

  if (course.privacy === 'private') {
    return { allowed: false, reason: 'This is a private course. You need an invitation to enroll.' };
  }

  return { allowed: true, reason: null };
};

const canEditCourse = (user, course) => {
  if (!user) return false;
  if (!course || !course.teacher) return false;
  const isTeacher = course.teacher.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';
  return isTeacher || isAdmin;
};

const canViewCourseEnrollments = (user, course) => {
  if (!user) return false;
  if (!course || !course.teacher) return false;
  const isTeacher = course.teacher.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';
  return isTeacher || isAdmin;
};

const getCourseAccessLevel = async (user, course) => {
  if (!user) {
    return course.privacy === 'public' ? 'public' : 'none';
  }

  if (course.institution !== user.institution) {
    return course.privacy === 'public' ? 'public' : 'none';
  }

  const isTeacher = course.teacher.toString() === user._id.toString();
  const isAdmin = user.role === 'admin';

  if (isTeacher || isAdmin) {
    return 'owner';
  }

  if (course.privacy === 'public') {
    return 'public';
  }

  if (course.privacy === 'institution') {
    const enrollment = await Enrollment.findOne({
      student: user._id,
      course: course._id
    });
    return enrollment ? 'enrolled' : 'institution';
  }

  if (course.privacy === 'private') {
    const enrollment = await Enrollment.findOne({
      student: user._id,
      course: course._id
    });
    return enrollment ? 'enrolled' : 'none';
  }

  return 'none';
};

module.exports = {
  canAccessCourse,
  canEnrollInCourse,
  canEditCourse,
  canViewCourseEnrollments,
  getCourseAccessLevel
};
