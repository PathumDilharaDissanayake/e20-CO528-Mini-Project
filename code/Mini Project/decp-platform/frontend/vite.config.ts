import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Base path: '/' for local dev, '/e20-CO528-Mini-Project/' when deployed to GitHub Pages
const base = process.env.VITE_BASE_URL ?? '/';

export default defineConfig({
  plugins: [react()],
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@features': path.resolve(__dirname, './src/features'),
      '@services': path.resolve(__dirname, './src/services'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@store': path.resolve(__dirname, './src/store'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      // Proxy /uploads to the API Gateway which serves uploaded files
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path, // Keep the /uploads path as-is
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // MUI split into smaller pieces
          'vendor-mui-core': ['@mui/material', '@mui/system'],
          'vendor-mui-icons': ['@mui/icons-material'],
          // Redux
          'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
          // Charts
          'vendor-charts': ['recharts'],
          // Misc utilities
          'vendor-utils': ['axios', 'date-fns', 'react-hook-form', 'zod'],
        },
      },
    },
  },
})
