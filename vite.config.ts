import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Change base to './' to ensure assets load correctly in PWA/Standalone mode regardless of path
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=0'
    }
  }
})
