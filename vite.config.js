import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En Vercel la web va en la raíz; en GitHub Pages, bajo /casatere/ (BASE_PATH lo pone el workflow)
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
