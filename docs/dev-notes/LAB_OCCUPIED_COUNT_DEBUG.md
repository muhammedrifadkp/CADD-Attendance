# Lab Time Slots Occupied Count - Debug & Fix

## ❌ **Issue Identified:**

Time slots showing "0 occupied" for all slots regardless of actual bookings for the selected date.

**User Report:**
```
09:00 AM - 10:30 AM: 0 occupied
10:30 AM - 12:00 PM: 0 occupied  
12:00 PM - 01:30 PM: 0 occupied
02:00 PM - 03:30 PM: 0 occupied
03:30 PM - 05:00 PM: 0 occupied
```

## 🔍 **Root Cause Analysis:**

### **Expected Behavior:**
- Each time slot should show the actual number of occupied PCs for the selected date
- Occupied count should update when date changes
- Should work regardless of whether time slot is selected or not

### **Potential Issues:**
1. **API not returning bookings** for the selected date
2. **Time slot ID mismatch** between frontend and backend
3. **Booking status filtering** not working correctly
4. **Date filtering** not working properly in backend

## 🔧 **Debug Changes Applied:**

### **1. Enhanced Booking Fetch Logging** ✅
```javascript
// In fetchData function
const bookingsData = bookingsRes?.data || bookingsRes || []
console.log(`📅 Fetched ${bookingsData.length} bookings for date ${selectedDate}:`, bookingsData)
setBookings(bookingsData)
```

### **2. Time Slot Filtering Debug** ✅
```javascript
// In getBookingsForTimeSlot function
const filteredBookings = bookings.filter(booking => 
  booking.timeSlot === timeSlotId && 
  booking.status !== 'cancelled'
)
console.log(`📊 Time slot ${timeSlotId}: ${filteredBookings.length} bookings found`, filteredBookings)
return filteredBookings
```

### **3. Occupied Count Debug** ✅
```javascript
// In getOccupiedCount function
const count = getBookingsForTimeSlot(timeSlotId).length
console.log(`🔢 Occupied count for ${timeSlotId}: ${count}`)
return count
```

## 🧪 **How to Test & Debug:**

### **1. Open Browser Console**
- Open Lab Management page
- Open browser Developer Tools (F12)
- Go to Console tab

### **2. Check Debug Output**
Look for these console messages:

#### **A. Booking Fetch:**
```
📅 Fetched X bookings for date 2025-06-04: [array of bookings]
```

**What to check:**
- Is `X` greater than 0 if you expect bookings?
- Are the bookings array populated with actual booking objects?
- Do the booking objects have `timeSlot` and `status` fields?

#### **B. Time Slot Filtering:**
```
📊 Time slot 09:00 AM - 10:30 AM: Y bookings found [filtered bookings]
📊 Time slot 10:30 AM - 12:00 PM: Z bookings found [filtered bookings]
```

**What to check:**
- Are the time slot IDs matching exactly?
- Are bookings being filtered correctly by time slot?
- Do the booking objects have the correct `timeSlot` values?

#### **C. Occupied Count:**
```
🔢 Occupied count for 09:00 AM - 10:30 AM: Y
🔢 Occupied count for 10:30 AM - 12:00 PM: Z
```

**What to check:**
- Do the counts match the filtered bookings?
- Are the counts updating when you change dates?

### **3. Test Different Scenarios**

#### **Scenario 1: No Bookings**
- Select a future date with no bookings
- **Expected**: All time slots show "0 occupied"
- **Console**: Should show "Fetched 0 bookings"

#### **Scenario 2: With Bookings**
- Select a date with existing bookings
- **Expected**: Time slots show actual occupied counts
- **Console**: Should show bookings fetched and filtered correctly

#### **Scenario 3: Date Change**
- Change the selected date
- **Expected**: Occupied counts update for new date
- **Console**: Should show new fetch and filtering

## 🔍 **Common Issues & Solutions:**

### **Issue 1: No Bookings Fetched**
**Console shows:** `📅 Fetched 0 bookings for date 2025-06-04: []`

**Possible causes:**
- No bookings exist for that date
- Backend API not filtering by date correctly
- Date format mismatch between frontend and backend

**Solution:**
- Check if bookings exist in database for that date
- Verify backend date filtering logic
- Check date format being sent to API

### **Issue 2: Time Slot ID Mismatch**
**Console shows:** `📊 Time slot 09:00 AM - 10:30 AM: 0 bookings found []`
**But bookings exist with different time slot format**

**Possible causes:**
- Backend stores time slots as "09:00-10:30" 
- Frontend expects "09:00 AM - 10:30 AM"
- Time slot standardization not complete

**Solution:**
- Check backend booking records for actual `timeSlot` values
- Ensure time slot standardization is applied to existing data
- Update existing bookings to use new format

### **Issue 3: Status Filtering**
**Console shows bookings but filtered count is 0**

**Possible causes:**
- Bookings have status other than expected
- Status field missing or null
- Case sensitivity issues

**Solution:**
- Check booking status values in console output
- Verify status filtering logic
- Handle missing status fields

### **Issue 4: Date Filtering in Backend**
**Console shows bookings but for wrong date**

**Possible causes:**
- Backend not filtering by date properly
- Timezone issues in date comparison
- Date parsing problems

**Solution:**
- Check backend date filtering logic
- Verify timezone handling
- Test backend API directly

## 🛠️ **Backend Verification:**

### **Check Backend API Response:**
```bash
# Test the booking API directly
curl "http://localhost:5000/api/lab/bookings?date=2025-06-04" \
  -H "Authorization: Bearer <your-token>"
```

**Expected Response:**
```json
{
  "data": [
    {
      "_id": "...",
      "pc": "...",
      "timeSlot": "09:00 AM - 10:30 AM",
      "date": "2025-06-04T00:00:00.000Z",
      "status": "confirmed"
    }
  ]
}
```

### **Check Database Records:**
```javascript
// In MongoDB shell or backend
db.bookings.find({ 
  date: { 
    $gte: new Date("2025-06-04T00:00:00.000Z"),
    $lt: new Date("2025-06-05T00:00:00.000Z")
  }
})
```

## 🎯 **Expected Fix Results:**

After debugging, you should see:

### **Working Console Output:**
```
📅 Fetched 5 bookings for date 2025-06-04: [5 booking objects]
📊 Time slot 09:00 AM - 10:30 AM: 2 bookings found [2 booking objects]
📊 Time slot 10:30 AM - 12:00 PM: 1 bookings found [1 booking object]
📊 Time slot 12:00 PM - 01:30 PM: 0 bookings found []
📊 Time slot 02:00 PM - 03:30 PM: 2 bookings found [2 booking objects]
📊 Time slot 03:30 PM - 05:00 PM: 0 bookings found []
🔢 Occupied count for 09:00 AM - 10:30 AM: 2
🔢 Occupied count for 10:30 AM - 12:00 PM: 1
🔢 Occupied count for 12:00 PM - 01:30 PM: 0
🔢 Occupied count for 02:00 PM - 03:30 PM: 2
🔢 Occupied count for 03:30 PM - 05:00 PM: 0
```

### **Working UI Display:**
```
09:00 AM - 10:30 AM: 2 occupied (40%)
10:30 AM - 12:00 PM: 1 occupied (20%)
12:00 PM - 01:30 PM: 0 occupied (0%)
02:00 PM - 03:30 PM: 2 occupied (40%)
03:30 PM - 05:00 PM: 0 occupied (0%)
```

## 🎉 **Next Steps:**

1. **Test the debug version** and check console output
2. **Identify the specific issue** from debug logs
3. **Apply the appropriate fix** based on findings
4. **Remove debug logs** once issue is resolved
5. **Test with real booking data** to verify fix

The debug version will help pinpoint exactly where the occupied count calculation is failing! 🔍🎯
