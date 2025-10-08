const express = require('express');
const { getReports, getReport, createReport, updateReport, deleteReport } = require('../controllers/accessibilityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public
router.get('/', getReports);
router.get('/:id', getReport);

// Protected
router.post('/', protect, createReport);
router.put('/:id', protect, updateReport);
router.delete('/:id', protect, deleteReport);

module.exports = router;
