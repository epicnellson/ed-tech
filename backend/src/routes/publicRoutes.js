const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/courses', publicController.getPublicCourses);
router.get('/courses/featured', publicController.getFeaturedCourses);
router.get('/courses/:id', publicController.getPublicCourseById);

module.exports = router;
