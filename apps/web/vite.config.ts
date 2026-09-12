import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@mecrm/types': path.resolve(__dirname, '../../packages/types/src/index.ts'),
      '@mecrm/shared': path.resolve(__dirname, '../../packages/shared/src/index.ts'),
      '@mecrm/ui/styles.css': path.resolve(__dirname, '../../packages/ui/src/styles.css'),
      '@mecrm/ui': path.resolve(__dirname, '../../packages/ui/src/index.tsx'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
