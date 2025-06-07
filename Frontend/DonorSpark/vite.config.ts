import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { mochaPlugins } from "@getmocha/vite-plugins";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [...mochaPlugins(process.env), react()],
  server: {
    allowedHosts: true,
    port: 5173,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    global: 'globalThis',
  },
  build: {
    chunkSizeWarningLimit: 5000,
  },
  optimizeDeps: {
    include: ['crypto-browserify', 'stream-browserify'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
});
