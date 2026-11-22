# Email Setup Guide for Teacher Credentials

This guide explains how to configure email functionality to automatically send teacher credentials (Name, Employee ID, and Password) when a new teacher is created.

## 📧 Email Service Options

### Option 1: Gmail (Recommended)

**Step 1: Enable 2-Factor Authentication**
1. Go to your Google Account settings
2. Navigate to Security → 2-Step Verification
3. Enable 2-Factor Authentication

**Step 2: Generate App Password**
1. Go to Google Account → Security → App passwords
2. Select "Mail" and "Other (custom name)"
3. Enter "CDC Attendance System"
4. Copy the 16-character app password

**Step 3: Configure Environment Variables**
```env
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
```

### Option 2: Outlook/Hotmail

**Step 1: Configure Environment Variables**
```env
EMAIL_ENABLED=true
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

### Option 3: Custom SMTP Server

**Step 1: Get SMTP Details from Your Provider**
- SMTP Host (e.g., smtp.your-provider.com)
- SMTP Port (usually 587 or 465)
- Username and Password

**Step 2: Configure Environment Variables**
```env
EMAIL_ENABLED=true
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
```

### Option 4: Development/Testing (Ethereal Email)

For development and testing, the system automatically uses Ethereal Email:
```env
EMAIL_ENABLED=true
NODE_ENV=development
```

## 🚀 Setup Instructions

### Step 1: Copy Environment Template
```bash
cd backend
cp .env.example .env
```

### Step 2: Configure Your Email Settings
Edit the `.env` file with your email provider settings (see options above).

### Step 3: Quick Setup (Recommended)
Use the interactive setup script:
```bash
node setup-email.js
```

### Step 4: Manual Configuration (Alternative)
Edit the `backend/.env` file manually with your email provider settings.

### Step 5: Test Email Configuration
```bash
cd backend
node test-email.js
```

### Step 6: Start the Application
```bash
cd backend
npm start
```

## 📋 Email Template Features

The welcome email includes:

### 📧 **Email Content:**
- **Subject:** "Welcome to CDC Attendance System - Your Login Credentials"
- **Professional HTML template** with CDC branding
- **Teacher's full name and welcome message**
- **Complete login credentials:**
  - Full Name
  - Employee ID (auto-generated)
  - Email Address
  - Department Name and Code
  - Temporary Password
- **Security warnings and instructions**
- **Step-by-step login guide**
- **Password change reminder**

### 🔐 **Security Features:**
- Temporary password notification
- Instructions to change password immediately
- Dual login method explanation (Email or Employee ID)
- Security best practices

## 🔧 How It Works

### 1. **Teacher Creation Process:**
```
Admin creates teacher → 
System generates Employee ID → 
User account created → 
Welcome email sent automatically → 
Teacher receives credentials
```

### 2. **Email Sending Logic:**
- Email is sent **after** successful teacher creation
- If email fails, teacher account is still created
- Email status is returned in API response
- Detailed logging for troubleshooting

### 3. **Frontend Integration:**
The teacher form already handles email responses:
```javascript
// In TeacherForm.jsx - handleSubmit function
const response = await teachersAPI.createTeacher(formData)

if (response.data.emailSent) {
  toast.success('Teacher created successfully and welcome email sent!')
} else {
  toast.success('Teacher created successfully!')
  toast.info('Welcome email could not be sent. Please provide credentials manually.')
}
```

## 🛠️ Troubleshooting

### Common Issues:

**1. "Authentication failed" Error**
- **Gmail:** Make sure you're using App Password, not regular password
- **Outlook:** Check if account has 2FA enabled
- **SMTP:** Verify username/password and server settings

**2. "Connection timeout" Error**
- Check SMTP host and port settings
- Verify firewall/network restrictions
- Try different SMTP ports (587, 465, 25)

**3. "Email not received"**
- Check spam/junk folder
- Verify recipient email address
- Check email service logs

**4. Development Mode**
- Emails are sent to Ethereal Email (test service)
- Check console for preview URL
- No real emails are sent in development

### Debug Mode:
Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 📱 Email Preview

### Development Mode:
- Uses Ethereal Email for testing
- Console shows preview URL
- No real emails sent

### Production Mode:
- Sends real emails to teacher's email address
- Logs success/failure status
- Returns email status in API response

## 🔒 Security Considerations

1. **App Passwords:** Use app-specific passwords for Gmail
2. **Environment Variables:** Never commit email credentials to version control
3. **HTTPS:** Use secure connections in production
4. **Password Policy:** Enforce strong temporary passwords
5. **Email Encryption:** Use TLS/SSL for email transmission

## 📞 Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify environment variables are correctly set
3. Test email connection using the test script
4. Check your email provider's documentation
5. Ensure firewall allows SMTP connections

## 🎯 Example Usage

After setup, when an admin creates a teacher:

1. **Admin fills teacher form** → Selects department, enters details
2. **System generates Employee ID** → e.g., "CADD-001"
3. **Teacher account created** → With auto-generated credentials
4. **Welcome email sent** → To teacher's email address
5. **Teacher receives email** → With login instructions
6. **Teacher logs in** → Using email or Employee ID
7. **Teacher changes password** → On first login

The entire process is automated and secure! 🚀
