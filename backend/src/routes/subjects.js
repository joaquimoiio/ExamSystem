const express = require('express');
const router = express.Router();

const subjectController = require('../controllers/subjectController');
const { authenticateToken, requireTeacher } = require('../middleware/auth');
const {
  validateSubjectCreate,
  validateSubjectUpdate,
  validatePagination
} = require('../middleware/validation');

// All routes require authentication and teacher role
router.use(authenticateToken, requireTeacher);

// Subject CRUD operations
router.get('/', validatePagination, subjectController.getSubjects);
router.get('/:id', subjectController.getSubject);
router.post('/', validateSubjectCreate, subjectController.createSubject);
router.put('/:id', validateSubjectUpdate, subjectController.updateSubject);
router.delete('/:id', subjectController.deleteSubject);

// Subject statistics and operations
router.get('/:id/stats', subjectController.getSubjectStats);
router.post('/:id/duplicate', subjectController.duplicateSubject);

module.exports = router;