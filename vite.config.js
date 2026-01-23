import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // ✅ Keeps routing stable on live domains (served from root)
  base: "/"
});
