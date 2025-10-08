const express = require('express');
const { getCurrentWeather, getWeatherForecast } = require('../controllers/weatherController');

const router = express.Router();

// Public routes
router.get('/current', getCurrentWeather);
router.get('/forecast', getWeatherForecast);

module.exports = router;
