const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Journal = require('../models/Journal');
const Bookmark = require('../models/Bookmark');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../public/uploads/profiles');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: userId_timestamp.extension
    const uniqueName = `${req.user._id}_${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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
  const { name, fullName, email, phone, bio, avatar } = req.body;
  
  // Validate required fields
  if (!name && !fullName) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name or full name is required' 
    });
  }

  // Check if email is already taken by another user
  if (email && email !== req.user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: req.user._id } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already registered with another account' 
      });
    }
  }

  // Prepare update object
  const updateData = {};
  
  if (name) updateData.name = name.trim();
  if (fullName) updateData.fullName = fullName.trim();
  if (email) updateData.email = email.toLowerCase().trim();
  if (phone) updateData.phone = phone.trim();
  
  // Update profile nested fields
  if (bio !== undefined || avatar !== undefined) {
    updateData.profile = { ...req.user.profile };
    if (bio !== undefined) updateData.profile.bio = bio.trim();
    if (avatar !== undefined) updateData.profile.avatar = avatar;
  }

  try {
    const user = await User.findByIdAndUpdate(
      req.user._id, 
      updateData, 
      { 
        new: true, 
        runValidators: true,
        select: '-password' // Exclude password from response
      }
    );

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Profile updated successfully',
      data: user 
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        success: false, 
        message: 'Validation error',
        errors 
      });
    }
    throw error;
  }
});

// @desc    Upload profile image
// @route   POST /api/user/profile/upload-image
// @access  Private
exports.uploadProfileImage = [
  upload.single('avatar'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    // Delete old profile image if exists
    if (req.user.profile && req.user.profile.avatar) {
      const oldImagePath = path.join(__dirname, '../public', req.user.profile.avatar);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Update user with new avatar path
    const avatarUrl = `/uploads/profiles/${req.file.filename}`;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          'profile.avatar': avatarUrl
        }
      },
      { new: true, select: '-password' }
    );

    res.json({
      success: true,
      message: 'Profile image uploaded successfully',
      data: {
        avatar: avatarUrl,
        user: user
      }
    });
  })
];

// @desc    Delete profile image
// @route   DELETE /api/user/profile/image
// @access  Private
exports.deleteProfileImage = asyncHandler(async (req, res) => {
  if (req.user.profile && req.user.profile.avatar) {
    // Delete image file
    const imagePath = path.join(__dirname, '../public', req.user.profile.avatar);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    // Update user to remove avatar
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $unset: {
          'profile.avatar': 1
        }
      },
      { new: true, select: '-password' }
    );

    res.json({
      success: true,
      message: 'Profile image deleted successfully',
      data: user
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'No profile image to delete'
    });
  }
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
