import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Minimal Vite config — useful if you want to run parts with Vite (e.g., component playground)
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
