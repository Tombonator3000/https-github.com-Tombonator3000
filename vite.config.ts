import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');

    // Support flexible base path - can be overridden with BASE_PATH env var
    // Default to './' for relative paths (works on GitHub Pages)
    const basePath = env.BASE_PATH || './';

    return {
      base: basePath,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // Inject API key at build time (optional - will fallback to runtime detection)
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Ensure assets use relative paths
        assetsDir: 'assets',
        // Generate sourcemaps for debugging
        sourcemap: mode === 'development',
        // Optimize for modern browsers
        target: 'es2015',
        // Ensure proper chunking for performance
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'game-logic': ['tone', '@google/genai'],
              'ui-components': ['lucide-react']
            }
          }
        }
      }
    };
});
