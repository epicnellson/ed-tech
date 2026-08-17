const Course = require('../models/Course');
const Lesson = require('../models/Lesson');
const constants = require('../config/constants');

exports.addModule = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    const maxOrder = course.modules.length > 0 
      ? Math.max(...course.modules.map(m => m.order)) 
      : 0;

    const newModule = {
      title,
      order: maxOrder + 1
    };

    course.modules.push(newModule);
    await course.save();

    res.status(constants.HTTP_STATUS.CREATED).json({
      success: true,
      data: course.modules[course.modules.length - 1],
      message: 'Module added successfully'
    });
  } catch (error) {
    console.error('Error adding module:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to add module'
    });
  }
};

exports.updateModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const { title, order } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Module not found'
      });
    }

    if (title) module.title = title;
    if (order) module.order = order;

    await course.save();

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: module,
      message: 'Module updated successfully'
    });
  } catch (error) {
    console.error('Error updating module:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to update module'
    });
  }
};

exports.deleteModule = async (req, res) => {
  try {
    const { courseId, moduleId } = req.params;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    const module = course.modules.id(moduleId);
    if (!module) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Module not found'
      });
    }

    await Lesson.updateMany(
      { course: courseId, moduleId },
      { $unset: { moduleId: 1 } }
    );

    course.modules.pull(moduleId);
    await course.save();

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      message: 'Module deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting module:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete module'
    });
  }
};

exports.reorderModules = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { moduleIds } = req.body;
    const userId = req.user.id;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(constants.HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Course not found'
      });
    }

    if (course.teacher.toString() !== userId && req.user.role !== 'admin') {
      return res.status(constants.HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: 'Access denied'
      });
    }

    moduleIds.forEach((id, index) => {
      const module = course.modules.id(id);
      if (module) {
        module.order = index;
      }
    });

    await course.save();

    res.status(constants.HTTP_STATUS.OK).json({
      success: true,
      data: course.modules,
      message: 'Modules reordered successfully'
    });
  } catch (error) {
    console.error('Error reordering modules:', error);
    res.status(constants.HTTP_STATUS.SERVER_ERROR).json({
      success: false,
      message: 'Failed to reorder modules'
    });
  }
};
