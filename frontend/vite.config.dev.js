import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Development-specific configuration
export default defineConfig({
  plugins: [
    react({
      fastRefresh: true,
      // Include React DevTools in development
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx-development', {}]
        ]
      }
    })
  ],
  
  server: {
    port: 5173,
    host: true,
    open: true, // Auto-open browser
    cors: true,
    
    // Enhanced proxy configuration for development
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('🚨 Proxy error:', err.message)
          })
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('📤 Proxy Request:', req.method, req.url)
          })
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            if (proxyRes.statusCode >= 400) {
              console.log('📥 Proxy Response Error:', proxyRes.statusCode, req.url)
            }
          })
        }
      }
    },
    
    // Hot Module Replacement
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      overlay: true,
      timeout: 60000
    },
    
    // File watching
    watch: {
      usePolling: false,
      interval: 300,
      ignored: [
        '**/node_modules/**',
        '**/.git/**',
        '**/dist/**',
        '**/coverage/**'
      ]
    }
  },
  
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
  
  // CSS configuration for development
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Define development constants
  define: {
    __DEV__: true,
    __PROD__: false,
    __APP_VERSION__: JSON.stringify('1.0.0-dev'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Optimization for development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'react-hot-toast'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Build configuration (for dev build)
  build: {
    sourcemap: true,
    minify: false,
    target: 'esnext',
    outDir: 'dist-dev',
    rollupOptions: {
      output: {
        manualChunks: undefined // Disable chunking in dev build
      }
    }
  },
  
  // Environment variables
  envPrefix: ['VITE_', 'REACT_APP_'],
  
  // Logging
  logLevel: 'info',
  clearScreen: false
})
