const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const canAccessCourse = async (user, course) => {
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

const generateCourseAssistantReply = async ({ user, course, message }) => {
  const lowerMessage = message.toLowerCase();
  
  const courseInfo = {
    title: course.title,
    description: course.description,
    category: course.category,
    level: course.level,
    courseCode: course.courseCode,
    instructor: course.teacher?.name || 'the instructor'
  };

  let reply = '';
  let category = 'general';

  if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
    category = 'help';
    reply = `I'm your course assistant for "${courseInfo.title}". I can help you with:\n\n` +
      `• Understanding course concepts and topics\n` +
      `• Study strategies and tips for this subject\n` +
      `• Clarifying course objectives and requirements\n` +
      `• Questions about the course structure\n\n` +
      `Feel free to ask me anything about this course!`;
  }
  else if (lowerMessage.includes('prerequisite') || lowerMessage.includes('require') || lowerMessage.includes('before')) {
    category = 'prerequisites';
    reply = `For "${courseInfo.title}", it's helpful to have a basic understanding of the subject area. ` +
      `Since this is a ${courseInfo.level} level course, you should be familiar with fundamental concepts. ` +
      `If you're unsure about prerequisites, I recommend checking with ${courseInfo.instructor} or your academic advisor.`;
  }
  else if (lowerMessage.includes('exam') || lowerMessage.includes('test') || lowerMessage.includes('assess')) {
    category = 'assessment';
    reply = `For assessment details in "${courseInfo.title}", please refer to the course syllabus ` +
      `or check with ${courseInfo.instructor}. Generally, courses at this level include a mix of:\n\n` +
      `• Practical assignments\n` +
      `• Quizzes or tests\n` +
      `• Final examination\n\n` +
      `Start by reviewing your course materials regularly!`;
  }
  else if (lowerMessage.includes('study') || lowerMessage.includes('tip') || lowerMessage.includes('how to')) {
    category = 'study_tips';
    reply = `Here are some study tips for "${courseInfo.title}" (${courseInfo.category}):\n\n` +
      `1. Review course materials regularly\n` +
      `2. Take notes during lessons\n` +
      `3. Practice with exercises and assignments\n` +
      `4. Form study groups with classmates\n` +
      `5. Don't hesitate to ask questions\n\n` +
      `Would you like more specific help with any topic?`;
  }
  else if (lowerMessage.includes('topic') || lowerMessage.includes('cover') || lowerMessage.includes('learn')) {
    category = 'topics';
    reply = `"${courseInfo.title}" covers ${courseInfo.category} concepts. ` +
      `Here's what you'll typically learn:\n\n` +
      `• Core principles and fundamentals\n` +
      `• Practical applications\n` +
      `• Industry-relevant skills\n\n` +
      `For specific topics, please refer to the course syllabus or ask ${courseInfo.instructor}.`;
  }
  else if (lowerMessage.includes('certificate') || lowerMessage.includes('complete') || lowerMessage.includes('finish')) {
    category = 'completion';
    reply = `To complete "${courseInfo.title}" and receive your certificate:\n\n` +
      `• Complete all required assignments\n` +
      `• Pass the assessments (typically 50%+)\n` +
      `• Engage with course materials\n\n` +
      `Keep track of your progress in the My Enrollments section!`;
  }
  else if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    category = 'greeting';
    reply = `Hello! I'm the Course Assistant for "${courseInfo.title}".\n\n` +
      `I'm here to help you with questions about this course. ` +
      `Just ask me about topics, study tips, or anything course-related!`;
  }
  else if (lowerMessage.includes('thank')) {
    category = 'thanks';
    reply = `You're welcome! Feel free to ask if you have more questions about "${courseInfo.title}". ` +
      `Good luck with your studies! 🎓`;
  }
  else {
    category = 'general';
    reply = `Thank you for your question about "${courseInfo.title}"!\n\n` +
      `Based on this ${courseInfo.level} ${courseInfo.category} course, here's my suggestion:\n\n` +
      `${courseInfo.description.substring(0, 200)}...\n\n` +
      `For more specific guidance, I recommend:\n` +
      `• Checking the course syllabus\n` +
      `• Reviewing lesson materials\n` +
      `• Asking ${courseInfo.instructor}\n\n` +
      `Would you like help with a specific topic?`;
  }

  return {
    reply,
    category,
    courseInfo: {
      title: courseInfo.title,
      category: courseInfo.category,
      level: courseInfo.level
    }
  };
};

module.exports = {
  generateCourseAssistantReply,
  canAccessCourse
};
