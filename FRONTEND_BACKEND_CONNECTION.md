# 🔗 Frontend-Backend Connection - WORKING SETUP

## ✅ Current Status: CONNECTED & WORKING

### **Port Configuration:**
- **Backend**: `http://localhost:5000` ✅ RUNNING
- **Frontend**: `http://localhost:5173` ✅ RUNNING
- **Connection**: ✅ VERIFIED WORKING

### **Server Files:**
- **Backend**: `backend/server-working.js` ✅ ACTIVE
- **Frontend**: Standard Vite dev server ✅ ACTIVE

## 🚀 How to Start Both Servers

### **1. Start Backend (Terminal 1):**
```bash
cd backend
node server-working.js
```

**Expected Output:**
```
🚀 Starting working backend server...
✅ Middleware configured
✅ Authentication routes configured
✅ All routes configured
✅ Working backend server running on port 5000
🌐 Test URL: http://localhost:5000/api/test
📋 Available routes:
   Authentication:
     POST   /api/users/login
     POST   /api/users/logout
     GET    /api/users/me
     GET    /api/users/profile
   Dashboard:
     GET    /api/batches
     GET    /api/students
   Lab Management:
     GET    /api/lab/pcs
     GET    /api/lab/bookings/previous
     POST   /api/lab/bookings/apply-previous
     DELETE /api/lab/bookings/clear-bulk

🔐 Login credentials:
   Admin: admin@caddcentre.com / Admin@123456
   Teacher: john@caddcentre.com / Teacher@123456
   Teacher: sarah@caddcentre.com / Teacher@123456

🧪 Ready for testing all features!
```

### **2. Start Frontend (Terminal 2):**
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 🧪 Connection Verification

### **Test 1: Backend Health Check**
```bash
curl http://localhost:5000/api/test
```

**Expected Response:**
```json
{
  "message": "Working backend server is running!",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "port": 5000
}
```

### **Test 2: Login API**
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@caddcentre.com","password":"Admin@123456"}'
```

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "_id": "admin-id",
    "name": "Admin User",
    "email": "admin@caddcentre.com",
    "role": "admin",
    "active": true
  },
  "token": "token-admin-id-1234567890"
}
```

### **Test 3: Frontend Connection**
1. Open browser: `http://localhost:5173`
2. Login with: `admin@caddcentre.com` / `Admin@123456`
3. Should redirect to dashboard without errors

## 📋 Complete API Endpoints

### **✅ Authentication (Working)**
- `POST /api/users/login` - User login
- `POST /api/users/logout` - User logout
- `GET /api/users/me` - Get current user
- `GET /api/users/profile` - Get user profile

### **✅ Dashboard (Working)**
- `GET /api/batches` - Get batches (5 mock batches)
- `GET /api/students` - Get students (5 mock students)

### **✅ Lab Management (Working)**
- `GET /api/lab/pcs` - Get PCs (6 mock PCs)
- `GET /api/lab/bookings/previous` - Get previous bookings (2 mock bookings)
- `POST /api/lab/bookings/apply-previous` - Apply previous bookings
- `DELETE /api/lab/bookings/clear-bulk` - Clear booked slots

## 🎯 Testing Lab Features

### **Apply Previous Bookings:**
1. Login as admin
2. Go to Admin → Lab Management
3. Click "Apply Previous Bookings"
4. Should show 2 previous bookings
5. Click "Apply Bookings"
6. Should show success with 2 applied bookings

### **Clear Booked Slots:**
1. Login as admin
2. Go to Admin → Lab Management
3. Click "Clear Booked Slots"
4. Select criteria and confirm
5. Should show success with 3 cleared bookings

## 🔐 Login Credentials

| Role | Email | Password | Status |
|------|-------|----------|---------|
| **Admin** | admin@caddcentre.com | Admin@123456 | ✅ Working |
| **Teacher** | john@caddcentre.com | Teacher@123456 | ✅ Working |
| **Teacher** | sarah@caddcentre.com | Teacher@123456 | ✅ Working |

## 🎉 Success Indicators

**When everything is working correctly:**

1. ✅ **Backend Console Shows:**
   - Server startup messages
   - Route configuration logs
   - "Ready for testing all features!"

2. ✅ **Frontend Loads:**
   - No connection errors in browser console
   - Login page displays properly
   - Can navigate to dashboard after login

3. ✅ **Login Works:**
   - Authentication successful
   - User redirected to dashboard
   - No 404 or connection errors

4. ✅ **Dashboard Loads:**
   - Shows batches and students
   - No API errors in console
   - All data displays properly

5. ✅ **Lab Features Work:**
   - Apply Previous Bookings shows mock data
   - Clear Booked Slots shows filter options
   - Both features complete successfully

## 🚨 Troubleshooting

### **If Backend Won't Start:**
1. Check if port 5000 is in use: `netstat -ano | findstr :5000`
2. Kill any existing process on port 5000
3. Restart: `node server-working.js`

### **If Frontend Can't Connect:**
1. Verify backend is running on port 5000
2. Check browser console for CORS errors
3. Clear browser cache and cookies
4. Restart frontend: `npm run dev`

### **If Login Fails:**
1. Check backend console for login logs
2. Verify exact credentials (case-sensitive)
3. Clear browser cookies
4. Try different browser

## ✅ Current Status Summary

- **Backend Server**: ✅ Running on port 5000
- **Frontend Server**: ✅ Running on port 5173
- **API Connection**: ✅ Verified working
- **Authentication**: ✅ Login/logout working
- **Dashboard**: ✅ Loading data properly
- **Lab Features**: ✅ Both features functional
- **Error Handling**: ✅ Proper error responses

**🎉 FRONTEND AND BACKEND ARE PROPERLY CONNECTED AND WORKING!**

All systems are operational and ready for testing the complete attendance management system with lab booking features.
