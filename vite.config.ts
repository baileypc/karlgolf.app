import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'public',
    assetsDir: 'assets',
    // Generate manifest for cache busting
    manifest: true,
    rollupOptions: {
      output: {
        // Manual chunking for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          query: ['@tanstack/react-query'],
        },
      },
    },
  },
  server: {
    port: 3000,
    // Proxy API requests to PHP backend during development (Laragon)
    // Note: Update target if your local directory name differs
    proxy: {
      '/api': {
        target: 'http://localhost/karlgolf.app',
        changeOrigin: true,
        secure: false,
      },
      '/data': {
        target: 'http://localhost/karlgolf.app',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  // Disable publicDir since we're building directly to /public
  // Static assets (images, manifest, etc.) are already in /public
  publicDir: false,
});
