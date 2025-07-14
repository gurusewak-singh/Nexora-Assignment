// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    'global': 'window',
  },
  resolve: {
    alias: {
      events: 'events',
      util: 'util',
      buffer: 'buffer',
      stream: 'readable-stream',
      process: 'process/browser', // Yeh line bohot zaroori hai
    },
  },
})