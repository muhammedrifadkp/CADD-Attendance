# CDC Attendance Management System

A full-stack web application for managing attendance at CDC.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Redis (for rate limiting)
- npm or yarn

## Quick Start

### Option 1: Automated Setup (Windows)
```bash
# Double-click start.bat or run:
start.bat
```

### Option 2: Manual Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd cdc-attendance
```

2. Verify setup and configuration (optional):
```bash
node setup-check.js
node config-check.js
```

3. Install all dependencies:
```bash
npm run install-all
```

4. Start the application:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5170
- Backend API: http://localhost:5000

## Environment Configuration

The `.env` files are already configured with consistent values:

### Backend (.env already exists)
- **Port**: 5000 (standardized)
- **MongoDB URI**: Cloud database configured
- **JWT secrets**: Secure defaults provided
- **CORS Origins**: Configured for frontend port 5170
- **Optional**: Redis, email configuration

### Frontend (.env already exists)
- **Development API**: http://localhost:5000/api
- **Production API**: https://cdc-attendance.onrender.com/api
- **Local Override**: http://localhost:5000/api (highest priority)
- **PWA settings**: Enabled
- **Debug settings**: Configured

### Port Configuration (Fixed)
- **Frontend**: http://localhost:5170
- **Backend**: http://localhost:5000
- **API Endpoint**: http://localhost:5000/api

## Prerequisites

**Required:**
- Node.js (v18 or higher)
- MongoDB (local or cloud)

**Optional:**
- Redis (for advanced rate limiting)
- SMTP server (for email notifications)

## Default Admin Credentials

After the first run, an admin user will be automatically created with these credentials:
- Email: admin@caddcentre.com
- Password: Admin*******

**Important**: Change the default admin password immediately after first login.

## Development Scripts

- `npm run dev`: Start both frontend and backend in development mode
- `npm run server`: Start only the backend server
- `npm run client`: Start only the frontend server
- `npm run build`: Build the frontend for production

## Security Features

The application includes several security features:
- JWT-based authentication
- Rate limiting
- IP intelligence
- Device fingerprinting
- Security monitoring
- Audit logging

## Directory Structure

```
cdc-attendance/
├── backend/           # Backend server
│   ├── config/       # Configuration files
│   ├── controllers/  # Route controllers
│   ├── middleware/   # Custom middleware
│   ├── models/       # Database models
│   ├── routes/       # API routes
│   └── server.js     # Server entry point
├── frontend/         # Frontend application
│   ├── src/         # Source files
│   └── public/      # Static files
└── package.json     # Root package.json
```

## Troubleshooting

1. If MongoDB fails to start:
   - Check if MongoDB service is running
   - Verify MongoDB connection string in .env

2. If Redis fails to start:
   - Check if Redis service is running
   - Verify Redis connection settings

3. If the application fails to start:
   - Check if all dependencies are installed
   - Verify all environment variables are set
   - Check console for specific error messages

## Support

For support, please contact the system administrator or raise an issue in the repository.
