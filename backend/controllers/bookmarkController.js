const asyncHandler = require('express-async-handler');
const Bookmark = require('../models/Bookmark');

// @desc Get my bookmarks
// @route GET /api/bookmarks/my
exports.getMyBookmarks = asyncHandler(async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id }).populate('service');
  res.json({ success: true, data: bookmarks });
});

// @desc Add bookmark
// @route POST /api/bookmarks/:serviceId
exports.addBookmark = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const bookmark = await Bookmark.create({ user: req.user._id, service: serviceId });
  res.status(201).json({ success: true, data: bookmark });
});

// @desc Remove bookmark
// @route DELETE /api/bookmarks/:serviceId
exports.removeBookmark = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  await Bookmark.findOneAndDelete({ user: req.user._id, service: serviceId });
  res.json({ success: true, message: 'Bookmark removed' });
});
