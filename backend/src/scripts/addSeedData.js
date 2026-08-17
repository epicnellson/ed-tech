require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

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

    console.log('➕ Adding NEW seed data (keeping existing data)...\n');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create new Sierra Leone teachers (only if they don't exist)
    const existingEmails = await User.find().distinct('email');
    
    const teachers = [];
    const teacherData = [
      { name: 'Dr. Albert Williams', email: 'albert.williams@usl.edu.sl', institution: 'University of Sierra Leone' },
      { name: 'Prof. Amara Sesay', email: 'amara.sesay@njala.edu.sl', institution: 'Njala University' },
      { name: 'Dr. Mohamed Koroma', email: 'mohamed.koroma@unimak.edu.sl', institution: 'University of Makeni' },
      { name: 'Dr. Fatima Bangura', email: 'fatima.bangura@ebkust.edu.sl', institution: 'Ernest Bai Koroma University of Science and Technology' },
      { name: 'Eng. Joseph Kargbo', email: 'joseph.kargbo@etu.edu.sl', institution: 'Eastern Technical University of Sierra Leone' },
      { name: 'Dr. Rebecca Stevens', email: 'rebecca.stevens@mmtu.edu.sl', institution: 'Milton Margai Technical University' },
      { name: 'Mr. Thomas Ngaujah', email: 'thomas.ngaujah@fp.edu.sl', institution: 'Freetown Polytechnic' },
      { name: 'Dr. Helen Conteh', email: 'helen.conteh@umt.edu.sl', institution: 'University of Management and Technology' },
      { name: 'Prof. Samuel Kanneh', email: 'samuel.kanneh@usl.edu.sl', institution: 'University of Sierra Leone' },
      { name: 'Dr. Elizabeth Rogers', email: 'elizabeth.rogers@njala.edu.sl', institution: 'Njala University' }
    ];

    for (const t of teacherData) {
      if (!existingEmails.includes(t.email)) {
        const teacher = await User.create({
          name: t.name,
          email: t.email,
          password: hashedPassword,
          role: 'teacher',
          institution: t.institution
        });
        teachers.push(teacher);
        console.log(`✅ Created teacher: ${t.email}`);
      } else {
        console.log(`⏭️  Skipped (exists): ${t.email}`);
        const teacher = await User.findOne({ email: t.email });
        teachers.push(teacher);
      }
    }

    // Create new students (only if they don't exist)
    const students = [];
    const studentData = [
      { name: 'Abu Bakarr', email: 'abu.bakarr@student.usl.edu.sl', institution: 'University of Sierra Leone' },
      { name: 'Mary Kamara', email: 'mary.kamara@student.njala.edu.sl', institution: 'Njala University' },
      { name: 'John Sesay', email: 'john.sesay@student.unimak.edu.sl', institution: 'University of Makeni' },
      { name: 'Fatmata Bah', email: 'fatmata.bah@student.ebkust.edu.sl', institution: 'Ernest Bai Koroma University of Science and Technology' },
      { name: 'Mohamed Turay', email: 'mohamed.turay@student.etu.edu.sl', institution: 'Eastern Technical University of Sierra Leone' },
      { name: 'Patricia Mansaray', email: 'patricia.mansaray@student.mmtu.edu.sl', institution: 'Milton Margai Technical University' },
      { name: 'David Kallon', email: 'david.kallon@student.fp.edu.sl', institution: 'Freetown Polytechnic' },
      { name: 'Esther Bockarie', email: 'esther.bockarie@student.umt.edu.sl', institution: 'University of Management and Technology' },
      { name: 'Samuel Koroma', email: 'samuel.koroma@student.usl.edu.sl', institution: 'University of Sierra Leone' },
      { name: 'Grace Bangura', email: 'grace.bangura@student.njala.edu.sl', institution: 'Njala University' },
      { name: 'Lawrence Conteh', email: 'lawrence.conteh@student.ebkust.edu.sl', institution: 'Ernest Bai Koroma University of Science and Technology' },
      { name: 'Annie James', email: 'annie.james@student.etu.edu.sl', institution: 'Eastern Technical University of Sierra Leone' }
    ];

    for (const s of studentData) {
      if (!existingEmails.includes(s.email)) {
        const student = await User.create({
          name: s.name,
          email: s.email,
          password: hashedPassword,
          role: 'student',
          institution: s.institution
        });
        students.push(student);
        console.log(`✅ Created student: ${s.email}`);
      } else {
        console.log(`⏭️  Skipped (exists): ${s.email}`);
        const student = await User.findOne({ email: s.email });
        students.push(student);
      }
    }

    // Create new courses (only if they don't exist)
    const courseData = [
      // University of Sierra Leone
      { title: 'Introduction to Computer Science', institution: 'University of Sierra Leone', courseCode: 'CS101-USL', faculty: 'Faculty of Science', facultyCode: 'FOS', program: 'BSc Computer Science', programCode: 'BCS', category: 'Computer Science', level: 'Undergraduate Year 1', semester: 1, price: 0, privacy: 'institution' },
      { title: 'Principles of Business Management', institution: 'University of Sierra Leone', courseCode: 'BUS101', faculty: 'Faculty of Business and Economics', facultyCode: 'FBE', program: 'BSc Business Administration', programCode: 'BBA', category: 'Business Administration', level: 'Undergraduate Year 1', semester: 1, price: 25000, privacy: 'institution' },
      { title: 'Advanced Engineering Mathematics', institution: 'University of Sierra Leone', courseCode: 'ENG301', faculty: 'Faculty of Engineering', facultyCode: 'FOE', program: 'BSc Civil Engineering', programCode: 'BCE', category: 'Engineering', level: 'Undergraduate Year 3', semester: 5, price: 35000, privacy: 'institution' },
      // Njala University
      { title: 'Introduction to Agriculture', institution: 'Njala University', courseCode: 'AGR101', faculty: 'School of Agriculture and Food Sciences', facultyCode: 'SAFS', program: 'BSc Agriculture', programCode: 'BAG', category: 'Agriculture', level: 'Undergraduate Year 1', semester: 1, price: 0, privacy: 'institution' },
      { title: 'Environmental Management', institution: 'Njala University', courseCode: 'ENV201', faculty: 'School of Environmental Sciences', facultyCode: 'SES', program: 'BSc Environmental Management', programCode: 'BEM', category: 'Natural Sciences', level: 'Undergraduate Year 2', semester: 3, price: 20000, privacy: 'institution' },
      { title: 'Primary Education Teaching Methods', institution: 'Njala University', courseCode: 'EDU101', faculty: 'School of Education', facultyCode: 'SOE', program: 'BEd Primary Education', programCode: 'BPEP', category: 'Education', level: 'Undergraduate Year 1', semester: 1, price: 15000, privacy: 'institution' },
      // University of Makeni
      { title: 'Web Development Fundamentals', institution: 'University of Makeni', courseCode: 'WEB101-UNIMAK', faculty: 'Faculty of Science and Technology', facultyCode: 'FST', program: 'BSc Information Technology', programCode: 'BIT', category: 'Computer Science', level: 'Undergraduate Year 1', semester: 2, price: 45000, privacy: 'institution' },
      { title: 'Microeconomics Principles', institution: 'University of Makeni', courseCode: 'ECO101', faculty: 'Faculty of Business Studies', facultyCode: 'FBS', program: 'BSc Economics', programCode: 'BEC', category: 'Economics', level: 'Undergraduate Year 1', semester: 1, price: 18000, privacy: 'public' },
      // EBKUST
      { title: 'Electrical Circuit Analysis', institution: 'Ernest Bai Koroma University of Science and Technology', courseCode: 'ECE201', faculty: 'Faculty of Engineering', facultyCode: 'FOE', program: 'BSc Electrical and Electronic Engineering', programCode: 'BEEE', category: 'Engineering', level: 'Undergraduate Year 2', semester: 3, price: 55000, privacy: 'institution' },
      { title: 'Data Structures and Algorithms', institution: 'Ernest Bai Koroma University of Science and Technology', courseCode: 'CS201-EBKUST', faculty: 'Faculty of Science', facultyCode: 'FOS', program: 'BSc Computer Science', programCode: 'BCS', category: 'Computer Science', level: 'Undergraduate Year 2', semester: 3, price: 50000, privacy: 'institution' },
      // ETU
      { title: 'Mining Engineering Fundamentals', institution: 'Eastern Technical University of Sierra Leone', courseCode: 'MNE101', faculty: 'Faculty of Mining and Geosciences', facultyCode: 'FMG', program: 'BSc Mining Engineering', programCode: 'BMNE', category: 'Engineering', level: 'Undergraduate Year 1', semester: 1, price: 65000, privacy: 'institution' },
      { title: 'Technical Mathematics I', institution: 'Eastern Technical University of Sierra Leone', courseCode: 'TM101', faculty: 'Faculty of Engineering', facultyCode: 'FOE', program: 'BEng Civil Engineering', programCode: 'BCEL', category: 'Mathematics', level: 'Undergraduate Year 1', semester: 1, price: 25000, privacy: 'public' },
      // MMTU
      { title: 'Civil Engineering Technology', institution: 'Milton Margai Technical University', courseCode: 'CET201', faculty: 'Faculty of Engineering Technology', facultyCode: 'FET', program: 'BSc Civil Engineering Technology', programCode: 'BCET', category: 'Engineering', level: 'Undergraduate Year 2', semester: 3, price: 60000, privacy: 'institution' },
      { title: 'Hospitality Management', institution: 'Milton Margai Technical University', courseCode: 'HM101', faculty: 'Faculty of Hospitality and Tourism', facultyCode: 'FHT', program: 'BSc Hospitality Management', programCode: 'BHM', category: 'Hospitality & Tourism', level: 'Undergraduate Year 1', semester: 1, price: 35000, privacy: 'public' },
      // Freetown Polytechnic
      { title: 'Graphic Design Essentials', institution: 'Freetown Polytechnic', courseCode: 'GD101', faculty: 'School of Art and Design', facultyCode: 'SAD', program: 'BSc Graphic Design', programCode: 'BGD', category: 'Fashion & Design', level: 'Undergraduate Year 1', semester: 1, price: 40000, privacy: 'institution' },
      { title: 'Database Management Systems', institution: 'Freetown Polytechnic', courseCode: 'DB201', faculty: 'School of Information Technology', facultyCode: 'SOIT', program: 'BSc Information Systems', programCode: 'BIS', category: 'Computer Science', level: 'Undergraduate Year 2', semester: 3, price: 45000, privacy: 'institution' },
      // UMT
      { title: 'Project Management Professional', institution: 'University of Management and Technology', courseCode: 'PM301', faculty: 'Faculty of Business Studies', facultyCode: 'FBS', program: 'BSc Project Management', programCode: 'BPM', category: 'Business Administration', level: 'Undergraduate Year 3', semester: 5, price: 75000, privacy: 'private' },
      { title: 'Cyber Security Fundamentals', institution: 'University of Management and Technology', courseCode: 'CSEC301', faculty: 'Faculty of Computing and Information Technology', facultyCode: 'FCIT', program: 'BSc Cyber Security', programCode: 'BCS', category: 'Computer Science', level: 'Undergraduate Year 3', semester: 5, price: 80000, privacy: 'institution' }
    ];

    const courses = [];
    const existingCourseCodes = await Course.find().distinct('courseCode');

    for (let i = 0; i < courseData.length; i++) {
      const c = courseData[i];
      const teacherIndex = i % teachers.length;
      
      if (!existingCourseCodes.includes(c.courseCode)) {
        const course = await Course.create({
          title: c.title,
          description: `Course in ${c.program} at ${c.institution}`,
          price: c.price,
          thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
          videoUrls: [],
          teacher: teachers[teacherIndex]._id,
          institution: c.institution,
          courseCode: c.courseCode,
          faculty: c.faculty,
          facultyCode: c.facultyCode,
          program: c.program,
          programCode: c.programCode,
          semester: c.semester,
          privacy: c.privacy,
          category: c.category,
          level: c.level
        });
        courses.push(course);
        console.log(`✅ Created course: ${c.title}`);
      } else {
        console.log(`⏭️  Skipped (exists): ${c.title}`);
        const course = await Course.findOne({ courseCode: c.courseCode });
        courses.push(course);
      }
    }

    console.log('\n🎉 ===========================================');
    console.log('   NEW SEED DATA ADDED SUCCESSFULLY!');
    console.log('===========================================\n');
    
    console.log('📋 Summary:');
    console.log(`   • Teachers added: ${teachers.length}`);
    console.log(`   • Students added: ${students.length}`);
    console.log(`   • Courses added: ${courses.length}`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
};

seedData();
