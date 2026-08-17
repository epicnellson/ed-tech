const Notification = require('../models/Notification');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');

const createNotification = async ({ userId, type, title, message, link = null, relatedId = null, courseId = null }) => {
  try {
    const notification = await Notification.create({
      user: userId,
      type,
      title,
      message,
      link,
      relatedId,
      course: courseId
    });
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

const createBulkNotifications = async (userIds, { type, title, message, link = null, relatedId = null, courseId = null }) => {
  try {
    const notifications = userIds.map(userId => ({
      user: userId,
      type,
      title,
      message,
      link,
      relatedId,
      course: courseId
    }));
    await Notification.insertMany(notifications);
    return true;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return false;
  }
};

const notifyAssignmentCreated = async (assignment, course) => {
  try {
    const enrollments = await Enrollment.find({ course: course._id }).select('student');
    const studentIds = enrollments.map(e => e.student);
    
    if (studentIds.length > 0) {
      await createBulkNotifications(studentIds, {
        type: 'assignment_created',
        title: 'New Assignment',
        message: `New assignment "${assignment.title}" has been added to ${course.title}`,
        link: `/courses/${course._id}/assignments/${assignment._id}`,
        relatedId: assignment._id,
        courseId: course._id
      });
    }
    return true;
  } catch (error) {
    console.error('Error notifying assignment created:', error);
    return false;
  }
};

const notifyAssignmentGraded = async (submission, assignment, course, student) => {
  try {
    await createNotification({
      userId: student._id,
      type: 'assignment_graded',
      title: 'Assignment Graded',
      message: `Your submission for "${assignment.title}" has been graded. Score: ${submission.score}/${assignment.maxScore}`,
      link: `/courses/${course._id}/assignments/${assignment._id}`,
      relatedId: assignment._id,
      courseId: course._id
    });
    return true;
  } catch (error) {
    console.error('Error notifying assignment graded:', error);
    return false;
  }
};

const notifyAnnouncement = async (announcement, course, institution) => {
  try {
    let userIds = [];

    if (announcement.audienceType === 'course' && course) {
      const enrollments = await Enrollment.find({ course: course._id }).select('student');
      userIds = enrollments.map(e => e.student);
      if (course.teacher) {
        userIds.push(course.teacher.toString());
      }
    } else if (announcement.audienceType === 'institution' && institution) {
      const users = await User.find({ institution }).select('_id');
      userIds = users.map(u => u._id);
    } else if (announcement.audienceType === 'global') {
      const users = await User.find().select('_id');
      userIds = users.map(u => u._id);
    }

    userIds = [...new Set(userIds.map(id => id.toString()))];

    if (userIds.length > 0) {
      const title = announcement.audienceType === 'course' && course 
        ? `Announcement: ${course.title}`
        : 'New Announcement';
      
      await createBulkNotifications(userIds, {
        type: 'announcement',
        title,
        message: announcement.title,
        link: course ? `/courses/${course._id}/announcements/${announcement._id}` : '/dashboard',
        relatedId: announcement._id,
        courseId: course ? course._id : null
      });
    }
    return true;
  } catch (error) {
    console.error('Error notifying announcement:', error);
    return false;
  }
};

const getUnreadCount = async (userId) => {
  try {
    return await Notification.countDocuments({ user: userId, read: false });
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  notifyAssignmentCreated,
  notifyAssignmentGraded,
  notifyAnnouncement,
  getUnreadCount
};
