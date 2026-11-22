#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Lab Attendance Setup Verification\n');

const checks = [
  {
    name: 'Root package.json',
    path: 'package.json',
    required: true
  },
  {
    name: 'Backend package.json',
    path: 'backend/package.json',
    required: true
  },
  {
    name: 'Frontend package.json',
    path: 'frontend/package.json',
    required: true
  },
  {
    name: 'Backend .env file',
    path: 'backend/.env',
    required: true
  },
  {
    name: 'Frontend .env file',
    path: 'frontend/.env',
    required: true
  },
  {
    name: 'Root node_modules',
    path: 'node_modules',
    required: false
  },
  {
    name: 'Backend node_modules',
    path: 'backend/node_modules',
    required: false
  },
  {
    name: 'Frontend node_modules',
    path: 'frontend/node_modules',
    required: false
  }
];

let allPassed = true;
let criticalFailed = false;

checks.forEach(check => {
  const exists = fs.existsSync(check.path);
  const status = exists ? '✅' : '❌';
  const severity = check.required ? (exists ? '' : ' (CRITICAL)') : ' (optional)';
  
  console.log(`${status} ${check.name}${severity}`);
  
  if (!exists && check.required) {
    criticalFailed = true;
  }
  
  if (!exists) {
    allPassed = false;
  }
});

console.log('\n📋 Summary:');

if (criticalFailed) {
  console.log('❌ Critical files missing! Please run the following commands:');
  console.log('   npm run install-all');
  console.log('\n💡 Or use the start.bat file to automatically install and start');
} else if (!allPassed) {
  console.log('⚠️  Some optional dependencies missing. Run:');
  console.log('   npm run install-all');
} else {
  console.log('✅ All checks passed! You can start the application with:');
  console.log('   npm run dev');
  console.log('\n🚀 Or use start.bat for a guided startup');
}

console.log('\n📖 Available commands:');
console.log('   npm run dev        - Start both frontend and backend');
console.log('   npm run server     - Start only backend');
console.log('   npm run client     - Start only frontend');
console.log('   npm run build      - Build frontend for production');
console.log('   npm run install-all - Install all dependencies');

process.exit(criticalFailed ? 1 : 0);
