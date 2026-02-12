import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // ✅ Keeps routing stable on live domains (served from root)
   server: {
    host: '0.0.0.0', // ✅ aapka correct PC IPv4
    port: 5173,
    strictPort: true,     // agar port busy ho to fail ho jaye, auto change na ho
    open: true,           // automatically browser open kare laptop pe
  }
});
