const asyncHandler = require('express-async-handler');
const Booking = require('../models/Booking');
const Service = require('../models/Service');

// @desc    Create new booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = asyncHandler(async (req, res) => {
  const { serviceId, scheduledDate, scheduledTime, ...bookingData } = req.body;

  // Check if service exists
  const service = await Service.findById(serviceId);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  // Check if service is active
  if (!service.isActive) {
    res.status(400);
    throw new Error('Service is currently unavailable');
  }

  // Create booking
  const booking = await Booking.create({
    user: req.user._id,
    service: serviceId,
    scheduledDate,
    scheduledTime,
    ...bookingData
  });

  await booking.populate([
    { path: 'service', select: 'name category location contact' },
    { path: 'user', select: 'name email phone' }
  ]);

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Get user's bookings
// @route   GET /api/bookings/my-bookings
// @access  Private
exports.getUserBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let query = { user: req.user._id };
  
  if (req.query.status) {
    query.status = req.query.status;
  }

  const bookings = await Booking.find(query)
    .populate('service', 'name category location images rating')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments(query);

  res.json({
    success: true,
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('service', 'name category location contact images rating')
    .populate('user', 'name email phone');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if user owns the booking or is admin/business owner
  if (booking.user._id.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin' && 
      req.user.role !== 'business') {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Update booking status
// @route   PUT /api/bookings/:id/status
// @access  Private (Business/Admin)
exports.updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  
  const booking = await Booking.findById(req.params.id)
    .populate('service', 'owner');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if user is service owner or admin
  if (booking.service.owner.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this booking');
  }

  booking.status = status;
  await booking.save();

  await booking.populate([
    { path: 'service', select: 'name category location' },
    { path: 'user', select: 'name email phone' }
  ]);

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
exports.cancelBooking = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if user owns the booking
  if (booking.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  // Check if booking can be cancelled
  if (booking.status === 'cancelled' || booking.status === 'completed') {
    res.status(400);
    throw new Error('Booking cannot be cancelled');
  }

  booking.status = 'cancelled';
  booking.cancellation = {
    reason: reason || 'Cancelled by user',
    cancelledBy: 'user',
    cancelledAt: new Date()
  };

  await booking.save();

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: booking
  });
});

// @desc    Get service bookings
// @route   GET /api/bookings/service/:serviceId
// @access  Private (Business/Admin)
exports.getServiceBookings = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Check if service exists and user owns it
  const service = await Service.findById(serviceId);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  if (service.owner.toString() !== req.user._id.toString() && 
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view these bookings');
  }

  let query = { service: serviceId };
  
  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.date) {
    const startDate = new Date(req.query.date);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    query.scheduledDate = { $gte: startDate, $lt: endDate };
  }

  const bookings = await Booking.find(query)
    .populate('user', 'name email phone')
    .sort({ scheduledDate: 1, scheduledTime: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Booking.countDocuments(query);

  res.json({
    success: true,
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});
