import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // En GitHub Pages el sitio vive en /<repo>/: el workflow define BASE_PATH.
  base: process.env.BASE_PATH ?? "/",
  plugins: [react(), tailwindcss()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}", "cli/**/*.test.ts", "scripts/**/*.test.ts"],
    setupFiles: ["./src/test-setup.ts"],
    globals: false,
  },
});
