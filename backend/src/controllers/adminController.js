const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, institution, role, search, isActive } = req.query;
    
    const query = {};
    
    if (institution) {
      query.institution = institution;
    }
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }
    
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { name: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    });
  } catch (err) {
    console.error('GetUsers error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (isActive === undefined) {
      return res.status(400).json({ 
        success: false,
        message: 'isActive field is required' 
      });
    }

    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    user.isActive = isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        isActive: user.isActive
      }
    });
  } catch (err) {
    console.error('UpdateUserStatus error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.getCourses = async (req, res) => {
  try {
    const { page = 1, limit = 20, institution, privacy, search, isArchived } = req.query;
    
    const query = {};
    
    if (institution) {
      query.institution = institution;
    }
    
    if (privacy) {
      query.privacy = privacy;
    }
    
    if (isArchived !== undefined) {
      query.isArchived = isArchived === 'true';
    }
    
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { title: { $regex: safeSearch, $options: 'i' } },
        { courseCode: { $regex: safeSearch, $options: 'i' } }
      ];
    }

    const courses = await Course.find(query)
      .populate('teacher', 'name email institution')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Course.countDocuments(query);

    res.json({
      success: true,
      data: courses,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    });
  } catch (err) {
    console.error('GetCourses error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.updateCourseArchive = async (req, res) => {
  try {
    const { id } = req.params;
    const { isArchived } = req.body;

    if (isArchived === undefined) {
      return res.status(400).json({ 
        success: false,
        message: 'isArchived field is required' 
      });
    }

    const course = await Course.findById(id);
    
    if (!course) {
      return res.status(404).json({ 
        success: false,
        message: 'Course not found' 
      });
    }

    course.isArchived = isArchived;
    await course.save();

    res.json({
      success: true,
      message: `Course ${isArchived ? 'archived' : 'unarchived'} successfully`,
      data: {
        id: course._id,
        title: course.title,
        isArchived: course.isArchived
      }
    });
  } catch (err) {
    console.error('UpdateCourseArchive error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.getEnrollments = async (req, res) => {
  try {
    const { page = 1, limit = 20, institution, courseId, userId } = req.query;
    
    let query = {};
    
    if (institution) {
      const courses = await Course.find({ institution }).select('_id');
      const courseIds = courses.map(c => c._id);
      query.course = { $in: courseIds };
    }
    
    if (courseId) {
      query.course = courseId;
    }
    
    if (userId) {
      query.student = userId;
    }

    const enrollments = await Enrollment.find(query)
      .populate('student', 'name email institution')
      .populate({
        path: 'course',
        select: 'title courseCode institution'
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Enrollment.countDocuments(query);

    res.json({
      success: true,
      data: enrollments,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
        limit: Number(limit)
      }
    });
  } catch (err) {
    console.error('GetEnrollments error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};

exports.getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments({ isArchived: false });
    const totalEnrollments = await Enrollment.countDocuments();
    const totalInstitutions = await User.distinct('institution');

    const usersByRole = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const coursesByPrivacy = await Course.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$privacy', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        totalCourses,
        totalEnrollments,
        totalInstitutions: totalInstitutions.length,
        usersByRole,
        coursesByPrivacy
      }
    });
  } catch (err) {
    console.error('GetStats error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};
