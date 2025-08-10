const express = require('express');
const {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBookingStatus,
  cancelBooking,
  getServiceBookings
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes are protected
router.use(protect);

// User routes
router.post('/', createBooking);
router.get('/my-bookings', getUserBookings);
router.get('/:id', getBookingById);
router.put('/:id/cancel', cancelBooking);

// Business/Admin routes
router.get('/service/:serviceId', authorize('business', 'admin'), getServiceBookings);
router.put('/:id/status', authorize('business', 'admin'), updateBookingStatus);

module.exports = router;
