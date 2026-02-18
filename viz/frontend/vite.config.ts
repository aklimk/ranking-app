import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // When the vite dev server is running, nginx
  // isn't so /api addresses don't get routed
  // properly without this setting.
  server: {
    proxy: {
      "/api": "http://localhost:8000",
    },
  },
  // Empties "dist" then builds to it.
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
