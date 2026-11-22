#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Lab Attendance Configuration Validation\n');

// Load environment files
function loadEnvFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const env = {};
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });
    return env;
  } catch (error) {
    return null;
  }
}

// Check backend configuration
console.log('📋 Backend Configuration:');
const backendEnv = loadEnvFile('backend/.env');
if (backendEnv) {
  console.log('✅ Backend .env file found');
  
  // Check critical variables
  const criticalVars = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
  const missingVars = criticalVars.filter(varName => !backendEnv[varName]);
  
  if (missingVars.length === 0) {
    console.log('✅ All critical backend variables configured');
  } else {
    console.log('❌ Missing critical backend variables:', missingVars.join(', '));
  }
  
  // Check port configuration
  const backendPort = backendEnv.PORT || '5000';
  console.log(`🔌 Backend Port: ${backendPort}`);
  
  // Check CORS configuration
  const frontendUrl = backendEnv.FRONTEND_URL || 'Not set';
  console.log(`🌐 Frontend URL: ${frontendUrl}`);
  
} else {
  console.log('❌ Backend .env file not found');
}

console.log('\n📋 Frontend Configuration:');
const frontendEnv = loadEnvFile('frontend/.env');
if (frontendEnv) {
  console.log('✅ Frontend .env file found');
  
  // Check API URLs
  const apiUrls = {
    'Production API': frontendEnv.VITE_API_URL,
    'Development API': frontendEnv.VITE_DEV_API_URL,
    'Local API': frontendEnv.VITE_LOCAL_API_URL
  };
  
  Object.entries(apiUrls).forEach(([name, url]) => {
    if (url) {
      console.log(`🔗 ${name}: ${url}`);
    } else {
      console.log(`⚠️  ${name}: Not configured`);
    }
  });
  
} else {
  console.log('❌ Frontend .env file not found');
}

// Check Vite configuration
console.log('\n📋 Vite Configuration:');
if (fs.existsSync('frontend/vite.config.js')) {
  console.log('✅ Vite config file found');
  
  const viteConfig = fs.readFileSync('frontend/vite.config.js', 'utf8');
  
  // Check if proxy is configured
  if (viteConfig.includes('proxy')) {
    console.log('✅ Proxy configuration found');
  } else {
    console.log('⚠️  No proxy configuration found');
  }
  
  // Extract port from config
  const portMatch = viteConfig.match(/port:\s*(\d+)/);
  if (portMatch) {
    console.log(`🔌 Frontend Port: ${portMatch[1]}`);
  }
  
} else {
  console.log('❌ Vite config file not found');
}

// Configuration consistency check
console.log('\n🔍 Configuration Consistency Check:');

if (backendEnv && frontendEnv) {
  const backendPort = backendEnv.PORT || '5000';
  const expectedApiUrl = `http://localhost:${backendPort}/api`;
  
  const devApiUrl = frontendEnv.VITE_DEV_API_URL;
  const localApiUrl = frontendEnv.VITE_LOCAL_API_URL;
  
  if (devApiUrl === expectedApiUrl || localApiUrl === expectedApiUrl) {
    console.log('✅ Frontend API URLs match backend port');
  } else {
    console.log('⚠️  Frontend API URLs may not match backend port');
    console.log(`   Expected: ${expectedApiUrl}`);
    console.log(`   Dev API: ${devApiUrl || 'Not set'}`);
    console.log(`   Local API: ${localApiUrl || 'Not set'}`);
  }
  
  // Check CORS consistency
  const frontendUrl = backendEnv.FRONTEND_URL;
  if (frontendUrl && frontendUrl.includes('5173')) {
    console.log('✅ CORS configuration appears consistent');
  } else {
    console.log('⚠️  CORS configuration may need review');
  }
}

console.log('\n📖 Configuration Summary:');
console.log('   Backend: http://localhost:5000');
console.log('   Frontend: http://localhost:5173');
console.log('   API Endpoint: http://localhost:5000/api');
console.log('\n💡 To start the application:');
console.log('   npm run dev');
