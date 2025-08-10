const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getProfile, updateProfile, getStats } = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/stats', getStats);

module.exports = router;
