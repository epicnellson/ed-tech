const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');

router.get('/me/progress', auth, studentController.getMyProgress);
router.get('/me/recent-activity', auth, studentController.getRecentActivity);
router.post('/lessons/:lessonId/progress', auth, studentController.updateLessonProgress);

module.exports = router;
