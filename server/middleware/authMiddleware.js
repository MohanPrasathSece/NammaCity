const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');
let clerkClient, verifyToken; // Lazy import to avoid hard dependency
try {
  ({ clerkClient, verifyToken } = require('@clerk/clerk-sdk-node'));
} catch (e) {
  // Clerk not installed yet, will fall back to JWT
}

// Protect routes - prefers Clerk when configured, falls back to legacy JWT
exports.protect = asyncHandler(async (req, res, next) => {
  const auth = req.headers.authorization || '';
  const bearer = auth.startsWith('Bearer ') ? auth.split(' ')[1] : null;

  // Attempt Clerk verification if configured
  if (process.env.CLERK_SECRET_KEY && verifyToken && bearer) {
    try {
      const payload = await verifyToken(bearer, { secretKey: process.env.CLERK_SECRET_KEY });
      // payload.sub is Clerk user id
      let user = await User.findOne({ clerkUserId: payload.sub });
      if (!user) {
        // Attempt to fetch email/name from Clerk and create local record
        let email = null, name = 'Namma City User';
        try {
          const clerkUser = await clerkClient.users.getUser(payload.sub);
          email = clerkUser?.primaryEmailAddress?.emailAddress || clerkUser?.emailAddresses?.[0]?.emailAddress || null;
          name = clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : name;
        } catch {}
        user = await User.create({
          clerkUserId: payload.sub,
          name,
          email: email || `${payload.sub}@placeholder.local`,
          password: 'clerk-linked', // not used; schema allows optional
          isVerified: true
        });
      }
      req.user = user;
      return next();
    } catch (e) {
      // If Clerk check fails, fall back to legacy flow below
      console.warn('Clerk verification failed, falling back to JWT:', e.message);
    }
  }

  // Legacy JWT verification
  let token;
  if (auth && auth.startsWith('Bearer')) {
    try {
      token = bearer;
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }
      return next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401);
      throw new Error('Not authorized, token failed');
    }
  }

  res.status(401);
  throw new Error('Not authorized, no token');
});

// Authorize specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('Not authorized');
    }

    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error(`User role '${req.user.role}' is not authorized to access this route`);
    }

    next();
  };
};
