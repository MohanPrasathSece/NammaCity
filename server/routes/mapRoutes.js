const express = require('express');
const router = express.Router();
const {
  getMarkersInBounds,
  getNearbyMarkers,
  getMapCategories,
  updateUserLocation
} = require('../controllers/mapController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/markers', getMarkersInBounds);
router.get('/nearby', getNearbyMarkers);
router.get('/categories', getMapCategories);

// Protected routes
router.post('/location', protect, updateUserLocation);

module.exports = router;
