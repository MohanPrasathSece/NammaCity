const express = require('express');
const { getAlerts, getAlert, createAlert, updateAlert, deleteAlert } = require('../controllers/safetyController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Public
router.get('/', getAlerts);
router.get('/:id', getAlert);

// Protected
router.post('/', protect, createAlert);
router.put('/:id', protect, updateAlert);
router.delete('/:id', protect, deleteAlert);

module.exports = router;
