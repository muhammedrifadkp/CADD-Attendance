import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { compression } from 'vite-plugin-compression'

// Production-specific configuration
export default defineConfig({
  plugins: [
    react({
      // Production optimizations
      babel: {
        plugins: [
          ['babel-plugin-react-remove-properties', { properties: ['data-testid'] }],
          ['babel-plugin-transform-react-remove-prop-types', { removeImport: true }],
          ['babel-plugin-transform-remove-console', { exclude: ['error', 'warn'] }]
        ]
      }
    }),
    
    // Bundle analyzer
    process.env.ANALYZE && visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap' // or 'sunburst', 'network'
    }),
    
    // Compression
    compression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
      deleteOriginFile: false
    }),
    
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
      deleteOriginFile: false
    })
  ].filter(Boolean),
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@pages': resolve(__dirname, 'src/pages'),
      '@hooks': resolve(__dirname, 'src/hooks'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@services': resolve(__dirname, 'src/services'),
      '@context': resolve(__dirname, 'src/context'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },
  
  // Build configuration
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: 'hidden', // Hidden sourcemaps for debugging
    minify: 'esbuild',
    cssMinify: true,
    
    // ESBuild optimizations
    esbuild: {
      drop: ['console', 'debugger'],
      legalComments: 'none',
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true
    },
    
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      },
      
      output: {
        // Advanced chunking strategy for production
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            // Router
            if (id.includes('react-router')) {
              return 'router-vendor'
            }
            // UI libraries
            if (id.includes('@headlessui') || id.includes('@heroicons')) {
              return 'ui-vendor'
            }
            // Utilities
            if (id.includes('axios') || id.includes('react-hot-toast')) {
              return 'utils-vendor'
            }
            // Date libraries
            if (id.includes('date-fns') || id.includes('moment')) {
              return 'date-vendor'
            }
            // Chart libraries
            if (id.includes('chart') || id.includes('recharts') || id.includes('d3')) {
              return 'chart-vendor'
            }
            // Other vendor libraries
            return 'vendor'
          }
          
          // Feature-based chunks
          if (id.includes('/pages/admin/')) {
            return 'admin-pages'
          }
          if (id.includes('/pages/teacher/')) {
            return 'teacher-pages'
          }
          if (id.includes('/pages/lab-teacher/')) {
            return 'lab-teacher-pages'
          }
          if (id.includes('/pages/auth/')) {
            return 'auth-pages'
          }
          
          // Component chunks
          if (id.includes('/components/dashboard/')) {
            return 'dashboard-components'
          }
          if (id.includes('/components/lab/')) {
            return 'lab-components'
          }
          if (id.includes('/components/forms/')) {
            return 'form-components'
          }
          if (id.includes('/components/ui/')) {
            return 'ui-components'
          }
          
          // Service chunks
          if (id.includes('/services/')) {
            return 'services'
          }
          if (id.includes('/hooks/')) {
            return 'hooks'
          }
          if (id.includes('/utils/')) {
            return 'utils'
          }
        },
        
        // Optimized file naming
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId && facadeModuleId.includes('node_modules')) {
            return 'assets/vendor/[name]-[hash].js'
          }
          return 'assets/chunks/[name]-[hash].js'
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          
          // Images
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return `assets/images/[name]-[hash].${ext}`
          }
          // Fonts
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return `assets/fonts/[name]-[hash].${ext}`
          }
          // CSS
          if (ext === 'css') {
            return `assets/css/[name]-[hash].${ext}`
          }
          // Other assets
          return `assets/[ext]/[name]-[hash].${ext}`
        }
      },
      
      // Tree shaking optimizations
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
      },
      
      // Warning suppression
      onwarn(warning, warn) {
        // Suppress certain warnings
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        if (warning.code === 'SOURCEMAP_ERROR') return
        if (warning.code === 'CIRCULAR_DEPENDENCY') return
        warn(warning)
      }
    },
    
    // Performance optimizations
    cssCodeSplit: true,
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000,
    
    // Rollup worker options
    rollupOptions: {
      ...this.rollupOptions,
      maxParallelFileOps: 5
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: false,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    },
    modules: {
      localsConvention: 'camelCase'
    }
  },
  
  // Define production constants
  define: {
    __DEV__: false,
    __PROD__: true,
    __APP_VERSION__: JSON.stringify(process.env.VITE_APP_VERSION || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'react-hot-toast',
      '@headlessui/react',
      '@heroicons/react/24/outline',
      '@heroicons/react/24/solid'
    ]
  },
  
  // Environment variables
  envPrefix: ['VITE_', 'REACT_APP_'],
  
  // Logging
  logLevel: 'warn'
})
