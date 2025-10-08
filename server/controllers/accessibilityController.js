const AccessibilityReport = require('../models/AccessibilityReport');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// GET /api/accessibility
exports.getReports = asyncHandler(async (req, res) => {
  const { lat, lng, radius = 3000, status, type } = req.query;
  let query = {};
  if (status) query.status = status;
  if (type) query.issueType = type;

  if (lat && lng) {
    query.location = {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseInt(radius)
      }
    };
  }

  const data = await AccessibilityReport.find(query).limit(200);
  res.json({ success: true, count: data.length, data });
});

// GET /api/accessibility/:id
exports.getReport = asyncHandler(async (req, res, next) => {
  const doc = await AccessibilityReport.findById(req.params.id);
  if (!doc) return next(new ErrorResponse('Report not found', 404));
  res.json({ success: true, data: doc });
});

// POST /api/accessibility (protected)
exports.createReport = asyncHandler(async (req, res) => {
  const body = { ...req.body, reportedBy: req.user._id };
  const doc = await AccessibilityReport.create(body);
  res.status(201).json({ success: true, data: doc });
});

// PUT /api/accessibility/:id (protected)
exports.updateReport = asyncHandler(async (req, res, next) => {
  let doc = await AccessibilityReport.findById(req.params.id);
  if (!doc) return next(new ErrorResponse('Report not found', 404));
  if (doc.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 401));
  }
  doc = await AccessibilityReport.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  res.json({ success: true, data: doc });
});

// DELETE /api/accessibility/:id (protected)
exports.deleteReport = asyncHandler(async (req, res, next) => {
  const doc = await AccessibilityReport.findById(req.params.id);
  if (!doc) return next(new ErrorResponse('Report not found', 404));
  if (doc.reportedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 401));
  }
  await doc.remove();
  res.json({ success: true, data: {} });
});
