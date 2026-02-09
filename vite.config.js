import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/StreamFlix/", // ✅ IMPORTANT FIX

  plugins: [react()],

  resolve: {
    alias: {
      "@": "/src",
    },
  },

  server: {
    port: 3000,
    open: true,
    allowedHosts: ["3qfvmv-3000.csb.app"],
  },
});
