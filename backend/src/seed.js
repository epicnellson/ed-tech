require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Course = require('./models/Course');
const Enrollment = require('./models/Enrollment');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    console.log('Cleared existing data');

    // Create teachers
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Password123', salt);

    const teacher1 = await User.create({
      name: 'John Smith',
      email: 'teacher1@example.com',
      password: hashedPassword,
      role: 'teacher',
      institution: 'Limkokwing University of Creative Technology'
    });

    const teacher2 = await User.create({
      name: 'Sarah Johnson',
      email: 'teacher2@example.com',
      password: hashedPassword,
      role: 'teacher',
      institution: 'University of Malaya'
    });

    const teacher3 = await User.create({
      name: 'Dr. Michael Chen',
      email: 'teacher3@example.com',
      password: hashedPassword,
      role: 'teacher',
      institution: 'Universiti Teknologi Malaysia'
    });

    // Create students
    const student1 = await User.create({
      name: 'Mike Davis',
      email: 'student1@example.com',
      password: hashedPassword,
      role: 'student',
      institution: 'Limkokwing University of Creative Technology'
    });

    const student2 = await User.create({
      name: 'Emily Brown',
      email: 'student2@example.com',
      password: hashedPassword,
      role: 'student',
      institution: 'University of Malaya'
    });

    const student3 = await User.create({
      name: 'Alex Wilson',
      email: 'student3@example.com',
      password: hashedPassword,
      role: 'student',
      institution: 'International Islamic University Malaysia'
    });

    console.log('Created users');

    // Create courses (12 courses total)
    const course1 = await Course.create({
      title: 'Complete React Developer Course',
      description: 'Learn React from scratch including hooks, context, and building real-world projects.',
      price: 49.99,
      thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      videoUrls: [
        'https://example.com/videos/react-intro.mp4',
        'https://example.com/videos/react-hooks.mp4',
        'https://example.com/videos/react-context.mp4'
      ],
      teacher: teacher1._id,
      institution: 'Limkokwing University of Creative Technology',
      courseCode: 'REACT101',
      faculty: 'FICT',
      facultyCode: 'FICT',
      program: 'Bachelor of Software Engineering',
      programCode: 'BIT',
      semester: 3,
      privacy: 'institution',
      category: 'Computer Science',
      level: 'Undergraduate Year 3'
    });

    const course2 = await Course.create({
      title: 'Node.js Backend Masterclass',
      description: 'Build scalable backend applications with Node.js, Express, and MongoDB.',
      price: 59.99,
      thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800',
      videoUrls: [
        'https://example.com/videos/node-intro.mp4',
        'https://example.com/videos/express-basics.mp4'
      ],
      teacher: teacher1._id,
      institution: 'Limkokwing University of Creative Technology',
      courseCode: 'NODE201',
      faculty: 'FICT',
      facultyCode: 'FICT',
      program: 'Bachelor of Software Engineering',
      programCode: 'BIT',
      semester: 4,
      privacy: 'institution',
      category: 'Computer Science',
      level: 'Undergraduate Year 4'
    });

    const course3 = await Course.create({
      title: 'Introduction to Python Programming',
      description: 'Start your programming journey with Python. Cover basics, data types, and functions.',
      price: 0,
      thumbnail: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800',
      videoUrls: [
        'https://example.com/videos/python-intro.mp4',
        'https://example.com/videos/python-variables.mp4'
      ],
      teacher: teacher2._id,
      institution: 'University of Malaya',
      courseCode: 'PYTHON100',
      faculty: 'FICT',
      facultyCode: 'FICT',
      program: 'Bachelor of Computer Science',
      programCode: 'BIT',
      semester: 1,
      privacy: 'public',
      category: 'Computer Science',
      level: 'Undergraduate Year 1'
    });

    const course4 = await Course.create({
      title: 'Web Development Fundamentals',
      description: 'Learn HTML, CSS, and JavaScript fundamentals. Build responsive websites.',
      price: 29.99,
      thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
      videoUrls: [
        'https://example.com/videos/html-basics.mp4',
        'https://example.com/videos/css-styling.mp4',
        'https://example.com/videos/js-intro.mp4',
        'https://example.com/videos/dom-manipulation.mp4'
      ],
      teacher: teacher2._id,
      institution: 'University of Malaya',
      courseCode: 'WEB100',
      faculty: 'FICT',
      facultyCode: 'FICT',
      program: 'Bachelor of Information Technology',
      programCode: 'BBIT',
      semester: 2,
      privacy: 'institution',
      category: 'Computer Science',
      level: 'Undergraduate Year 2'
    });

    const course5 = await Course.create({
      title: 'Database Design & SQL',
      description: 'Master database design principles and SQL queries. Learn normalization and optimization.',
      price: 39.99,
      thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
      videoUrls: [],
      teacher: teacher1._id,
      institution: 'Limkokwing University of Creative Technology',
      courseCode: 'DBMS200',
      faculty: 'FICT',
      facultyCode: 'FICT',
      program: 'Bachelor of Software Engineering',
      programCode: 'BIT',
      semester: 3,
      privacy: 'institution',
      category: 'Computer Science',
      level: 'Undergraduate Year 3'
    });

    const course6 = await Course.create({
      title: 'JavaScript Advanced Concepts',
      description: 'Deep dive into closures, prototypes, async/await, and design patterns.',
      price: 44.99,
      thumbnail: 'https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=800',
      videoUrls: [
        'https://example.com/videos/js-closures.mp4',
        'https://example.com/videos/js-promises.mp4'
      ],
      teacher: teacher1._id,
      institution: 'Limkokwing University of Creative Technology',
      courseCode: 'JS300',
      faculty: 'FICT',
      facultyCode: 'FICT',
      program: 'Bachelor of Software Engineering',
      programCode: 'BIT',
      semester: 4,
      privacy: 'institution',
      category: 'Computer Science',
      level: 'Undergraduate Year 4'
    });

    const course7 = await Course.create({
      title: 'UI/UX Design Principles',
      description: 'Learn design thinking, wireframing, and prototyping with Figma.',
      price: 34.99,
      thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800',
      videoUrls: [
        'https://example.com/videos/design-basics.mp4',
        'https://example.com/videos/figma-intro.mp4'
      ],
      teacher: teacher2._id,
      institution: 'University of Malaya',
      courseCode: 'DESIGN101',
      faculty: 'FABE_FDI',
      facultyCode: 'FABE_FDI',
      program: 'Bachelor of Digital Media',
      programCode: 'BINTDES',
      semester: 2,
      privacy: 'public',
      category: 'Fashion & Design',
      level: 'Undergraduate Year 2'
    });

    const course8 = await Course.create({
      title: 'Mobile App Development with Flutter',
      description: 'Build cross-platform mobile apps using Flutter and Dart.',
      price: 54.99,
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800',
      videoUrls: [
        'https://example.com/videos/flutter-intro.mp4',
        'https://example.com/videos/flutter-widgets.mp4'
      ],
      teacher: teacher3._id,
      institution: 'Universiti Teknologi Malaysia',
      courseCode: 'FLUTTER201',
      faculty: 'FICT',
      facultyCode: 'FICT',
      program: 'Bachelor of Computer Science',
      programCode: 'BIT',
      semester: 5,
      privacy: 'institution',
      category: 'Computer Science',
      level: 'Undergraduate Year 3'
    });

    const course9 = await Course.create({
      title: 'Cloud Computing with AWS',
      description: 'Deploy and manage applications on Amazon Web Services.',
      price: 64.99,
      thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
      videoUrls: [
        'https://example.com/videos/aws-ec2.mp4',
        'https://example.com/videos/aws-s3.mp4'
      ],
      teacher: teacher3._id,
      institution: 'Universiti Teknologi Malaysia',
      courseCode: 'AWS300',
      faculty: 'FICT',
      facultyCode: 'FICT',
      program: 'Bachelor of Software Engineering',
      programCode: 'BIT',
      semester: 6,
      privacy: 'public',
      category: 'Computer Science',
      level: 'Undergraduate Year 4'
    });

    const course10 = await Course.create({
      title: 'Data Science with R',
      description: 'Analyze data and build statistical models using R programming.',
      price: 49.99,
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800',
      videoUrls: [
        'https://example.com/videos/r-basics.mp4',
        'https://example.com/videos/r-stats.mp4'
      ],
      teacher: teacher3._id,
      institution: 'Universiti Teknologi Malaysia',
      courseCode: 'DATA200',
      faculty: 'FBMG',
      facultyCode: 'FBMG',
      program: 'Bachelor of Business Analytics',
      programCode: 'BBA',
      semester: 4,
      privacy: 'institution',
      category: 'Business Administration',
      level: 'Undergraduate Year 4'
    });

    const course11 = await Course.create({
      title: 'Cybersecurity Fundamentals',
      description: 'Learn network security, ethical hacking, and cyber threat prevention.',
      price: 0,
      thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
      videoUrls: [],
      teacher: teacher3._id,
      institution: 'Universiti Teknologi Malaysia',
      courseCode: 'SEC100',
      faculty: 'FICT',
      facultyCode: 'FICT',
      program: 'Bachelor of Cyber Security',
      programCode: 'BIT',
      semester: 3,
      privacy: 'public',
      category: 'Computer Science',
      level: 'Undergraduate Year 3'
    });

    const course12 = await Course.create({
      title: 'DevOps & CI/CD Pipeline',
      description: 'Master Docker, Kubernetes, and automated deployment workflows.',
      price: 59.99,
      thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800',
      videoUrls: [
        'https://example.com/videos/docker-intro.mp4',
        'https://example.com/videos/k8s-basics.mp4'
      ],
      teacher: teacher1._id,
      institution: 'Limkokwing University of Creative Technology',
      courseCode: 'DEVOPS300',
      faculty: 'FICT',
      facultyCode: 'FICT',
      program: 'Bachelor of Software Engineering',
      programCode: 'BIT',
      semester: 6,
      privacy: 'institution',
      category: 'Computer Science',
      level: 'Undergraduate Year 4'
    });

    console.log('Created 12 courses');

    // Create enrollments
    await Enrollment.create({
      student: student1._id,
      course: course1._id,
      progress: 75,
      completed: false
    });

    await Enrollment.create({
      student: student1._id,
      course: course3._id,
      progress: 100,
      completed: true
    });

    await Enrollment.create({
      student: student1._id,
      course: course6._id,
      progress: 20,
      completed: false
    });

    await Enrollment.create({
      student: student2._id,
      course: course1._id,
      progress: 30,
      completed: false
    });

    await Enrollment.create({
      student: student2._id,
      course: course2._id,
      progress: 50,
      completed: false
    });

    await Enrollment.create({
      student: student2._id,
      course: course4._id,
      progress: 100,
      completed: true
    });

    await Enrollment.create({
      student: student2._id,
      course: course7._id,
      progress: 45,
      completed: false
    });

    await Enrollment.create({
      student: student3._id,
      course: course3._id,
      progress: 10,
      completed: false
    });

    await Enrollment.create({
      student: student3._id,
      course: course5._id,
      progress: 0,
      completed: false
    });

    await Enrollment.create({
      student: student3._id,
      course: course8._id,
      progress: 60,
      completed: false
    });

    console.log('Created enrollments');

    console.log('\n✅ Seed completed successfully!');
    console.log('\nTest Users:');
    console.log('Teachers:');
    console.log('  - teacher1@example.com / Password123');
    console.log('  - teacher2@example.com / Password123');
    console.log('  - teacher3@example.com / Password123');
    console.log('Students:');
    console.log('  - student1@example.com / Password123');
    console.log('  - student2@example.com / Password123');
    console.log('  - student3@example.com / Password123');
    console.log('\nCourses: 12 courses seeded');
    console.log('\nInstitutions:');
    console.log('  - Limkokwing University of Creative Technology');
    console.log('  - University of Malaya');
    console.log('  - Universiti Teknologi Malaysia');
    console.log('  - International Islamic University Malaysia');

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seedData();
