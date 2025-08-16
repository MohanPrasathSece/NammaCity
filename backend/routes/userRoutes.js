const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { 
  getProfile, 
  updateProfile, 
  getStats, 
  uploadProfileImage, 
  deleteProfileImage 
} = require('../controllers/userController');

const router = express.Router();

router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/profile/upload-image', uploadProfileImage);
router.delete('/profile/image', deleteProfileImage);
router.get('/stats', getStats);

module.exports = router;
