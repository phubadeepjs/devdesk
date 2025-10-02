import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const isWeb = process.env.VITE_BUILD_TARGET === 'web';
  
  return {
    plugins: [react()],
    base: isWeb ? '/' : './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      // Optimize for web builds
      ...(isWeb && {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              jsonpath: ['jsonpath-plus'],
            },
          },
        },
      }),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    define: {
      // Make build target available at runtime
      'import.meta.env.VITE_BUILD_TARGET': JSON.stringify(process.env.VITE_BUILD_TARGET || 'desktop'),
    },
  };
});

