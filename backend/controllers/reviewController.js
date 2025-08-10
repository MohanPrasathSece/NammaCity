const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');
const Service = require('../models/Service');

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
exports.createReview = asyncHandler(async (req, res) => {
  const { serviceId, rating, title, comment, images } = req.body;

  // Check if service exists
  const service = await Service.findById(serviceId);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  // Check if user already reviewed this service
  const existingReview = await Review.findOne({
    service: serviceId,
    user: req.user._id
  });

  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this service');
  }

  // Create review
  const review = await Review.create({
    service: serviceId,
    user: req.user._id,
    rating,
    title,
    comment,
    images: images || []
  });

  // Update service rating
  await updateServiceRating(serviceId);

  await review.populate([
    { path: 'user', select: 'name' },
    { path: 'service', select: 'name' }
  ]);

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Get reviews for a service
// @route   GET /api/reviews/service/:serviceId
// @access  Public
exports.getServiceReviews = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  let sortBy = { createdAt: -1 };
  if (req.query.sort === 'rating') {
    sortBy = { rating: req.query.order === 'asc' ? 1 : -1 };
  } else if (req.query.sort === 'helpful') {
    sortBy = { helpful: -1 };
  }

  const reviews = await Review.find({ service: serviceId })
    .populate('user', 'name')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ service: serviceId });

  // Get rating distribution
  const ratingStats = await Review.aggregate([
    { $match: { service: serviceId } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    },
    ratingStats
  });
});

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
exports.getUserReviews = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const reviews = await Review.find({ user: req.user._id })
    .populate('service', 'name category images')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Review.countDocuments({ user: req.user._id });

  res.json({
    success: true,
    data: reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
exports.updateReview = asyncHandler(async (req, res) => {
  const { rating, title, comment, images } = req.body;

  let review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user owns the review
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this review');
  }

  review = await Review.findByIdAndUpdate(
    req.params.id,
    { rating, title, comment, images },
    { new: true, runValidators: true }
  ).populate('user', 'name');

  // Update service rating if rating changed
  await updateServiceRating(review.service);

  res.json({
    success: true,
    data: review
  });
});

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user owns the review
  if (review.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this review');
  }

  const serviceId = review.service;
  await review.deleteOne();

  // Update service rating
  await updateServiceRating(serviceId);

  res.json({
    success: true,
    message: 'Review deleted successfully'
  });
});

// @desc    Mark review as helpful
// @route   POST /api/reviews/:id/helpful
// @access  Private
exports.markHelpful = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }

  // Check if user already marked as helpful
  const alreadyMarked = review.helpful.find(
    item => item.user.toString() === req.user._id.toString()
  );

  if (alreadyMarked) {
    // Remove helpful mark
    review.helpful = review.helpful.filter(
      item => item.user.toString() !== req.user._id.toString()
    );
  } else {
    // Add helpful mark
    review.helpful.push({ user: req.user._id });
  }

  await review.save();

  res.json({
    success: true,
    data: review,
    message: alreadyMarked ? 'Removed helpful mark' : 'Marked as helpful'
  });
});

// Helper function to update service rating
const updateServiceRating = async (serviceId) => {
  const stats = await Review.aggregate([
    { $match: { service: serviceId } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Service.findByIdAndUpdate(serviceId, {
      'rating.average': Math.round(stats[0].averageRating * 10) / 10,
      'rating.count': stats[0].totalReviews
    });
  } else {
    await Service.findByIdAndUpdate(serviceId, {
      'rating.average': 0,
      'rating.count': 0
    });
  }
};
