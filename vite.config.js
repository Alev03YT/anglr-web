import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages friendly:
// - base './' works for project pages
// - HashRouter avoids 404 on refresh
export default defineConfig({
  base: './',
  plugins: [react()],
})
