const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const connectDB = require('./config/db');
const serviceRoutes = require('./routes/serviceRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const issueRoutes = require('./routes/issueRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');
const { clerkAuth } = require('./middleware/clerkAuth');
const safetyRoutes = require('./routes/safetyRoutes');
const accessibilityRoutes = require('./routes/accessibilityRoutes');
const webhookRoutes = require('./routes/webhookRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Warn if HF key is not configured (helps diagnose 500 errors on /api/chat)
if (!process.env.HUGGINGFACE_API_KEY) {
  console.warn('[WARN] HUGGINGFACE_API_KEY is not set. The /api/chat endpoint will return 500 until it is configured.');
}

// Connect to DB
connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'],
  credentials: true
}));
// Mount webhooks BEFORE json parser to preserve raw body for signature verification
app.use('/api/webhooks', webhookRoutes);
app.use(express.json());

// Serve static files
app.use('/images', express.static('public/images'));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
// Public routes
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/map', require('./routes/mapRoutes'));

// Protected routes
app.use('/api/user', clerkAuth, require('./routes/userRoutes'));
app.use('/api/chat', clerkAuth, require('./routes/chatRoutes'));
app.use('/api/safety', clerkAuth, safetyRoutes);
app.use('/api/accessibility', clerkAuth, accessibilityRoutes);
app.use('/api/issues', clerkAuth, issueRoutes);

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Namma City API' });
});

// Error Handler - must be last middleware
app.use(errorHandler);
