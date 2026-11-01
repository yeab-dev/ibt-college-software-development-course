import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import menuApi from "./mock/menuApi.js";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), menuApi()],
});
