const SafetyAlert = require('../models/SafetyAlert');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// GET /api/safety
exports.getAlerts = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 3000, status, type } = req.query;
  let query = {};
  if (status) query.status = status;
  if (type) query.alertType = type;

  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(radius)
      }
    };
  }

  const data = await SafetyAlert.find(query).limit(200);
  res.json({ success: true, count: data.length, data });
});

// GET /api/safety/:id
exports.getAlert = asyncHandler(async (req, res, next) => {
  const doc = await SafetyAlert.findById(req.params.id);
  if (!doc) return next(new ErrorResponse('Alert not found', 404));
  res.json({ success: true, data: doc });
});

// POST /api/safety (protected)
exports.createAlert = asyncHandler(async (req, res) => {
  const body = { ...req.body, reportedBy: req.user._id };
  const doc = await SafetyAlert.create(body);
  res.status(201).json({ success: true, data: doc });
});

// PUT /api/safety/:id (protected)
exports.updateAlert = asyncHandler(async (req, res, next) => {
  let doc = await SafetyAlert.findById(req.params.id);
  if (!doc) return next(new ErrorResponse('Alert not found', 404));
  // owner or admin only
  if (doc.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 401));
  }
  doc = await SafetyAlert.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: doc });
});

// DELETE /api/safety/:id (protected)
exports.deleteAlert = asyncHandler(async (req, res, next) => {
  const doc = await SafetyAlert.findById(req.params.id);
  if (!doc) return next(new ErrorResponse('Alert not found', 404));
  if (doc.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 401));
  }
  await doc.remove();
  res.json({ success: true, data: {} });
});
