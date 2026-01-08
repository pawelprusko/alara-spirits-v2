import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // 'base' is tricky: './' works for GitHub Pages but can cause issues on Vercel sub-routes.
  // We use './' to maintain compatibility with both, but the vercel.json handles the routing there.
  base: './', 
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps to save memory/space
  },
  server: {
    headers: {
      'Cache-Control': 'public, max-age=0'
    }
  }
})