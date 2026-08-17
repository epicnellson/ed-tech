require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const Quiz = require('../models/Quiz');
const Lesson = require('../models/Lesson');

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

    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Course.deleteMany({});
    await Enrollment.deleteMany({});
    await Quiz.deleteMany({});
    await Lesson.deleteMany({});
    console.log('✅ Cleared existing data\n');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', 10);

    console.log('👥 Creating teachers...');
    
    const teachers = await User.create([
      {
        name: 'Dr. Albert Williams',
        email: 'albert.williams@usl.edu.sl',
        password: hashedPassword,
        role: 'teacher',
        institution: 'University of Sierra Leone'
      },
      {
        name: 'Prof. Amara Sesay',
        email: 'amara.sesay@njala.edu.sl',
        password: hashedPassword,
        role: 'teacher',
        institution: 'Njala University'
      },
      {
        name: 'Dr. Mohamed Koroma',
        email: 'mohamed.koroma@unimak.edu.sl',
        password: hashedPassword,
        role: 'teacher',
        institution: 'University of Makeni'
      },
      {
        name: 'Dr. Fatima Bangura',
        email: 'fatima.bangura@ebkust.edu.sl',
        password: hashedPassword,
        role: 'teacher',
        institution: 'Ernest Bai Koroma University of Science and Technology'
      },
      {
        name: 'Eng. Joseph Kargbo',
        email: 'joseph.kargbo@etu.edu.sl',
        password: hashedPassword,
        role: 'teacher',
        institution: 'Eastern Technical University of Sierra Leone'
      },
      {
        name: 'Dr. Rebecca Stevens',
        email: 'rebecca.stevens@mmtu.edu.sl',
        password: hashedPassword,
        role: 'teacher',
        institution: 'Milton Margai Technical University'
      },
      {
        name: 'Mr. Thomas Ngaujah',
        email: 'thomas.ngaujah@fp.edu.sl',
        password: hashedPassword,
        role: 'teacher',
        institution: 'Freetown Polytechnic'
      },
      {
        name: 'Dr. Helen Conteh',
        email: 'helen.conteh@umt.edu.sl',
        password: hashedPassword,
        role: 'teacher',
        institution: 'University of Management and Technology'
      },
      {
        name: 'Prof. Samuel Kanneh',
        email: 'samuel.kanneh@usl.edu.sl',
        password: hashedPassword,
        role: 'teacher',
        institution: 'University of Sierra Leone'
      },
      {
        name: 'Dr. Elizabeth Rogers',
        email: 'elizabeth.rogers@njala.edu.sl',
        password: hashedPassword,
        role: 'teacher',
        institution: 'Njala University'
      }
    ]);
    console.log(`✅ Created ${teachers.length} teachers\n`);

    console.log('👨‍🎓 Creating students...');
    
    const students = await User.create([
      {
        name: 'Abu Bakarr',
        email: 'abu.bakarr@student.usl.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'University of Sierra Leone'
      },
      {
        name: 'Mary Kamara',
        email: 'mary.kamara@student.njala.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'Njala University'
      },
      {
        name: 'John Sesay',
        email: 'john.sesay@student.unimak.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'University of Makeni'
      },
      {
        name: 'Fatmata Bah',
        email: 'fatmata.bah@student.ebkust.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'Ernest Bai Koroma University of Science and Technology'
      },
      {
        name: 'Mohamed Turay',
        email: 'mohamed.turay@student.etu.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'Eastern Technical University of Sierra Leone'
      },
      {
        name: 'Patricia Mansaray',
        email: 'patricia.mansaray@student.mmtu.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'Milton Margai Technical University'
      },
      {
        name: 'David Kallon',
        email: 'david.kallon@student.fp.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'Freetown Polytechnic'
      },
      {
        name: 'Esther Bockarie',
        email: 'esther.bockarie@student.umt.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'University of Management and Technology'
      },
      {
        name: 'Samuel Koroma',
        email: 'samuel.koroma@student.usl.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'University of Sierra Leone'
      },
      {
        name: 'Grace Bangura',
        email: 'grace.bangura@student.njala.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'Njala University'
      },
      {
        name: 'Lawrence Conteh',
        email: 'lawrence.conteh@student.ebkust.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'Ernest Bai Koroma University of Science and Technology'
      },
      {
        name: 'Annie James',
        email: 'annie.james@student.etu.edu.sl',
        password: hashedPassword,
        role: 'student',
        institution: 'Eastern Technical University of Sierra Leone'
      }
    ]);
    console.log(`✅ Created ${students.length} students\n`);

    console.log('📚 Creating courses...');

    const courses = await Course.create([
      // University of Sierra Leone Courses
      {
        title: 'Introduction to Computer Science',
        description: 'Fundamental concepts of computer science including algorithms, data structures, and programming basics. Perfect for first-year students starting their journey in computing.',
        price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
        videoUrls: ['https://example.com/videos/cs101-intro.mp4', 'https://example.com/videos/cs101-algorithms.mp4'],
        teacher: teachers[0]._id,
        institution: 'University of Sierra Leone',
        courseCode: 'CS101',
        faculty: 'Faculty of Science',
        facultyCode: 'FOS',
        program: 'BSc Computer Science',
        programCode: 'BCS',
        semester: 1,
        privacy: 'institution',
        category: 'Computer Science',
        level: 'Undergraduate Year 1'
      },
      {
        title: 'Principles of Business Management',
        description: 'Learn the fundamental principles of business management including planning, organizing, leading, and controlling organizational resources effectively.',
        price: 25000,
        thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
        videoUrls: ['https://example.com/videos/bus101-intro.mp4'],
        teacher: teachers[0]._id,
        institution: 'University of Sierra Leone',
        courseCode: 'BUS101',
        faculty: 'Faculty of Business and Economics',
        facultyCode: 'FBE',
        program: 'BSc Business Administration',
        programCode: 'BBA',
        semester: 1,
        privacy: 'institution',
        category: 'Business Administration',
        level: 'Undergraduate Year 1'
      },
      {
        title: 'Advanced Engineering Mathematics',
        description: 'Comprehensive course covering advanced mathematical concepts required for engineering students including calculus, linear algebra, and differential equations.',
        price: 35000,
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        videoUrls: ['https://example.com/videos/math301-calc.mp4', 'https://example.com/videos/math301-linalg.mp4'],
        teacher: teachers[8]._id,
        institution: 'University of Sierra Leone',
        courseCode: 'ENG301',
        faculty: 'Faculty of Engineering',
        facultyCode: 'FOE',
        program: 'BSc Civil Engineering',
        programCode: 'BCE',
        semester: 5,
        privacy: 'institution',
        category: 'Engineering',
        level: 'Undergraduate Year 3'
      },

      // Njala University Courses
      {
        title: 'Introduction to Agriculture',
        description: 'Core concepts of agriculture including crop production, soil science, and farming practices suitable for Sierra Leone\'s climate and conditions.',
        price: 0,
        thumbnail: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',
        videoUrls: ['https://example.com/videos/agr101-intro.mp4'],
        teacher: teachers[1]._id,
        institution: 'Njala University',
        courseCode: 'AGR101',
        faculty: 'School of Agriculture and Food Sciences',
        facultyCode: 'SAFS',
        program: 'BSc Agriculture',
        programCode: 'BAG',
        semester: 1,
        privacy: 'institution',
        category: 'Agriculture',
        level: 'Undergraduate Year 1'
      },
      {
        title: 'Environmental Management and Conservation',
        description: 'Understanding environmental issues, conservation strategies, and sustainable resource management practices for Sierra Leone\'s ecosystem.',
        price: 20000,
        thumbnail: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
        videoUrls: ['https://example.com/videos/env201-intro.mp4'],
        teacher: teachers[1]._id,
        institution: 'Njala University',
        courseCode: 'ENV201',
        faculty: 'School of Environmental Sciences',
        facultyCode: 'SES',
        program: 'BSc Environmental Management',
        programCode: 'BEM',
        semester: 3,
        privacy: 'institution',
        category: 'Natural Sciences',
        level: 'Undergraduate Year 2'
      },
      {
        title: 'Primary Education Teaching Methods',
        description: 'Learn effective teaching methodologies for primary school education including lesson planning, classroom management, and assessment techniques.',
        price: 15000,
        thumbnail: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
        videoUrls: ['https://example.com/videos/ed101-methods.mp4'],
        teacher: teachers[9]._id,
        institution: 'Njala University',
        courseCode: 'EDU101',
        faculty: 'School of Education',
        facultyCode: 'SOE',
        program: 'BEd Primary Education',
        programCode: 'BPEP',
        semester: 1,
        privacy: 'institution',
        category: 'Education',
        level: 'Undergraduate Year 1'
      },

      // University of Makeni Courses
      {
        title: 'Web Development Fundamentals',
        description: 'Learn HTML, CSS, JavaScript and modern web development frameworks to build responsive websites and web applications.',
        price: 45000,
        thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800',
        videoUrls: ['https://example.com/videos/web101-html.mp4', 'https://example.com/videos/web101-css.mp4', 'https://example.com/videos/web101-js.mp4'],
        teacher: teachers[2]._id,
        institution: 'University of Makeni',
        courseCode: 'WEB101',
        faculty: 'Faculty of Science and Technology',
        facultyCode: 'FST',
        program: 'BSc Information Technology',
        programCode: 'BIT',
        semester: 2,
        privacy: 'institution',
        category: 'Computer Science',
        level: 'Undergraduate Year 1'
      },
      {
        title: 'Microeconomics Principles',
        description: 'Introduction to economic theory covering supply and demand, consumer behavior, market structures, and economic decision-making.',
        price: 18000,
        thumbnail: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
        videoUrls: ['https://example.com/videos/eco101-intro.mp4'],
        teacher: teachers[2]._id,
        institution: 'University of Makeni',
        courseCode: 'ECO101',
        faculty: 'Faculty of Business Studies',
        facultyCode: 'FBS',
        program: 'BSc Economics',
        programCode: 'BEC',
        semester: 1,
        privacy: 'public',
        category: 'Economics',
        level: 'Undergraduate Year 1'
      },

      // Ernest Bai Koroma University Courses
      {
        title: 'Electrical Circuit Analysis',
        description: 'Comprehensive study of electrical circuits including DC and AC analysis, network theorems, and circuit simulation techniques.',
        price: 55000,
        thumbnail: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800',
        videoUrls: ['https://example.com/videos/ece201-circuits.mp4', 'https://example.com/videos/ece201-ac.mp4'],
        teacher: teachers[3]._id,
        institution: 'Ernest Bai Koroma University of Science and Technology',
        courseCode: 'ECE201',
        faculty: 'Faculty of Engineering',
        facultyCode: 'FOE',
        program: 'BSc Electrical and Electronic Engineering',
        programCode: 'BEEE',
        semester: 3,
        privacy: 'institution',
        category: 'Engineering',
        level: 'Undergraduate Year 2'
      },
      {
        title: 'Data Structures and Algorithms',
        description: 'Advanced programming course covering essential data structures (arrays, linked lists, trees, graphs) and algorithmic problem-solving techniques.',
        price: 50000,
        thumbnail: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800',
        videoUrls: ['https://example.com/videos/cs201-ds.mp4', 'https://example.com/videos/cs201-algo.mp4'],
        teacher: teachers[3]._id,
        institution: 'Ernest Bai Koroma University of Science and Technology',
        courseCode: 'CS201',
        faculty: 'Faculty of Science',
        facultyCode: 'FOS',
        program: 'BSc Computer Science',
        programCode: 'BCS',
        semester: 3,
        privacy: 'institution',
        category: 'Computer Science',
        level: 'Undergraduate Year 2'
      },

      // Eastern Technical University Courses
      {
        title: 'Mining Engineering Fundamentals',
        description: 'Introduction to mining engineering principles including mine design, extraction methods, safety protocols, and environmental considerations.',
        price: 65000,
        thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
        videoUrls: ['https://example.com/videos/me101-intro.mp4'],
        teacher: teachers[4]._id,
        institution: 'Eastern Technical University of Sierra Leone',
        courseCode: 'MNE101',
        faculty: 'Faculty of Mining and Geosciences',
        facultyCode: 'FMG',
        program: 'BSc Mining Engineering',
        programCode: 'BMNE',
        semester: 1,
        privacy: 'institution',
        category: 'Engineering',
        level: 'Undergraduate Year 1'
      },
      {
        title: 'Technical Mathematics I',
        description: 'Foundation mathematics course covering algebra, trigonometry, calculus, and their applications in engineering and technology.',
        price: 25000,
        thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800',
        videoUrls: ['https://example.com/videos/tm101-algebra.mp4'],
        teacher: teachers[4]._id,
        institution: 'Eastern Technical University of Sierra Leone',
        courseCode: 'TM101',
        faculty: 'Faculty of Engineering',
        facultyCode: 'FOE',
        program: 'BEng Civil Engineering',
        programCode: 'BCEL',
        semester: 1,
        privacy: 'public',
        category: 'Mathematics',
        level: 'Undergraduate Year 1'
      },

      // Milton Margai Technical University Courses
      {
        title: 'Civil Engineering Technology',
        description: 'Practical civil engineering course covering construction materials, structural analysis, and building design with hands-on lab sessions.',
        price: 60000,
        thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800',
        videoUrls: ['https://example.com/videos/cet201-materials.mp4'],
        teacher: teachers[5]._id,
        institution: 'Milton Margai Technical University',
        courseCode: 'CET201',
        faculty: 'Faculty of Engineering Technology',
        facultyCode: 'FET',
        program: 'BSc Civil Engineering Technology',
        programCode: 'BCET',
        semester: 3,
        privacy: 'institution',
        category: 'Engineering',
        level: 'Undergraduate Year 2'
      },
      {
        title: 'Hospitality Management',
        description: 'Learn hotel management, food service operations, customer service, and event management in the hospitality industry.',
        price: 35000,
        thumbnail: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800',
        videoUrls: ['https://example.com/videos/hm101-intro.mp4'],
        teacher: teachers[5]._id,
        institution: 'Milton Margai Technical University',
        courseCode: 'HM101',
        faculty: 'Faculty of Hospitality and Tourism',
        facultyCode: 'FHT',
        program: 'BSc Hospitality Management',
        programCode: 'BHM',
        semester: 1,
        privacy: 'public',
        category: 'Hospitality & Tourism',
        level: 'Undergraduate Year 1'
      },

      // Freetown Polytechnic Courses
      {
        title: 'Graphic Design Essentials',
        description: 'Learn design principles, typography, color theory, and如何使用 Adobe Creative Suite 进行专业平面设计。',
        price: 40000,
        thumbnail: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800',
        videoUrls: ['https://example.com/videos/gd101-intro.mp4'],
        teacher: teachers[6]._id,
        institution: 'Freetown Polytechnic',
        courseCode: 'GD101',
        faculty: 'School of Art and Design',
        facultyCode: 'SAD',
        program: 'BSc Graphic Design',
        programCode: 'BGD',
        semester: 1,
        privacy: 'institution',
        category: 'Fashion & Design',
        level: 'Undergraduate Year 1'
      },
      {
        title: 'Database Management Systems',
        description: 'Comprehensive course on database design, SQL, data modeling, and database administration using industry-standard tools.',
        price: 45000,
        thumbnail: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800',
        videoUrls: ['https://example.com/videos/db201-intro.mp4', 'https://example.com/videos/db201-sql.mp4'],
        teacher: teachers[6]._id,
        institution: 'Freetown Polytechnic',
        courseCode: 'DB201',
        faculty: 'School of Information Technology',
        facultyCode: 'SOIT',
        program: 'BSc Information Systems',
        programCode: 'BIS',
        semester: 3,
        privacy: 'institution',
        category: 'Computer Science',
        level: 'Undergraduate Year 2'
      },

      // University of Management and Technology Courses
      {
        title: 'Project Management Professional',
        description: 'Learn project management methodologies including Agile, Scrum, and PMBOK. Prepare for PMP certification.',
        price: 75000,
        thumbnail: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800',
        videoUrls: ['https://example.com/videos/pm301-intro.mp4'],
        teacher: teachers[7]._id,
        institution: 'University of Management and Technology',
        courseCode: 'PM301',
        faculty: 'Faculty of Business Studies',
        facultyCode: 'FBS',
        program: 'BSc Project Management',
        programCode: 'BPM',
        semester: 5,
        privacy: 'private',
        category: 'Business Administration',
        level: 'Undergraduate Year 3'
      },
      {
        title: 'Cyber Security Fundamentals',
        description: 'Introduction to cybersecurity including network security, ethical hacking, threat analysis, and security best practices.',
        price: 80000,
        thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
        videoUrls: ['https://example.com/videos/cs301-intro.mp4', 'https://example.com/videos/cs301-network.mp4'],
        teacher: teachers[7]._id,
        institution: 'University of Management and Technology',
        courseCode: 'CSEC301',
        faculty: 'Faculty of Computing and Information Technology',
        facultyCode: 'FCIT',
        program: 'BSc Cyber Security',
        programCode: 'BCS',
        semester: 5,
        privacy: 'institution',
        category: 'Computer Science',
        level: 'Undergraduate Year 3'
      }
    ]);
    console.log(`✅ Created ${courses.length} courses\n`);

    console.log('📝 Creating enrollments...');

    const enrollments = [
      // University of Sierra Leone students
      { student: students[0], course: courses[0], progress: 75, completed: false },
      { student: students[0], course: courses[1], progress: 100, completed: true },
      { student: students[8], course: courses[0], progress: 45, completed: false },
      { student: students[8], course: courses[2], progress: 20, completed: false },

      // Njala University students
      { student: students[1], course: courses[3], progress: 100, completed: true },
      { student: students[1], course: courses[4], progress: 60, completed: false },
      { student: students[9], course: courses[3], progress: 80, completed: false },
      { student: students[9], course: courses[5], progress: 30, completed: false },

      // University of Makeni students
      { student: students[2], course: courses[6], progress: 55, completed: false },
      { student: students[2], course: courses[7], progress: 100, completed: true },

      // Ernest Bai Koroma University students
      { student: students[3], course: courses[8], progress: 40, completed: false },
      { student: students[3], course: courses[9], progress: 25, completed: false },
      { student: students[10], course: courses[8], progress: 70, completed: false },
      { student: students[10], course: courses[9], progress: 15, completed: false },

      // Eastern Technical University students
      { student: students[4], course: courses[10], progress: 90, completed: false },
      { student: students[4], course: courses[11], progress: 100, completed: true },
      { student: students[11], course: courses[10], progress: 35, completed: false },
      { student: students[11], course: courses[11], progress: 50, completed: false },

      // Milton Margai Technical University students
      { student: students[5], course: courses[12], progress: 65, completed: false },
      { student: students[5], course: courses[13], progress: 100, completed: true },

      // Freetown Polytechnic students
      { student: students[6], course: courses[14], progress: 80, completed: false },
      { student: students[6], course: courses[15], progress: 45, completed: false },

      // University of Management and Technology students
      { student: students[7], course: courses[16], progress: 30, completed: false },
      { student: students[7], course: courses[17], progress: 10, completed: false }
    ];

    await Enrollment.create(enrollments.map(e => ({
      student: e.student._id,
      course: e.course._id,
      progress: e.progress,
      completed: e.completed
    })));
    console.log(`✅ Created ${enrollments.length} enrollments\n`);

    console.log('\n🎉 ===========================================');
    console.log('   SEED DATA CREATED SUCCESSFULLY!');
    console.log('===========================================\n');
    
    console.log('📋 Summary:');
    console.log(`   • Teachers: ${teachers.length}`);
    console.log(`   • Students: ${students.length}`);
    console.log(`   • Courses: ${courses.length}`);
    console.log(`   • Enrollments: ${enrollments.length}\n`);

    console.log('👨‍🏫 Teacher Accounts (login with email/password):');
    teachers.forEach((t, i) => {
      console.log(`   ${i + 1}. ${t.name} (${t.institution})`);
      console.log(`      Email: ${t.email} / password123\n`);
    });

    console.log('👨‍🎓 Student Accounts (login with email/password):');
    students.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.name} (${s.institution})`);
      console.log(`      Email: ${s.email} / password123\n`);
    });

    console.log('🏫 Universities:');
    const universities = [...new Set([...teachers.map(t => t.institution), ...students.map(s => s.institution)])];
    universities.forEach(u => console.log(`   • ${u}`));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

seedData();
