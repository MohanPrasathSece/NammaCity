const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
exports.signup = asyncHandler(async (req, res) => {
  console.log('📝 Signup request received:', { body: req.body });
  const { name, email, password, phone } = req.body;
  
  // Validate required fields
  if (!name || !email || !password) {
    const error = 'Please provide name, email and password';
    console.log('❌ Validation error:', error);
    res.status(400);
    throw new Error(error);
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = 'Please provide a valid email address';
    console.log('❌ Validation error:', error);
    res.status(400);
    throw new Error(error);
  }

  // If phone is provided, validate it
  if (phone && phone.trim() !== '') {
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      const error = 'Please provide a valid 10-digit phone number or leave it empty';
      console.log('❌ Validation error:', error);
      res.status(400);
      throw new Error(error);
    }
  }

  try {
    // Check if user with email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      const error = 'User with this email already exists';
      console.log('❌ User exists:', error);
      res.status(400);
      throw new Error(error);
    }

    // Prepare user data with only the fields we want to save
    const userData = { 
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: password,
      // Explicitly set phone to null if not provided
      phone: phone && phone.trim() !== '' ? phone.trim() : null
    };
    
    console.log('🔧 User data to be saved:', JSON.stringify(userData, null, 2));

    console.log('🔧 Creating user with data:', JSON.stringify(userData, null, 2));
    
    const user = await User.create(userData);
    console.log('✅ User created successfully:', user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('🔥 Error during user creation:', error);
    res.status(500);
    throw new Error('Failed to create user. ' + error.message);
  }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});
