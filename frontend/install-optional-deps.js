#!/usr/bin/env node

/**
 * Install Optional Dependencies Script
 * Installs optional build optimization dependencies
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const optionalDependencies = [
  'rollup-plugin-visualizer',
  'vite-plugin-compression',
  'rimraf',
  'bundlesize'
]

console.log('🔧 Installing optional build dependencies...')

try {
  // Check if package.json exists
  const packageJsonPath = path.join(__dirname, 'package.json')
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found')
    process.exit(1)
  }

  // Install optional dependencies
  console.log('📦 Installing packages:', optionalDependencies.join(', '))
  
  const installCommand = `npm install --save-dev ${optionalDependencies.join(' ')}`
  execSync(installCommand, { stdio: 'inherit' })
  
  console.log('✅ Optional dependencies installed successfully!')
  console.log('\n🎉 You can now use:')
  console.log('  • npm run build:analyze - Bundle analysis')
  console.log('  • npm run build:clean - Clean build')
  console.log('  • npm run size-check - Bundle size check')
  
} catch (error) {
  console.error('❌ Failed to install optional dependencies:', error.message)
  console.log('\n💡 You can install them manually:')
  console.log(`npm install --save-dev ${optionalDependencies.join(' ')}`)
  process.exit(1)
}
