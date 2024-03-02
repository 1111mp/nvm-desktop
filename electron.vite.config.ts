import { resolve } from "path";
import { defineConfig } from "electron-vite-tsup";
import react from "@vitejs/plugin-react-swc";
import stylePlugin from "esbuild-style-plugin";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig(({ mode }) => {
  const isProd = mode === "production",
    isTest = process.env.TEST === "true";

  return {
    main: {
      clean: true,
      entry: { main: isTest ? "src/main/main.test.ts" : "src/main/main.ts" },
      format: "esm",
      // The requested module 'electron-updater' is a CommonJS module, which may not support all module.exports as named exports.
      noExternal: isProd ? [/(.*)/] : ["electron-updater"],
      minify: isProd,
      watch: !isProd
    },
    preload: {
      clean: true,
      entry: { preload: isTest ? "src/preload/preload.test.ts" : "src/preload/index.ts" },
      format: "cjs",
      minify: isProd,
      watch: !isProd
    },
    renderer: {
      resolve: {
        alias: {
          "@src": resolve("src"),
          "@renderer": resolve("src/renderer/src")
        }
      },
      build: {
        clean: true,
        entry: ["src/renderer/src/index.tsx"],
        minify: true,
        esbuildPlugins: [
          stylePlugin({
            postcss: {
              plugins: [tailwindcss(), autoprefixer()]
            }
          })
        ]
      },
      plugins: [react()]
    }
  };
});
