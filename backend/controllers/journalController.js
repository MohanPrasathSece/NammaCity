const asyncHandler = require('express-async-handler');
const Journal = require('../models/Journal');

// @desc    Get my journal entries
// @route   GET /api/journals/my
// @access  Private
exports.getMyJournals = asyncHandler(async (req, res) => {
  const journals = await Journal.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: journals });
});

// @desc    Create new entry
// @route   POST /api/journals
// @access  Private
exports.createJournal = asyncHandler(async (req, res) => {
  const { mood, title, content } = req.body;
  if (!content) {
    res.status(400);
    throw new Error('Content is required');
  }
  const entry = await Journal.create({ user: req.user._id, mood, title, content });
  res.status(201).json({ success: true, data: entry });
});

// @desc    Update entry
// @route   PUT /api/journals/:id
// @access  Private
exports.updateJournal = asyncHandler(async (req, res) => {
  const entry = await Journal.findOne({ _id: req.params.id, user: req.user._id });
  if (!entry) {
    res.status(404);
    throw new Error('Entry not found');
  }
  const { mood, title, content } = req.body;
  if (mood) entry.mood = mood;
  if (title) entry.title = title;
  if (content) entry.content = content;
  await entry.save();
  res.json({ success: true, data: entry });
});

// @desc    Delete entry
// @route   DELETE /api/journals/:id
// @access  Private
exports.deleteJournal = asyncHandler(async (req, res) => {
  const entry = await Journal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!entry) {
    res.status(404);
    throw new Error('Entry not found');
  }
  res.json({ success: true, message: 'Entry removed' });
});
