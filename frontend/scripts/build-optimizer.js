#!/usr/bin/env node

/**
 * Build Optimization Script
 * Analyzes and optimizes the build output
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const distPath = path.join(projectRoot, 'dist')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

// Get file size in human readable format
const getFileSize = (filePath) => {
  const stats = fs.statSync(filePath)
  const bytes = stats.size
  
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// Analyze bundle sizes
const analyzeBundleSizes = () => {
  log('\n📊 Bundle Size Analysis', 'cyan')
  log('=' * 50, 'cyan')
  
  if (!fs.existsSync(distPath)) {
    log('❌ Dist folder not found. Run build first.', 'red')
    return
  }
  
  const jsPath = path.join(distPath, 'assets', 'js')
  const cssPath = path.join(distPath, 'assets')
  
  // Analyze JavaScript files
  if (fs.existsSync(jsPath)) {
    log('\n📦 JavaScript Bundles:', 'yellow')
    const jsFiles = fs.readdirSync(jsPath)
      .filter(file => file.endsWith('.js'))
      .map(file => ({
        name: file,
        size: getFileSize(path.join(jsPath, file)),
        path: path.join(jsPath, file)
      }))
      .sort((a, b) => fs.statSync(b.path).size - fs.statSync(a.path).size)
    
    jsFiles.forEach(file => {
      const type = file.name.includes('vendor') ? '📚' : 
                   file.name.includes('chunk') ? '🧩' : '🎯'
      log(`  ${type} ${file.name}: ${file.size}`, 'bright')
    })
    
    const totalJSSize = jsFiles.reduce((total, file) => {
      return total + fs.statSync(file.path).size
    }, 0)
    log(`\n  📊 Total JS Size: ${getFileSize('')}`, 'green')
  }
  
  // Analyze CSS files
  const cssFiles = fs.readdirSync(distPath)
    .filter(file => file.endsWith('.css'))
    .concat(
      fs.existsSync(cssPath) ? 
      fs.readdirSync(cssPath).filter(file => file.endsWith('.css')) : []
    )
  
  if (cssFiles.length > 0) {
    log('\n🎨 CSS Files:', 'yellow')
    cssFiles.forEach(file => {
      const filePath = fs.existsSync(path.join(distPath, file)) ? 
        path.join(distPath, file) : path.join(cssPath, file)
      log(`  💄 ${file}: ${getFileSize(filePath)}`, 'bright')
    })
  }
  
  // Analyze assets
  const assetsPath = path.join(distPath, 'assets')
  if (fs.existsSync(assetsPath)) {
    const assetDirs = fs.readdirSync(assetsPath, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)
    
    if (assetDirs.length > 0) {
      log('\n🖼️  Assets:', 'yellow')
      assetDirs.forEach(dir => {
        const dirPath = path.join(assetsPath, dir)
        const files = fs.readdirSync(dirPath)
        const totalSize = files.reduce((total, file) => {
          return total + fs.statSync(path.join(dirPath, file)).size
        }, 0)
        log(`  📁 ${dir}: ${files.length} files, ${getFileSize('')}`, 'bright')
      })
    }
  }
}

// Check for optimization opportunities
const checkOptimizations = () => {
  log('\n🔍 Optimization Opportunities', 'cyan')
  log('=' * 50, 'cyan')
  
  const recommendations = []
  
  // Check for large bundles
  const jsPath = path.join(distPath, 'assets', 'js')
  if (fs.existsSync(jsPath)) {
    const jsFiles = fs.readdirSync(jsPath)
      .filter(file => file.endsWith('.js'))
      .map(file => ({
        name: file,
        size: fs.statSync(path.join(jsPath, file)).size
      }))
    
    const largeBundles = jsFiles.filter(file => file.size > 500 * 1024) // > 500KB
    if (largeBundles.length > 0) {
      recommendations.push({
        type: 'warning',
        message: `Large bundles detected (${largeBundles.length} files > 500KB)`,
        suggestion: 'Consider code splitting or lazy loading'
      })
    }
    
    const vendorBundle = jsFiles.find(file => file.name.includes('vendor'))
    if (vendorBundle && vendorBundle.size > 1024 * 1024) { // > 1MB
      recommendations.push({
        type: 'warning',
        message: 'Vendor bundle is very large (> 1MB)',
        suggestion: 'Consider splitting vendor dependencies'
      })
    }
  }
  
  // Check for missing compression
  const hasGzipFiles = fs.existsSync(distPath) && 
    fs.readdirSync(distPath, { recursive: true })
      .some(file => file.endsWith('.gz'))
  
  if (!hasGzipFiles) {
    recommendations.push({
      type: 'info',
      message: 'No gzip compressed files found',
      suggestion: 'Enable compression in build configuration'
    })
  }
  
  // Display recommendations
  if (recommendations.length === 0) {
    log('✅ No optimization issues found!', 'green')
  } else {
    recommendations.forEach(rec => {
      const icon = rec.type === 'warning' ? '⚠️' : 'ℹ️'
      const color = rec.type === 'warning' ? 'yellow' : 'blue'
      log(`\n${icon} ${rec.message}`, color)
      log(`   💡 ${rec.suggestion}`, 'bright')
    })
  }
}

// Generate build report
const generateBuildReport = () => {
  log('\n📋 Build Report', 'cyan')
  log('=' * 50, 'cyan')
  
  const reportData = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    buildTime: new Date().toLocaleString(),
    bundles: {},
    assets: {},
    totalSize: 0
  }
  
  // Collect bundle information
  const jsPath = path.join(distPath, 'assets', 'js')
  if (fs.existsSync(jsPath)) {
    const jsFiles = fs.readdirSync(jsPath).filter(file => file.endsWith('.js'))
    jsFiles.forEach(file => {
      const filePath = path.join(jsPath, file)
      const size = fs.statSync(filePath).size
      reportData.bundles[file] = {
        size: size,
        sizeFormatted: getFileSize(filePath)
      }
      reportData.totalSize += size
    })
  }
  
  // Save report
  const reportPath = path.join(distPath, 'build-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
  
  log(`📊 Total Build Size: ${getFileSize('')}`, 'green')
  log(`📄 Build report saved to: ${reportPath}`, 'blue')
}

// Main execution
const main = () => {
  log('🚀 Build Optimization Analysis', 'magenta')
  log('=' * 50, 'magenta')
  
  try {
    analyzeBundleSizes()
    checkOptimizations()
    generateBuildReport()
    
    log('\n✅ Analysis complete!', 'green')
    log('\n💡 Tips for optimization:', 'cyan')
    log('  • Use dynamic imports for code splitting', 'bright')
    log('  • Implement lazy loading for routes', 'bright')
    log('  • Optimize images and assets', 'bright')
    log('  • Enable compression in production', 'bright')
    log('  • Use bundle analyzer: npm run build:analyze', 'bright')
    
  } catch (error) {
    log(`❌ Error during analysis: ${error.message}`, 'red')
    process.exit(1)
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}

export { analyzeBundleSizes, checkOptimizations, generateBuildReport }
