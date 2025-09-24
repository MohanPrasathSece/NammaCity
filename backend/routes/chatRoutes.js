const express = require('express');
const router = express.Router();
const { chatWithBot } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Public health endpoint to verify env configuration
router.get('/health', (req, res) => {
  const model = process.env.HF_MODEL || 'tiiuae/falcon-7b-instruct';
  const hasKey = Boolean(process.env.HUGGINGFACE_API_KEY && process.env.HUGGINGFACE_API_KEY.trim());
  res.json({ model, hasKey });
});

// Protected chat endpoint
router.post('/', protect, chatWithBot);

module.exports = router;
