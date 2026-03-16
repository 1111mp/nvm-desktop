import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import { createHtmlPlugin } from 'vite-plugin-html';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => ({
  root: 'src',
  publicDir: '../public',

  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
    createHtmlPlugin({
      inject: {
        data: {
          NODE_ENV: mode,
        },
      },
    }),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
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
