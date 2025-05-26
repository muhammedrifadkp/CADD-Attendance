const bcrypt = require('bcryptjs');
const User = require('./models/userModel');

// Auto-seed admin user if it doesn't exist
const autoSeedAdmin = async () => {
  try {
    // Check if admin user already exists
    const adminExists = await User.findOne({ email: 'admin@caddcentre.com' });
    
    if (!adminExists) {
      console.log('🌱 Creating admin user...');
      
      // Create admin user
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('Admin@123456', salt);
      
      const adminUser = await User.create({
        name: 'Admin User',
        email: 'admin@caddcentre.com',
        password: hashedPassword,
        role: 'admin'
      });
      
      console.log('✅ Admin user created successfully!');
      console.log('📧 Email: admin@caddcentre.com');
      console.log('🔑 Password: Admin@123456');
      console.log('');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

module.exports = autoSeedAdmin;
