const asyncHandler = require('express-async-handler');
const Service = require('../models/Service');

// @desc    Get markers within bounding box
// @route   GET /api/map/markers
// @access  Public
const getMarkersInBounds = asyncHandler(async (req, res) => {
  const { 
    swLng, swLat, neLng, neLat, 
    categories, 
    limit = 50 
  } = req.query;

  // Validate bounding box coordinates
  if (!swLng || !swLat || !neLng || !neLat) {
    res.status(400);
    throw new Error('Bounding box coordinates are required (swLng, swLat, neLng, neLat)');
  }

  // Build query for geospatial search
  const query = {
    location: {
      $geoWithin: {
        $box: [
          [parseFloat(swLng), parseFloat(swLat)], // Southwest corner
          [parseFloat(neLng), parseFloat(neLat)]  // Northeast corner
        ]
      }
    },
    isActive: true
    // Support all Urban Aid categories
  };

  // Filter by subcategories if provided
  if (categories) {
    const categoryArray = categories.split(',').map(cat => cat.trim());
    query.subcategory = { $in: categoryArray };
  }

  try {
    const markers = await Service.find(query)
      .select('name description subcategory location contact timings priceRange images amenities specialOffers tags')
      .limit(parseInt(limit))
      .lean();

    // Transform data for map display
    const mapMarkers = markers.map(marker => ({
      id: marker._id,
      name: marker.name,
      description: marker.description,
      category: marker.subcategory,
      coordinates: marker.location.coordinates,
      address: marker.location.address,
      phone: marker.contact?.phone,
      priceRange: marker.priceRange,
      timings: marker.timings,
      amenities: marker.amenities,
      specialOffers: marker.specialOffers,
      image: marker.images?.[0]?.url,
      tags: marker.tags
    }));

    res.json({
      success: true,
      count: mapMarkers.length,
      markers: mapMarkers
    });

  } catch (error) {
    res.status(500);
    throw new Error('Error fetching markers: ' + error.message);
  }
});

// @desc    Get markers near a point
// @route   GET /api/map/nearby
// @access  Public
const getNearbyMarkers = asyncHandler(async (req, res) => {
  const { lng, lat, radius = 5000, categories, limit = 20 } = req.query;

  // Validate coordinates
  if (!lng || !lat) {
    res.status(400);
    throw new Error('Longitude and latitude are required');
  }

  // Build query for nearby search
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: parseInt(radius) // meters
      }
    },
    isActive: true
    // Support all Urban Aid categories
  };

  // Filter by subcategories if provided
  if (categories) {
    const categoryArray = categories.split(',').map(cat => cat.trim());
    query.subcategory = { $in: categoryArray };
  }

  try {
    const markers = await Service.find(query)
      .select('name description subcategory location contact timings priceRange images amenities specialOffers tags')
      .limit(parseInt(limit))
      .lean();

    // Transform data for map display with distance calculation
    const mapMarkers = markers.map(marker => {
      const distance = calculateDistance(
        parseFloat(lat), parseFloat(lng),
        marker.location.coordinates[1], marker.location.coordinates[0]
      );

      return {
        id: marker._id,
        name: marker.name,
        description: marker.description,
        category: marker.subcategory,
        coordinates: marker.location.coordinates,
        address: marker.location.address,
        phone: marker.contact?.phone,
        priceRange: marker.priceRange,
        timings: marker.timings,
        amenities: marker.amenities,
        specialOffers: marker.specialOffers,
        image: marker.images?.[0]?.url,
        tags: marker.tags,
        distance: Math.round(distance)
      };
    });

    res.json({
      success: true,
      count: mapMarkers.length,
      userLocation: { lng: parseFloat(lng), lat: parseFloat(lat) },
      markers: mapMarkers
    });

  } catch (error) {
    res.status(500);
    throw new Error('Error fetching nearby markers: ' + error.message);
  }
});

// @desc    Get all available categories
// @route   GET /api/map/categories
// @access  Public
const getMapCategories = asyncHandler(async (req, res) => {
  try {
    const categories = await Service.distinct('category', { 
      isActive: true
    });

    // Map categories to display format with colors and emojis for Urban Aid
    const categoryMap = {
      'Free Food': { emoji: '🍽️', color: '#FF6B6B', description: 'Free meals and food distribution' },
      'Night Shelter': { emoji: '🏠', color: '#4ECDC4', description: 'Safe overnight accommodation' },
      'Public Restrooms': { emoji: '🚻', color: '#45B7D1', description: 'Clean public facilities' },
      'Study Zones': { emoji: '📚', color: '#96CEB4', description: 'Quiet study spaces with WiFi' },
      'Healthcare': { emoji: '🏥', color: '#E74C3C', description: 'Medical facilities and clinics' },
      'Water Points': { emoji: '💧', color: '#3498DB', description: 'Clean drinking water' }
    };

    const formattedCategories = categories.map(cat => ({
      id: cat.toLowerCase().replace(/\s+/g, '-'),
      name: cat,
      emoji: categoryMap[cat]?.emoji || '🍴',
      color: categoryMap[cat]?.color || '#FF6700',
      description: categoryMap[cat]?.description || 'Food Options'
    }));

    res.json({
      success: true,
      categories: formattedCategories
    });

  } catch (error) {
    res.status(500);
    throw new Error('Error fetching categories: ' + error.message);
  }
});

// @desc    Update user location (optional for live tracking)
// @route   POST /api/map/location
// @access  Private
const updateUserLocation = asyncHandler(async (req, res) => {
  const { lng, lat, accuracy } = req.body;

  // Validate coordinates
  if (!lng || !lat) {
    res.status(400);
    throw new Error('Longitude and latitude are required');
  }

  // In a real app, you might store this in a UserLocation model
  // For now, we'll just acknowledge the update
  const locationData = {
    userId: req.user?.id || 'anonymous',
    coordinates: [parseFloat(lng), parseFloat(lat)],
    accuracy: accuracy || null,
    timestamp: new Date()
  };

  // TODO: Store in database if needed for live user tracking
  console.log('User location updated:', locationData);

  res.json({
    success: true,
    message: 'Location updated successfully',
    location: locationData
  });
});

// Helper function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

module.exports = {
  getMarkersInBounds,
  getNearbyMarkers,
  getMapCategories,
  updateUserLocation
};
