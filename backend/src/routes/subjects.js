const express = require('express');
const router = express.Router();

const subjectController = require('../controllers/subjectController');
const { authenticateToken, requireTeacher, checkOwnership } = require('../middleware/auth');
const {
  validateSubjectCreate,
  validateSubjectUpdate,
  validatePagination,
  validateUUIDParam
} = require('../middleware/validation');
const { Subject } = require('../models');

// All routes require authentication
router.use(authenticateToken);

// List subjects with pagination and search
router.get('/', validatePagination, subjectController.getSubjects);

// Get subject statistics for dashboard
router.get('/stats', subjectController.getSubjectsStats);

// Create new subject (teachers and admins only)
router.post('/', requireTeacher, validateSubjectCreate, subjectController.createSubject);

// Get subject by ID
router.get('/:id', 
  validateUUIDParam('id'),
  checkOwnership(Subject),
  subjectController.getSubjectById
);

// Update subject (only owner or admin)
router.put('/:id',
  validateUUIDParam('id'),
  checkOwnership(Subject),
  validateSubjectUpdate,
  subjectController.updateSubject
);

// Delete subject (only owner or admin)
router.delete('/:id',
  validateUUIDParam('id'),
  checkOwnership(Subject),
  subjectController.deleteSubject
);

// Get questions count by difficulty for a subject
router.get('/:id/questions-count',
  validateUUIDParam('id'),
  checkOwnership(Subject),
  subjectController.getQuestionsCount
);

// Get exams for a subject
router.get('/:id/exams',
  validateUUIDParam('id'),
  checkOwnership(Subject),
  validatePagination,
  subjectController.getSubjectExams
);

// Get questions for a subject
router.get('/:id/questions',
  validateUUIDParam('id'),
  checkOwnership(Subject),
  validatePagination,
  subjectController.getSubjectQuestions
);

// Check if subject can create exam with given requirements
router.post('/:id/check-exam-requirements',
  validateUUIDParam('id'),
  checkOwnership(Subject),
  subjectController.checkExamRequirements
);

module.exports = router;