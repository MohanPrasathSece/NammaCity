const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const weatherRoutes = require('./routes/weatherRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

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
app.use(express.json());

// Serve static files
app.use('/images', express.static('public/images'));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/services', require('./routes/serviceRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/map', require('./routes/mapRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));

// Test route
app.get('/api', (req, res) => {
  res.json({ message: 'Welcome to Urban Aid API' });
});

// Error Handler - must be last middleware
app.use(errorHandler);
