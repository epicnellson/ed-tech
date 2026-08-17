require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('../config/db');

const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Assignment = require('../models/Assignment');
const Lesson = require('../models/Lesson');

const INSTITUTION = 'Tech University';
const DEFAULT_PASSWORD = 'password123';

async function seed() {
  try {
    await connectDB();
    console.log('Connected to database');

    // Clear existing demo data
    await User.deleteMany({ email: { $regex: /@demo\./ } });
    await Course.deleteMany({ institution: INSTITUTION });
    await Enrollment.deleteMany({});
    await Assignment.deleteMany({});
    await Lesson.deleteMany({});
    console.log('Cleared existing demo data');

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, salt);

    // Create teachers
    const teachers = await User.create([
      {
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@demo.edu',
        password: hashedPassword,
        role: 'teacher',
        institution: INSTITUTION,
      },
      {
        name: 'Prof. Michael Chen',
        email: 'michael.chen@demo.edu',
        password: hashedPassword,
        role: 'teacher',
        institution: INSTITUTION,
      },
      {
        name: 'Dr. Emily Williams',
        email: 'emily.williams@demo.edu',
        password: hashedPassword,
        role: 'teacher',
        institution: INSTITUTION,
      },
    ]);
    console.log(`Created ${teachers.length} teachers`);

    // Create students
    const students = await User.create([
      { name: 'Alex Thompson', email: 'alex.thompson@demo.edu', password: hashedPassword, role: 'student', institution: INSTITUTION },
      { name: 'Jessica Martinez', email: 'jessica.martinez@demo.edu', password: hashedPassword, role: 'student', institution: INSTITUTION },
      { name: 'David Lee', email: 'david.lee@demo.edu', password: hashedPassword, role: 'student', institution: INSTITUTION },
      { name: 'Sophia Brown', email: 'sophia.brown@demo.edu', password: hashedPassword, role: 'student', institution: INSTITUTION },
      { name: 'James Wilson', email: 'james.wilson@demo.edu', password: hashedPassword, role: 'student', institution: INSTITUTION },
      { name: 'Olivia Davis', email: 'olivia.davis@demo.edu', password: hashedPassword, role: 'student', institution: INSTITUTION },
      { name: 'William Taylor', email: 'william.taylor@demo.edu', password: hashedPassword, role: 'student', institution: INSTITUTION },
      { name: 'Emma Anderson', email: 'emma.anderson@demo.edu', password: hashedPassword, role: 'student', institution: INSTITUTION },
    ]);
    console.log(`Created ${students.length} students`);

    // Course configurations
    const courseConfigs = [
      {
        title: 'Introduction to Computer Science',
        description: 'Fundamental concepts of programming and computational thinking. Learn the basics of algorithms, data structures, and problem-solving techniques.',
        courseCode: 'CS101',
        category: 'Computer Science',
        level: 'Beginner',
        faculty: 'Engineering',
        program: 'Computer Science',
        semester: 1,
        price: 0,
        privacy: 'public',
        teacher: teachers[0],
      },
      {
        title: 'Data Structures and Algorithms',
        description: 'Deep dive into essential data structures and algorithmic techniques used in software development.',
        courseCode: 'CS201',
        category: 'Computer Science',
        level: 'Intermediate',
        faculty: 'Engineering',
        program: 'Computer Science',
        semester: 2,
        price: 49,
        privacy: 'institution',
        teacher: teachers[0],
      },
      {
        title: 'Web Development Fundamentals',
        description: 'Learn to build modern web applications using HTML, CSS, JavaScript, and popular frameworks.',
        courseCode: 'CS301',
        category: 'Computer Science',
        level: 'Intermediate',
        faculty: 'Engineering',
        program: 'Computer Science',
        semester: 3,
        price: 79,
        privacy: 'institution',
        teacher: teachers[1],
      },
      {
        title: 'Database Management Systems',
        description: 'Comprehensive introduction to database design, SQL, and data management concepts.',
        courseCode: 'CS350',
        category: 'Computer Science',
        level: 'Advanced',
        faculty: 'Engineering',
        program: 'Information Technology',
        semester: 4,
        price: 59,
        privacy: 'institution',
        teacher: teachers[1],
      },
      {
        title: 'Machine Learning Basics',
        description: 'Introduction to machine learning algorithms and their practical applications.',
        courseCode: 'CS401',
        category: 'Computer Science',
        level: 'Advanced',
        faculty: 'Engineering',
        program: 'Computer Science',
        semester: 5,
        price: 99,
        privacy: 'institution',
        teacher: teachers[2],
      },
      {
        title: 'Business Management Essentials',
        description: 'Core principles of business management, leadership, and organizational behavior.',
        courseCode: 'BUS101',
        category: 'Business',
        level: 'Beginner',
        faculty: 'Business School',
        program: 'Business Administration',
        semester: 1,
        price: 0,
        privacy: 'public',
        teacher: teachers[2],
      },
    ];

    const courses = [];
    const modulesData = [
      { title: 'Getting Started', lessons: ['What is Computer Science?', 'Setting Up Your Environment', 'Your First Program'] },
      { title: 'Variables and Data Types', lessons: ['Understanding Variables', 'Numbers and Strings', 'Boolean Logic'] },
      { title: 'Control Flow', lessons: ['If Statements', 'Loops', 'Switch Cases'] },
      { title: 'Functions', lessons: ['Defining Functions', 'Parameters and Return Values', 'Scope'] },
    ];

    const lessonContents = [
      { type: 'text', content: 'Computer science is the study of computation, algorithms, and information processing. It encompasses theory, design, development, and application of software and systems.' },
      { type: 'text', content: 'In this lesson, we will set up your development environment. You will need a code editor and a programming language runtime.' },
      { type: 'text', content: 'Let us write your first program. A "Hello World" program is traditionally the first program written by beginners.' },
      { type: 'text', content: 'Variables are containers for storing data values. They have names and can hold different types of data.' },
      { type: 'text', content: 'Numbers and strings are fundamental data types. Numbers perform arithmetic, while strings handle text.' },
      { type: 'text', content: 'Boolean logic deals with true and false values. It is fundamental to decision making in programs.' },
      { type: 'text', content: 'If statements allow your program to make decisions based on conditions.' },
      { type: 'text', content: 'Loops let you repeat code multiple times. There are for loops and while loops.' },
      { type: 'text', content: 'Switch cases provide a way to handle multiple conditions cleanly.' },
      { type: 'text', content: 'Functions are reusable blocks of code. They take inputs and can return outputs.' },
      { type: 'text', content: 'Parameters allow you to pass data into functions. Return values send data back.' },
      { type: 'text', content: 'Scope determines where variables can be accessed in your code.' },
    ];

    for (let i = 0; i < courseConfigs.length; i++) {
      const config = courseConfigs[i];
      const course = await Course.create({
        ...config,
        teacher: config.teacher._id,
        institution: INSTITUTION,
      });
      courses.push(course);
      console.log(`Created course: ${course.title}`);

      // Create modules and lessons (modules are embedded in Course)
      const numModules = 2 + Math.floor(Math.random() * 3); // 2-4 modules
      const courseModules = [];
      for (let m = 0; m < numModules; m++) {
        const moduleTitle = `Module ${m + 1}: ${['Introduction', 'Core Concepts', 'Advanced Topics', 'Practical Applications', 'Review'][m] || `Section ${m + 1}`}`;
        courseModules.push({ title: moduleTitle, order: m });
      }
      
      await Course.findByIdAndUpdate(course._id, { modules: courseModules });
      const updatedCourse = await Course.findById(course._id);

      for (let m = 0; m < numModules; m++) {
        const numLessons = 2 + Math.floor(Math.random() * 4); // 2-5 lessons
        for (let l = 0; l < numLessons; l++) {
          const lessonIndex = (m * 3 + l) % lessonContents.length;
          await Lesson.create({
            title: `Lesson ${l + 1}: ${['Introduction', 'Deep Dive', 'Examples', 'Practice', 'Summary'][l] || `Part ${l + 1}`}`,
            course: course._id,
            moduleId: updatedCourse.modules[m]._id,
            type: 'text',
            content: lessonContents[lessonIndex].content,
            order: l,
          });
        }
      }
      console.log(`  Created ${numModules} modules with lessons`);

      // Create assignments
      const numAssignments = 2 + Math.floor(Math.random() * 3); // 2-4 assignments
      const assignmentTitles = [
        'Weekly Quiz',
        'Programming Assignment',
        'Lab Exercise',
        'Project Submission',
        'Case Study',
        'Midterm Exam',
        'Final Project',
      ];

      for (let a = 0; a < numAssignments; a++) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7 + a * 7); // Staggered due dates

        await Assignment.create({
          course: course._id,
          title: `${assignmentTitles[a % assignmentTitles.length]} ${Math.floor(a / assignmentTitles.length) + 1}`,
          description: `Complete the ${assignmentTitles[a % assignmentTitles.length].toLowerCase()} for this module. Follow the instructions carefully and submit before the deadline.`,
          dueDate,
          maxScore: 100,
          createdBy: config.teacher._id,
        });
      }
      console.log(`  Created ${numAssignments} assignments`);
    }

    // Create enrollments
    let enrollmentCount = 0;
    for (let i = 0; i < courses.length; i++) {
      const course = courses[i];
      // Enroll 3-6 random students per course
      const numStudents = 3 + Math.floor(Math.random() * 4);
      const shuffledStudents = [...students].sort(() => Math.random() - 0.5);
      
      for (let j = 0; j < numStudents; j++) {
        const progress = Math.floor(Math.random() * 100);
        await Enrollment.create({
          student: shuffledStudents[j]._id,
          course: course._id,
          progress,
          completed: progress === 100,
          enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random past date
        });
        enrollmentCount++;
      }
    }
    console.log(`Created ${enrollmentCount} enrollments`);

    console.log('\n=== Seed Data Created Successfully ===\n');
    console.log('TEACHER ACCOUNTS:');
    teachers.forEach(t => console.log(`  Email: ${t.email}, Password: ${DEFAULT_PASSWORD}`));
    console.log('\nSTUDENT ACCOUNTS:');
    students.forEach(s => console.log(`  Email: ${s.email}, Password: ${DEFAULT_PASSWORD}`));
    console.log('\nCOURSES:');
    courses.forEach(c => console.log(`  - ${c.title} (${c.courseCode}) by ${c.teacher.name}`));
    console.log('\n=========================================');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
