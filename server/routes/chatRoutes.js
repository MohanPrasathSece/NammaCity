const express = require('express');
const router = express.Router();
const { chatWithBot } = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Public health endpoint to verify chat service
router.get('/health', (req, res) => {
  res.json({ 
    status: 'active',
    service: 'Free Namma City Assistant',
    features: ['Coimbatore local info', 'Service recommendations', 'Emergency contacts']
  });
});

// Protected chat endpoint
router.post('/', protect, chatWithBot);

module.exports = router;
