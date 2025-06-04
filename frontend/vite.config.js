import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  const isDev = mode === 'development'
  const isProd = mode === 'production'
  const isAnalyze = process.env.ANALYZE === 'true'

  // Determine backend URL for proxy
  const backendUrl = env.VITE_LOCAL_API_URL?.replace('/api', '') ||
                     env.VITE_DEV_API_URL?.replace('/api', '') ||
                     'http://localhost:5000';

  // Only log in development mode
  if (mode === 'development') {
    console.log(`🔧 Vite Config - Mode: ${mode}, Backend URL: ${backendUrl}`);
  }

  return {
    plugins: [
      // React plugin with optimizations
      react({
        // Enable Fast Refresh
        fastRefresh: isDev,
        // Basic babel configuration
        babel: isProd ? {
          plugins: [
            // Only use plugins that don't require additional dependencies
          ]
        } : undefined
      })
    ],
    server: {
      port: 5173,
      host: true, // Allow external connections
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            // Only log proxy events in development
            if (mode === 'development') {
              proxy.on('error', (err, _req, _res) => {
                console.log('🚨 Proxy error:', err.message);
              });
              // Reduce verbose logging - only log errors and important requests
              proxy.on('proxyReq', (proxyReq, req, _res) => {
                if (req.method !== 'GET' || req.url.includes('error')) {
                  console.log('📤 Proxy Request:', req.method, req.url);
                }
              });
            }
          },
        },
      },
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 5173,
        overlay: true,
        timeout: 60000 // Reduced from 120000
      },
      watch: {
        usePolling: process.env.VITE_USE_POLLING === 'true', // Only use polling when explicitly needed
        interval: 1000, // Increase polling interval to reduce CPU usage
        ignored: ['**/node_modules/**', '**/.git/**'] // Ignore unnecessary directories
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
        '@styles': resolve(__dirname, 'src/styles')
      }
    },

    // Build configuration
    build: {
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: isDev ? true : 'hidden', // Hidden sourcemaps in production
      minify: isProd ? 'esbuild' : false,
      cssMinify: isProd,

      // ESBuild options for better optimization
      esbuild: isProd ? {
        drop: ['console', 'debugger'],
        legalComments: 'none'
      } : undefined,

      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html')
        },
        output: {
          // Advanced chunking strategy
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor'
              }
              if (id.includes('react-router')) {
                return 'router-vendor'
              }
              if (id.includes('@headlessui') || id.includes('@heroicons')) {
                return 'ui-vendor'
              }
              if (id.includes('axios') || id.includes('react-hot-toast')) {
                return 'utils-vendor'
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
            if (id.includes('/components/dashboard/')) {
              return 'dashboard-components'
            }
            if (id.includes('/components/lab/')) {
              return 'lab-components'
            }
          },

          // File naming strategy
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
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
              return `assets/images/[name]-[hash].${ext}`
            }
            if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash].${ext}`
            }
            return `assets/[ext]/[name]-[hash].${ext}`
          }
        },

        // External dependencies (if needed)
        external: [],

        // Optimize bundle size
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          unknownGlobalSideEffects: false
        }
      },

      // Performance optimizations
      cssCodeSplit: true,
      reportCompressedSize: !isDev, // Only report in production
      chunkSizeWarningLimit: 1000
    },
    // Define global constants
    define: {
      __APP_VERSION__: JSON.stringify(env.VITE_APP_VERSION || '1.0.0'),
      __API_URL__: JSON.stringify(backendUrl + '/api'),
      __DEV__: isDev,
      __PROD__: isProd,
      __BUILD_TIME__: JSON.stringify(new Date().toISOString())
    },

    // CSS configuration
    css: {
      devSourcemap: isDev,
      modules: {
        localsConvention: 'camelCase'
      }
    },

    // Optimization configuration
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
      ],
      exclude: ['@vite/client', '@vite/env']
    },

    // Preview configuration (for production preview)
    preview: {
      port: 4173,
      host: true,
      strictPort: true,
      cors: true
    },

    // Environment variables
    envPrefix: ['VITE_', 'REACT_APP_']
  }
})
