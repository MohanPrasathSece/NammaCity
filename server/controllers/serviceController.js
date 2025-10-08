const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');

// @desc    Get all services with filtering and pagination
// @route   GET /api/services
// @access  Public
exports.getServices = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build query
  let query = { isActive: true };
  
  if (req.query.category) {
    query.category = req.query.category;
  }
  
  if (req.query.city) {
    query['location.city'] = new RegExp(req.query.city, 'i');
  }
  
  if (req.query.verified) {
    query.isVerified = req.query.verified === 'true';
  }

  // Sort options
  let sortBy = {};
  if (req.query.sort) {
    const sortField = req.query.sort;
    const sortOrder = req.query.order === 'desc' ? -1 : 1;
    sortBy[sortField] = sortOrder;
  } else {
    sortBy = { 'rating.average': -1, createdAt: -1 };
  }

  const services = await Service.find(query)
    .populate('owner', 'name email')
    .sort(sortBy)
    .skip(skip)
    .limit(limit);

  const total = await Service.countDocuments(query);

  res.json({
    success: true,
    data: services,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get services by category
// @route   GET /api/services/category/:category
// @access  Public
exports.getServicesByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const services = await Service.find({ 
    category, 
    isActive: true 
  })
    .populate('owner', 'name')
    .sort({ 'rating.average': -1 })
    .skip(skip)
    .limit(limit);

  const total = await Service.countDocuments({ category, isActive: true });

  res.json({
    success: true,
    data: services,
    category,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get nearby services
// @route   GET /api/services/nearby
// @access  Public
exports.getNearbyServices = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 5000 } = req.query; // radius in meters

  if (!lat || !lng) {
    res.status(400);
    throw new Error('Latitude and longitude are required');
  }

  const services = await Service.find({
    isActive: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseInt(radius)
      }
    }
  })
    .populate('owner', 'name')
    .limit(50);

  res.json({
    success: true,
    data: services,
    count: services.length,
    center: { lat: parseFloat(lat), lng: parseFloat(lng) },
    radius: parseInt(radius)
  });
});

// @desc    Search services
// @route   GET /api/services/search
// @access  Public
exports.searchServices = asyncHandler(async (req, res) => {
  const { q, category, city, minRating } = req.query;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  let query = { isActive: true };

  // Text search
  if (q) {
    query.$or = [
      { name: new RegExp(q, 'i') },
      { description: new RegExp(q, 'i') },
      { tags: new RegExp(q, 'i') },
      { subcategory: new RegExp(q, 'i') }
    ];
  }

  // Filters
  if (category) query.category = category;
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (minRating) query['rating.average'] = { $gte: parseFloat(minRating) };

  const services = await Service.find(query)
    .populate('owner', 'name')
    .sort({ 'rating.average': -1, 'metadata.views': -1 })
    .skip(skip)
    .limit(limit);

  const total = await Service.countDocuments(query);

  res.json({
    success: true,
    data: services,
    searchQuery: q,
    filters: { category, city, minRating },
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get single service
// @route   GET /api/services/:id
// @access  Public
exports.getServiceById = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id)
    .populate('owner', 'name email phone');

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  // Increment view count
  service.metadata.views += 1;
  await service.save();

  res.json({
    success: true,
    data: service
  });
});

// @desc    Create new service
// @route   POST /api/services
// @access  Private (Business/Admin)
exports.createService = asyncHandler(async (req, res) => {
  const serviceData = {
    ...req.body,
    owner: req.user._id
  };

  const service = await Service.create(serviceData);

  res.status(201).json({
    success: true,
    data: service
  });
});

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private (Owner/Admin)
exports.updateService = asyncHandler(async (req, res) => {
  let service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  // Check ownership or admin
  if (service.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to update this service');
  }

  service = await Service.findByIdAndUpdate(
    req.params.id,
    { ...req.body, 'metadata.lastUpdated': Date.now() },
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: service
  });
});

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private (Admin)
exports.deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);

  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }

  await service.deleteOne();

  res.json({
    success: true,
    message: 'Service deleted successfully'
  });
});
