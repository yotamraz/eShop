import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      '/bff': {
        target: 'http://localhost:5045',
        changeOrigin: true,
      },
      '/product-images': {
        target: 'http://localhost:5045',
        changeOrigin: true,
      },
    },
  },
  base: '/react/',
  build: {
    outDir: '../WebApp/wwwroot/react',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    css: false,
  },
});
