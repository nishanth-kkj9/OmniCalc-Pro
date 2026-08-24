import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/mathjs')) return 'vendor_math';
          if (id.includes('node_modules/recharts')) return 'vendor_charts';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom'))
            return 'vendor_react';
        },
      },
    },
  },
});
