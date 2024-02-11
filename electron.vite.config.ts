import { resolve } from "path";
import { defineConfig } from "electron-vite-tsup";
import react from "@vitejs/plugin-react-swc";
import stylePlugin from "esbuild-style-plugin";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const isTest = process.env.TEST === "true";

export default defineConfig({
  main: {
    clean: true,
    entry: [isTest ? "src/main/main.test.ts" : "src/main/main.ts"],
    target: "node18",
    format: "esm",
    watch: true
  },
  preload: {
    clean: true,
    entry: [isTest ? "src/preload/preload.test.ts" : "src/preload/index.ts"],
    format: "cjs",
    watch: true
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
});
