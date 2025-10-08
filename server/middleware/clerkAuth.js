const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

// This middleware authenticates requests and attaches the session to req.auth.
// If the user is not authenticated, it will throw a 401 error.
const clerkAuth = ClerkExpressWithAuth();

module.exports = { clerkAuth };
