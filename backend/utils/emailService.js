const nodemailer = require('nodemailer');

/**
 * Email Service for sending teacher credentials and other notifications
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter based on environment configuration
   */
  initializeTransporter() {
    try {
      // Check if email is enabled
      if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED !== 'true') {
        console.log('Email service is disabled. Set EMAIL_ENABLED=true to enable.');
        return;
      }

      // Gmail configuration (most common)
      if (process.env.EMAIL_SERVICE === 'gmail') {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_APP_PASSWORD // Use App Password, not regular password
          }
        });
      }
      // Outlook/Hotmail configuration
      else if (process.env.EMAIL_SERVICE === 'outlook') {
        this.transporter = nodemailer.createTransport({
          service: 'hotmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      }
      // Custom SMTP configuration
      else if (process.env.EMAIL_SERVICE === 'smtp') {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: process.env.SMTP_PORT || 587,
          secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
          }
        });
      }
      // Development/Testing with Ethereal Email (only if no specific service is configured)
      else if (process.env.NODE_ENV === 'development' && !process.env.EMAIL_SERVICE) {
        this.createTestAccount();
        return;
      }

      console.log('Email transporter initialized successfully');
    } catch (error) {
      console.error('Error initializing email transporter:', error);
    }
  }

  /**
   * Create test account for development (Ethereal Email)
   */
  async createTestAccount() {
    try {
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });

      console.log('Test email account created:');
      console.log('User:', testAccount.user);
      console.log('Pass:', testAccount.pass);
      console.log('Preview URL: https://ethereal.email');
    } catch (error) {
      console.error('Error creating test email account:', error);
    }
  }

  /**
   * Verify email transporter connection
   */
  async verifyConnection() {
    if (!this.transporter) {
      throw new Error('Email transporter not initialized');
    }

    try {
      await this.transporter.verify();
      console.log('Email server connection verified');
      return true;
    } catch (error) {
      console.error('Email server connection failed:', error);
      throw error;
    }
  }

  /**
   * Generate welcome email template for new teacher
   */
  generateTeacherWelcomeEmail(teacherData) {
    const { name, email, employeeId, password, department } = teacherData;
    
    const subject = 'Welcome to CDC Attendance System - Your Login Credentials';
    
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CDC</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626, #ec4899); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .credentials-box { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .credential-item { margin: 10px 0; padding: 10px; background: #f3f4f6; border-radius: 5px; }
            .credential-label { font-weight: bold; color: #374151; }
            .credential-value { font-family: monospace; color: #dc2626; font-size: 16px; }
            .warning { background: #fef3c7; border: 1px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to CDC Attendance System</h1>
                <p>Your teacher account has been created successfully!</p>
            </div>
            
            <div class="content">
                <h2>Hello ${name},</h2>
                
                <p>Welcome to the CDC (CADD Centre) Attendance Management System! Your teacher account has been created and you can now access the system using the credentials below.</p>
                
                <div class="credentials-box">
                    <h3>Your Login Credentials</h3>
                    
                    <div class="credential-item">
                        <div class="credential-label">Full Name:</div>
                        <div class="credential-value">${name}</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">Employee ID:</div>
                        <div class="credential-value">${employeeId}</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">Email Address:</div>
                        <div class="credential-value">${email}</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">Department:</div>
                        <div class="credential-value">${department.name} (${department.code})</div>
                    </div>
                    
                    <div class="credential-item">
                        <div class="credential-label">Temporary Password:</div>
                        <div class="credential-value">${password}</div>
                    </div>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Important Security Notice:</strong>
                    <ul>
                        <li>This is a temporary password. Please change it immediately after your first login.</li>
                        <li>You can login using either your email address or Employee ID.</li>
                        <li>Keep your credentials secure and do not share them with anyone.</li>
                    </ul>
                </div>
                
                <h3>How to Login:</h3>
                <ol>
                    <li>Visit the CDC Attendance System login page</li>
                    <li>Select "Teacher Login"</li>
                    <li>Enter either your <strong>Email</strong> (${email}) or <strong>Employee ID</strong> (${employeeId})</li>
                    <li>Enter your temporary password: <code>${password}</code></li>
                    <li>Click "Sign In"</li>
                    <li><strong>Important:</strong> Change your password immediately after login</li>
                </ol>
                
                <div class="footer">
                    <p>If you have any questions or need assistance, please contact the system administrator.</p>
                    <p><strong>CDC Attendance Management System</strong><br>
                    This is an automated message. Please do not reply to this email.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;

    const textContent = `
Welcome to CDC Attendance System

Hello ${name},

Your teacher account has been created successfully!

Login Credentials:
- Full Name: ${name}
- Employee ID: ${employeeId}
- Email: ${email}
- Department: ${department.name} (${department.code})
- Temporary Password: ${password}

IMPORTANT: This is a temporary password. Please change it immediately after your first login.

How to Login:
1. Visit the CDC Attendance System login page
2. Select "Teacher Login"
3. Enter either your Email (${email}) or Employee ID (${employeeId})
4. Enter your temporary password: ${password}
5. Click "Sign In"
6. Change your password immediately after login

You can login using either your email address or Employee ID.

If you have any questions, please contact the system administrator.

CDC Attendance Management System
This is an automated message. Please do not reply to this email.
    `;

    return {
      subject,
      html: htmlContent,
      text: textContent
    };
  }

  /**
   * Send welcome email to new teacher
   */
  async sendTeacherWelcomeEmail(teacherData) {
    if (!this.transporter) {
      console.log('Email service not configured. Skipping email send.');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const emailTemplate = this.generateTeacherWelcomeEmail(teacherData);
      
      const mailOptions = {
        from: `"CDC Attendance System" <${process.env.EMAIL_USER}>`,
        to: teacherData.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        html: emailTemplate.html
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log('Welcome email sent successfully:', info.messageId);
      
      // For development, log the preview URL
      if (process.env.NODE_ENV === 'development') {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return { 
        success: true, 
        messageId: info.messageId,
        previewUrl: process.env.NODE_ENV === 'development' ? nodemailer.getTestMessageUrl(info) : null
      };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      return { 
        success: false, 
        message: error.message 
      };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;
