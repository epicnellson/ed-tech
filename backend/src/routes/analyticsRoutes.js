const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/auth');

router.get('/teacher/courses', auth, analyticsController.getTeacherCoursesAnalytics);
router.get('/teacher/courses/:courseId', auth, analyticsController.getCourseAnalytics);
router.get('/teacher/dashboard', auth, analyticsController.getTeacherDashboardStats);

router.get('/admin/overview', auth, isAdmin, analyticsController.getAdminOverview);
router.get('/admin/institutions', auth, isAdmin, analyticsController.getAdminInstitutionStats);
router.get('/admin/institutions/export', auth, isAdmin, analyticsController.exportInstitutionStatsCSV);
router.get('/admin/courses/top', auth, isAdmin, analyticsController.getTopCourses);

module.exports = router;
