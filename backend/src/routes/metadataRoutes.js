const express = require('express');
const router = express.Router();
const metadataController = require('../controllers/metadataController');
const auth = require('../middleware/auth');

/**
 * Public metadata routes - needed for registration flow
 * These endpoints expose university structure which is typically public info
 */
router.get('/universities', metadataController.getUniversities);
router.get('/universities/:universityCode/faculties', metadataController.getFaculties);
router.get('/universities/:universityCode/faculties/:facultyCode/programs', metadataController.getPrograms);
router.get('/universities/:universityCode/config', metadataController.getUniversityConfig);

module.exports = router;
