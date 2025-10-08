const express = require('express');
const router = express.Router();
const { handleClerkWebhook } = require('../controllers/webhookController');

// Use express.raw for webhook signature verification
router.post('/clerk', express.raw({ type: 'application/json' }), handleClerkWebhook);

module.exports = router;
