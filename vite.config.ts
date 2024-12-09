import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  root: 'src',
  publicDir: '../public',

  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', { target: '19' }]],
      },
    }),
    createHtmlPlugin({
      inject: {
        data: {
          NODE_ENV: mode,
        },
      },
    }),
  ],

  resolve: {
    alias: {
      '@': resolve('src'),
    },
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      ignored: ['**/src-tauri/**'],
    },
  },

  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },

  define: {
    OS_ARCH: `"${process.arch}"`,
    OS_PLATFORM: `"${process.platform}"`,
  },
}));
