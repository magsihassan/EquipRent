# Construction Equipment Rental System

A full-stack web application for renting construction equipment in Pakistan. Built with React.js frontend, Node.js/Express backend, and PostgreSQL database.

## Features

- **User Roles**: Renter, Equipment Owner, Admin
- **Authentication**: JWT-based with email/phone registration
- **Equipment Management**: CRUD operations, image uploads, availability calendar
- **Booking System**: Request, approve, reject, track bookings
- **Reviews & Ratings**: Equipment and operator reviews
- **Notifications**: Email notifications for booking events
- **Admin Dashboard**: User management, equipment approval, platform stats
- **Geolocation**: Search equipment by city/location

## Tech Stack

- **Frontend**: React 18, Vite, React Router, Zustand, Axios
- **Backend**: Node.js, Express.js, PostgreSQL
- **Database**: Neon Serverless PostgreSQL
- **Real-time**: Socket.io
- **File Upload**: Multer
- **Authentication**: JWT, bcrypt

## Project Structure

```
Construction-Equipment-Rental/
├── backend/
│   ├── migrations/         # SQL schema
│   ├── src/
│   │   ├── config/         # Database, migrations, seed
│   │   ├── controllers/    # API controllers
│   │   ├── middleware/     # Auth, RBAC, upload, validation
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Email utility
│   │   └── index.js        # Server entry
│   ├── uploads/            # File uploads
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Layouts
    │   ├── pages/          # All pages
    │   ├── services/       # API client
    │   ├── store/          # Zustand stores
    │   └── App.jsx
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or Neon account)

### Backend Setup

```bash
cd backend
npm install

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your database URL and secrets

# Run migrations
node src/config/migrate.js

# Seed sample data
node src/config/seed.js

# Start server
npm run dev
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get current user
- `PUT /api/auth/profile` - Update profile

### Equipment
- `GET /api/equipment` - List equipment (with filters)
- `GET /api/equipment/:id` - Get equipment details
- `POST /api/equipment` - Create equipment (owner)
- `PUT /api/equipment/:id` - Update equipment (owner)
- `POST /api/equipment/:id/images` - Upload images

### Bookings
- `GET /api/bookings` - List user bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/:id` - Get booking details
- `PATCH /api/bookings/:id/status` - Update status

### Admin
- `GET /api/admin/dashboard` - Platform stats
- `GET /api/admin/users` - List users
- `PATCH /api/admin/users/:id/verify` - Verify user
- `GET /api/admin/equipment/pending` - Pending equipment
- `PATCH /api/admin/equipment/:id/approve` - Approve equipment

## Demo Accounts

After running seed script:
- **Admin**: admin@equiprent.com / admin123
- **Owner**: owner@equiprent.com / owner123
- **Renter**: renter@equiprent.com / renter123

## License

MIT
