const Issue = require('../models/Issue');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all issues
// @route   GET /api/issues
// @access  Public
exports.getIssues = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc    Get single issue
// @route   GET /api/issues/:id
// @access  Public
exports.getIssue = asyncHandler(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id).populate('reportedBy', 'name');

  if (!issue) {
    return next(new ErrorResponse(`Issue not found with id of ${req.params.id}`, 404));
  }

  res.status(200).json({ success: true, data: issue });
});

// @desc    Create new issue
// @route   POST /api/issues
// @access  Private
exports.createIssue = asyncHandler(async (req, res, next) => {
  req.body.reportedBy = req.user.id;

  // Placeholder for AI-based image verification
  // const aiResult = await verifyImage(req.file.path);
  // if (aiResult.confidence < 0.7) {
  //   return next(new ErrorResponse('Could not verify the issue from the image.', 400));
  // }

  const issue = await Issue.create(req.body);

  // Gamification: Award points for reporting an issue
  // We will add this logic when we implement the gamification feature.

  res.status(201).json({
    success: true,
    data: issue,
  });
});

// @desc    Update issue
// @route   PUT /api/issues/:id
// @access  Private (Admin or reporter)
exports.updateIssue = asyncHandler(async (req, res, next) => {
  let issue = await Issue.findById(req.params.id);

  if (!issue) {
    return next(new ErrorResponse(`Issue not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is the issue reporter or an admin
  if (issue.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this issue`, 401));
  }

  issue = await Issue.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, data: issue });
});

// @desc    Delete issue
// @route   DELETE /api/issues/:id
// @access  Private (Admin or reporter)
exports.deleteIssue = asyncHandler(async (req, res, next) => {
  const issue = await Issue.findById(req.params.id);

  if (!issue) {
    return next(new ErrorResponse(`Issue not found with id of ${req.params.id}`, 404));
  }

  // Make sure user is the issue reporter or an admin
  if (issue.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to delete this issue`, 401));
  }

  await issue.remove();

  res.status(200).json({ success: true, data: {} });
});
