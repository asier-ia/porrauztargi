import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_STATIC_MODE === 'true' ? '/porrauztargi/' : '/',
  plugins: [react()],
  server: {
    allowedHosts: true
  }
})
