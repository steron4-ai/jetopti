import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Cache Busting mit Hashes (WICHTIGSTER Teil!)
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        
        // Code Splitting für kleinere Dateien
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
        }
      }
    },
    
    // Standard Minification (ohne terser)
    minify: 'esbuild', // Standard, kein Extra Package nötig!
    
    // Chunk Size Warning
    chunkSizeWarningLimit: 600
  }
})
