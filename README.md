# CADD Attendance Management System

A full-stack web application designed to streamline attendance tracking and management for CADD Centre (software training institute). It features role-based access control, with distinct roles for Admin and Teacher, along with comprehensive lab management capabilities.

## Tech Stack

- **Frontend**: React + Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT + Cookies

## Features

### Authentication & Authorization
- Role-based access control (Admin, Teacher)
- Secure password handling with bcrypt
- JWT token-based authentication
- Automatic logout after inactivity

### Admin Dashboard
- Teacher management (CRUD operations)
- Student overview across all batches
- System analytics and reporting
- Lab management with PC booking system
- Attendance reports with advanced visualizations

### Teacher Dashboard
- Batch management with time slot restrictions
- Student management with profile photos
- Daily attendance tracking
- Lab availability and booking management
- Attendance reports and analytics

### Responsive Design
- Mobile-first approach with Tailwind CSS
- Adaptive layouts for different screen sizes

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/muhammedrifadkp/CADD-Attendance.git
   cd CADD-Attendance
   ```

2. Install dependencies
   ```bash
   npm install
   cd frontend
   npm install
   cd ../backend
   npm install
   cd ..
   ```

3. Set up environment variables
   Create a `.env` file in the `backend` directory with the following variables:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/cadd_attendance
   JWT_SECRET=your_jwt_secret_key_here_make_it_long_and_secure
   JWT_EXPIRE=30d
   ```

4. Seed the database with admin user
   ```bash
   node backend/seeder.js
   ```

5. Run the application
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5001
   - Frontend development server on http://localhost:5173

## Default Admin Credentials
- **Email**: admin@caddcentre.com
- **Password**: admin123

## API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout

### User Management
- `GET /api/users/profile` - Get user profile
- `POST /api/users` - Create a teacher (Admin only)
- `GET /api/users/teachers` - Get all teachers (Admin only)
- `GET /api/users/teachers/:id` - Get teacher by ID (Admin only)
- `PUT /api/users/teachers/:id` - Update teacher (Admin only)
- `DELETE /api/users/teachers/:id` - Delete teacher (Admin only)
- `PUT /api/users/teachers/:id/reset-password` - Reset teacher password (Admin only)

### Batch Management
- `POST /api/batches` - Create a batch
- `GET /api/batches` - Get all batches
- `GET /api/batches/:id` - Get batch by ID
- `PUT /api/batches/:id` - Update batch
- `DELETE /api/batches/:id` - Delete batch
- `GET /api/batches/:id/students` - Get students in a batch

### Student Management
- `POST /api/students` - Create a student
- `GET /api/students` - Get all students
- `GET /api/students/:id` - Get student by ID
- `PUT /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/bulk` - Bulk create students

### Attendance Management
- `POST /api/attendance` - Mark attendance for a student
- `POST /api/attendance/bulk` - Mark attendance for multiple students
- `GET /api/attendance/batch/:batchId` - Get attendance for a batch on a specific date
- `GET /api/attendance/student/:studentId` - Get attendance for a student
- `GET /api/attendance/stats/batch/:batchId` - Get attendance statistics for a batch

### Lab Management
- `POST /api/lab/pcs` - Create a new PC
- `GET /api/lab/pcs` - Get all PCs
- `PUT /api/lab/pcs/:id` - Update PC details
- `DELETE /api/lab/pcs/:id` - Delete a PC
- `POST /api/lab/bookings` - Create a lab booking
- `GET /api/lab/bookings` - Get lab bookings for a specific date
- `PUT /api/lab/bookings/:id` - Update booking details
- `DELETE /api/lab/bookings/:id` - Cancel a booking

## License

This project is licensed under the MIT License.
