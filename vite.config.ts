import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import noscript from './vite-plugin-noscript'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss(), noscript()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
