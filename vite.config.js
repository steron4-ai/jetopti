import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Wir lassen Vite die Chunks automatisch verwalten - das ist stabiler!
    chunkSizeWarningLimit: 1600, 
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Alle Node-Modules (React, etc.) in eine separate Vendor-Datei packen
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  }
})