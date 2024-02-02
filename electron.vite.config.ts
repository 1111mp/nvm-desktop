import { resolve } from "path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import del from "rollup-plugin-delete";

const isTest = process.env.TEST === "true";

export default defineConfig({
  main: {
    resolve: {
      alias: {
        "@src": resolve("src")
      }
    },
    build: {
      rollupOptions: {
        input: isTest ? "src/main/main.test.ts" : "src/main/main.ts",
        output: {
          entryFileNames: "main.mjs",
          inlineDynamicImports: true,
          format: "es"
        }
      }
    },
    plugins: [del({ targets: ["release/app/dist", "release/build"] })]
  },
  preload: {
    build: {
      rollupOptions: {
        input: isTest ? "src/preload/preload.test.ts" : "src/preload/index.ts",
        output: {
          entryFileNames: "preload.js",
          inlineDynamicImports: true,
          format: "cjs"
        }
      }
    },
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        "@src": resolve("src"),
        "@renderer": resolve("src/renderer/src")
      }
    },
    plugins: [react()]
  }
});
