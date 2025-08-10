const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Journal = require('../models/Journal');
const Bookmark = require('../models/Bookmark');

// @desc    Get my profile
// @route   GET /api/user/profile
// @access  Private
exports.getProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: req.user });
});

// @desc    Update my profile
// @route   PUT /api/user/profile
// @access  Private
exports.updateProfile = asyncHandler(async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: user });
});

// @desc    Get quick stats (journal, bookmarks)
// @route   GET /api/user/stats
// @access  Private
exports.getStats = asyncHandler(async (req, res) => {
  const [entries, bookmarks] = await Promise.all([
    Journal.countDocuments({ user: req.user._id }),
    Bookmark.countDocuments({ user: req.user._id })
  ]);
  res.json({ success: true, data: { entries, bookmarks } });
});
