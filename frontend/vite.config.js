import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Frontend React + Vite.
// Dev server nge-proxy /api dan /uploads ke backend Go (:8080),
// sehingga terasa "sinkron" dengan Golang tanpa masalah CORS.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://localhost:8080", changeOrigin: true },
      "/uploads": { target: "http://localhost:8080", changeOrigin: true },
    },
  },
});
