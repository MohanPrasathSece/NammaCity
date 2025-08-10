const asyncHandler = require('express-async-handler');
const axios = require('axios');

const WEATHER_API_KEY = 'e725cfaf29f260f6f0b9cb4393c43520';
const COIMBATORE_COORDS = { lat: 11.0168, lon: 76.9558 };

// Mock weather data for Coimbatore (fallback)
const mockWeatherData = {
  location: {
    name: 'Coimbatore',
    region: 'Tamil Nadu',
    country: 'India',
    lat: 11.0168,
    lon: 76.9558,
    timezone: 'Asia/Kolkata'
  },
  current: {
    temperature: 28,
    condition: 'Partly Cloudy',
    icon: '⛅',
    humidity: 65,
    windSpeed: 12,
    feelsLike: 31,
    uvIndex: 6,
    visibility: 10,
    pressure: 1013,
    lastUpdated: new Date().toISOString()
  },
  forecast: [
    {
      date: new Date().toISOString().split('T')[0],
      day: 'Today',
      high: 32,
      low: 24,
      condition: 'Partly Cloudy',
      icon: '⛅',
      humidity: 65,
      chanceOfRain: 20
    },
    {
      date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      day: 'Tomorrow',
      high: 30,
      low: 23,
      condition: 'Sunny',
      icon: '☀️',
      humidity: 60,
      chanceOfRain: 10
    },
    {
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      day: 'Day After',
      high: 29,
      low: 22,
      condition: 'Light Rain',
      icon: '🌦️',
      humidity: 80,
      chanceOfRain: 70
    }
  ]
};

// @desc    Get current weather for Coimbatore
// @route   GET /api/weather/current
// @access  Public
exports.getCurrentWeather = asyncHandler(async (req, res) => {
  const { lat = COIMBATORE_COORDS.lat, lng = COIMBATORE_COORDS.lon } = req.query;
  
  try {
    // Call OpenWeatherMap API
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${WEATHER_API_KEY}&units=metric`
    );

    const data = response.data;
    
    // Map weather condition to emoji
    const getWeatherIcon = (condition, isDay) => {
      const conditionMap = {
        'clear sky': isDay ? '☀️' : '🌙',
        'few clouds': '🌤️',
        'scattered clouds': '⛅',
        'broken clouds': '☁️',
        'shower rain': '🌦️',
        'rain': '🌧️',
        'thunderstorm': '⛈️',
        'snow': '❄️',
        'mist': '🌫️',
        'haze': '🌫️',
        'fog': '🌫️'
      };
      
      const description = data.weather[0].description.toLowerCase();
      return conditionMap[description] || (isDay ? '☀️' : '🌙');
    };

    // Determine if it's day or night
    const now = Date.now() / 1000;
    const isDay = now > data.sys.sunrise && now < data.sys.sunset;

    const weatherData = {
      location: {
        name: data.name,
        region: 'Tamil Nadu',
        country: data.sys.country,
        lat: data.coord.lat,
        lon: data.coord.lon,
        timezone: 'Asia/Kolkata'
      },
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].description,
      icon: getWeatherIcon(data.weather[0].description, isDay),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
      feelsLike: Math.round(data.main.feels_like),
      uvIndex: 0, // Not available in free tier
      visibility: data.visibility ? Math.round(data.visibility / 1000) : 10,
      pressure: data.main.pressure,
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: weatherData
    });

  } catch (error) {
    console.error('OpenWeatherMap API Error:', error.message);
    
    // Fallback to mock data if API fails
    const weatherData = {
      ...mockWeatherData.current,
      location: mockWeatherData.location,
      timestamp: new Date().toISOString()
    };

    // Add some variation to mock data
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) {
      weatherData.condition = 'Morning Mist';
      weatherData.icon = '🌫️';
    } else if (hour >= 12 && hour < 16) {
      weatherData.condition = 'Sunny';
      weatherData.icon = '☀️';
      weatherData.temperature += 2;
    } else if (hour >= 18 && hour < 22) {
      weatherData.condition = 'Clear Evening';
      weatherData.icon = '🌅';
    } else if (hour >= 22 || hour < 6) {
      weatherData.condition = 'Clear Night';
      weatherData.icon = '🌙';
      weatherData.temperature -= 3;
    }

    res.json({
      success: true,
      data: weatherData,
      fallback: true
    });
  }
});

// @desc    Get weather forecast
// @route   GET /api/weather/forecast
// @access  Public
exports.getWeatherForecast = asyncHandler(async (req, res) => {
  const { days = 3 } = req.query;
  
  const forecast = mockWeatherData.forecast.slice(0, parseInt(days));
  
  res.json({
    success: true,
    data: {
      location: mockWeatherData.location,
      forecast,
      lastUpdated: new Date().toISOString()
    }
  });
});
