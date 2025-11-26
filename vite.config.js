import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Optimierungen für kleinere Bundles
    rollupOptions: {
      output: {
        // Cache Busting mit Hashes
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // Code Splitting für kleinere Dateien
        manualChunks: {
          // React & React-DOM in separate Datei
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Supabase in separate Datei
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Mapbox in separate Datei (falls verwendet)
          'mapbox-vendor': ['mapbox-gl'],
        }
      }
    },
    
    // Chunk Size Warnings
    chunkSizeWarningLimit: 600, // Warnung bei >600kb
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Console.logs in Production entfernen
        drop_debugger: true
      }
    }
  },
  
  // Optimization
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
})
