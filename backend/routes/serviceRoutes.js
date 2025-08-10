const express = require('express');
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  getNearbyServices,
  searchServices,
  getServicesByCategory
} = require('../controllers/serviceController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Public routes
router.get('/', getServices);
router.get('/search', searchServices);
router.get('/nearby', getNearbyServices);
router.get('/category/:category', getServicesByCategory);
router.get('/:id', getServiceById);

// Protected routes
router.post('/', protect, authorize('admin', 'business'), createService);
router.put('/:id', protect, authorize('admin', 'business'), updateService);
router.delete('/:id', protect, authorize('admin'), deleteService);

module.exports = router;
