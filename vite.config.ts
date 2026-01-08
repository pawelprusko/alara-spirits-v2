import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // VERCEL CONFIGURATION:
  // Vercel hosts at the root domain (e.g., app.vercel.app), so we use '/'
  base: '/', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    // CRITICAL FIX FOR MOBILE BLACK SCREEN:
    // This translates modern code to older JavaScript that all phones understand.
    target: 'es2015', 
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=0'
    }
  }
})
