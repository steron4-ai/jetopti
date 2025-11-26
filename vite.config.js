import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Cache Busting mit Hashes
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // Rolldown-kompatible manualChunks (als Funktion!)
        manualChunks(id) {
          // React & React-DOM in separate Datei
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/react-router-dom')) {
            return 'react-vendor';
          }
          
          // Supabase in separate Datei
          if (id.includes('node_modules/@supabase')) {
            return 'supabase-vendor';
          }
          
          // Mapbox in separate Datei (falls verwendet)
          if (id.includes('node_modules/mapbox')) {
            return 'mapbox-vendor';
          }
        }
      }
    },
    
    // Standard Minification
    minify: 'esbuild',
    
    // Chunk Size Warning
    chunkSizeWarningLimit: 600
  }
})
