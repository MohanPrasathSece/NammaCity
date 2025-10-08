# Namma City Backend API

A comprehensive backend service for the Namma City urban aid application, providing services for restaurants, hotels, utilities, education, and healthcare in Coimbatore.

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (local or cloud)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB connection string

# Seed sample data
npm run seed

# Start development server
npm run dev
```

## 📊 Sample Data

The seeder creates:
- **5 Users** (1 admin, 2 regular users, 2 business owners)
- **6 Services** (restaurants, hotels, utilities, education, healthcare)
- **3 Reviews** with ratings
- **2 Bookings** (reservation & appointment)

### Login Credentials
```
Admin: admin@namacity.com / admin123
User 1: rajesh@gmail.com / user123
User 2: priya@gmail.com / user123
Business 1: paradise@hotel.com / business123
Business 2: owner@restaurant.com / business123
```

## 🛠 API Endpoints

### Authentication
```
POST /api/auth/signup    - Register new user
POST /api/auth/login     - User login
```

### Services
```
GET    /api/services                    - Get all services (with filters)
GET    /api/services/search             - Search services
GET    /api/services/nearby             - Get nearby services
GET    /api/services/category/:category - Get services by category
GET    /api/services/:id                - Get single service
POST   /api/services                    - Create service (Business/Admin)
PUT    /api/services/:id                - Update service (Owner/Admin)
DELETE /api/services/:id                - Delete service (Admin)
```

### Bookings
```
POST   /api/bookings                    - Create booking
GET    /api/bookings/my-bookings        - Get user's bookings
GET    /api/bookings/:id                - Get single booking
PUT    /api/bookings/:id/cancel         - Cancel booking
GET    /api/bookings/service/:serviceId - Get service bookings (Business)
PUT    /api/bookings/:id/status         - Update booking status (Business)
```

### Reviews
```
GET    /api/reviews/service/:serviceId  - Get service reviews
POST   /api/reviews                     - Create review
GET    /api/reviews/my-reviews          - Get user's reviews
PUT    /api/reviews/:id                 - Update review
DELETE /api/reviews/:id                 - Delete review
POST   /api/reviews/:id/helpful         - Mark review helpful
```

## 🏗 Database Models

### User
- Basic info (name, email, phone)
- Role-based access (user, business, admin)
- Profile & preferences
- Verification status

### Service
- Business details & location (GeoJSON)
- Category & subcategory
- Contact info & timings
- Rating & reviews
- Images & amenities
- Price range & verification

### Booking
- User & service references
- Scheduling (date, time, duration)
- Status tracking
- Payment & cancellation info
- Feedback system

### Review
- Rating (1-5 stars)
- Title & comment
- Images & helpful votes
- Verification & responses

## 🌍 Location Features

- **GeoSpatial Queries**: Find nearby services using MongoDB 2dsphere index
- **Coimbatore Focus**: All sample data centered around Coimbatore coordinates
- **Distance Filtering**: Search within specified radius

## 🔐 Security Features

- JWT authentication with 30-day expiry
- Password hashing with bcrypt
- Role-based authorization
- Input validation & sanitization
- CORS configuration

## 📱 Categories Supported

1. **Food** (restaurant) - South Indian, Sweets, Fast Food
2. **Stay** (hotel) - Business Hotels, Budget Stay, Luxury
3. **Services** (utility) - Electronics Repair, Home Services
4. **Learn** (education) - Coaching Centers, Skill Development

## 🚦 API Response Format

```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

## 🛡 Error Handling

- Consistent error responses
- Detailed error messages in development
- Validation error details
- HTTP status codes

## 📈 Performance Features

- Database indexing for fast queries
- Pagination for large datasets
- Efficient geospatial searches
- Request logging for monitoring

## 🔧 Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Seed database with sample data
npm run seed

# Production start
npm start
```

## 🌟 Key Features

- **Multi-tenant**: Supports users, businesses, and admins
- **Location-aware**: GeoJSON-based location services
- **Review System**: Complete rating and review functionality
- **Booking Management**: Full booking lifecycle
- **Search & Filter**: Advanced search with multiple filters
- **Mobile-optimized**: Designed for mobile-first experience

Perfect for urban gig workers and job seekers in Coimbatore! 🏙️
