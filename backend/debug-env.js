// Debug script to check environment variables
require('dotenv').config();

console.log('🔍 Environment Variables Debug:');
console.log('EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_APP_PASSWORD:', process.env.EMAIL_APP_PASSWORD ? '✅ Set' : '❌ Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n🧪 Testing email service initialization...');
try {
  const emailService = require('./utils/emailService');
  console.log('✅ Email service loaded successfully');
} catch (error) {
  console.error('❌ Error loading email service:', error.message);
}
