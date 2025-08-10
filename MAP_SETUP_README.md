# Urban Aid - Snapchat-Style Interactive Map

A full-featured interactive map page for the Urban Aid React Progressive Web App with Snapchat-like cartoon styling, featuring real-time GPS location, multiple service categories, and smooth animations.

## 🌟 Features

### Frontend Features
- **Snapchat-like Cartoon UI**: Dark-themed map with bright, playful colors and smooth animations
- **Real-time GPS Location**: User's current location with animated pulsing marker
- **Interactive Service Categories**:
  - 🍽️ Free Food - Community kitchens and food distribution
  - 🏠 Night Shelter - Safe overnight accommodation
  - 🚻 Public Restrooms - Clean public facilities
  - 📚 Study Zones - Quiet study spaces with WiFi
  - 🏥 Healthcare - Medical facilities
  - 💧 Water Points - Clean drinking water
- **Interactive Marker Info Cards**: Floating cards with place details and navigation
- **Filter Bar**: Horizontal pill-style filters to toggle category visibility
- **Locate Me Button**: Recenter map on user's current position
- **Responsive Design**: Optimized for mobile devices (6-7 inch screens)
- **Bottom Navigation**: Snapchat-style navigation between app sections

### Backend Features
- **RESTful API Endpoints**: Efficient marker data serving with geospatial queries
- **MongoDB Integration**: Geospatial indexing for location-based searches
- **Category Management**: Dynamic category filtering and management
- **User Location Tracking**: Optional real-time location updates
- **Scalable Architecture**: Built for performance with caching support

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- Mapbox account (for map tiles)

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Set up environment variables
cp env .env

# Update .env with your MongoDB URI and other settings
# MONGO_URI=mongodb://localhost:27017/urban-aid
# PORT=3000
# JWT_SECRET=your-jwt-secret

# Seed the map data
node seeders/mapDataSeeder.js

# Start the backend server
npm run dev
```

### 2. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend-web

# Install dependencies
npm install

# Update MapPage.jsx with your Mapbox token
# Replace 'pk.eyJ1IjoidXJiYW5haWQiLCJhIjoiY2x0ZXN0MTIzNDU2Nzg5MCJ9.example-token-replace-with-real-one'
# with your actual Mapbox access token

# Start the development server
npm run dev
```

### 3. Get Your Mapbox Token

1. Sign up at [Mapbox](https://www.mapbox.com/)
2. Go to your [Account page](https://account.mapbox.com/)
3. Copy your default public token
4. Replace the token in `frontend-web/src/pages/MapPage.jsx`

## 📱 Usage

1. **Access the Map**: Navigate to `/map` or click the Maps tab in the bottom navigation
2. **View Your Location**: Allow location permissions to see your current position
3. **Filter Services**: Use the horizontal filter bar to show/hide different service categories
4. **Explore Markers**: Tap on any marker to see detailed information
5. **Navigate**: Click the orange "Navigate" button to open directions in Google Maps
6. **Recenter**: Use the floating "Locate Me" button to return to your current location

## 🎨 Customization

### Map Styling
The map uses a custom dark theme that mimics Snapchat's Snap Map. You can customize:
- Colors in `MapPage.css`
- Marker icons and colors in `MapPage.jsx`
- Animation timings and effects

### Adding New Categories
1. Update the categories array in `MapPage.jsx`
2. Add corresponding data in `mapDataSeeder.js`
3. Update the `getMarkerIcon()` and `getMarkerColor()` functions

### Custom Markers
Markers are created dynamically with:
- Category-specific colors
- Emoji icons
- Pulsing animations
- Click interactions

## 🗂️ File Structure

```
├── backend/
│   ├── controllers/mapController.js    # Map API logic
│   ├── routes/mapRoutes.js            # Map endpoints
│   ├── seeders/mapDataSeeder.js       # Demo data seeder
│   └── models/Service.js              # Service data model
├── frontend-web/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── MapPage.jsx           # Main map component
│   │   │   └── MapPage.css           # Snapchat-style styling
│   │   ├── components/
│   │   │   ├── Navigation.jsx        # Bottom navigation
│   │   │   └── Navigation.css        # Navigation styling
│   │   └── App.jsx                   # Main app component
│   └── package.json                  # Frontend dependencies
```

## 🔧 API Endpoints

### Public Endpoints
- `GET /api/map/markers` - Get markers within bounding box
- `GET /api/map/nearby` - Get markers near a point
- `GET /api/map/categories` - Get available categories

### Protected Endpoints
- `POST /api/map/location` - Update user location

### Example API Usage

```javascript
// Get markers in viewport
const response = await fetch('/api/map/markers?swLng=76.9&swLat=11.0&neLng=77.0&neLat=11.1');
const data = await response.json();

// Get nearby markers
const nearby = await fetch('/api/map/nearby?lng=76.9558&lat=11.0168&radius=5000');
const nearbyData = await nearby.json();
```

## 🎯 Key Components

### MapPage.jsx
- Mapbox GL JS integration
- Real-time location tracking
- Interactive markers and popups
- Category filtering
- Responsive design

### Navigation.jsx
- Bottom navigation bar
- Smooth animations with Framer Motion
- Active state management
- Mobile-optimized

### mapController.js
- Geospatial queries
- Category management
- Location-based search
- Data transformation

## 🚀 Deployment

### Frontend Deployment
```bash
cd frontend-web
npm run build
# Deploy the dist/ folder to your hosting service
```

### Backend Deployment
```bash
cd backend
# Set production environment variables
# Deploy to your preferred hosting service (Heroku, Railway, etc.)
```

## 🔍 Troubleshooting

### Common Issues

1. **Map not loading**: Check your Mapbox token
2. **Location not working**: Ensure HTTPS in production
3. **Markers not appearing**: Verify backend is running and seeded
4. **Styling issues**: Check CSS browser compatibility

### Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is part of the Urban Aid application. Please refer to the main project license.

## 🙏 Acknowledgments

- Mapbox for mapping services
- Framer Motion for animations
- MongoDB for geospatial capabilities
- The Urban Aid team for the vision

---

**Note**: This implementation provides a solid foundation for a Snapchat-style map interface. For production use, consider adding error boundaries, offline support, and additional accessibility features.
