// Builds the Appraisal portal (appraisal.sistec.ac.in) from this repo.
//   npm run dev:appraisal    → http://localhost:5174
//   npm run build:appraisal  → dist-appraisal/ (deploy as its own static site)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: path.resolve(__dirname, 'appraisal-portal'),
  envDir: __dirname,
  // Its own cache, so it can run next to MILE's dev server without the two
  // overwriting each other's pre-bundled dependencies.
  cacheDir: path.resolve(__dirname, 'node_modules/.vite-appraisal'),
  // MILE's public folder (slider images etc.) is not needed here.
  publicDir: false,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-appraisal'),
    emptyOutDir: true,
  },
  server: {
    port: 5174,
    fs: { allow: [__dirname] },
    proxy: {
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
    },
  },
})
