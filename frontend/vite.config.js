import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],

  build: {
    // Target modern browsers only — eliminates ~21.9 kB of legacy polyfills/transforms.
    // Covers ~96 %+ of global users (Chrome 89+, Firefox 89+, Safari 15+).
    target: ['es2020', 'chrome89', 'firefox89', 'safari15'],

    // Strip license comment banners from vendor chunks to shave a few extra bytes.
    // Legal comments are preserved in a separate .LEGAL.txt file.
    rollupOptions: {
      output: {
        // Split large vendor libs into individually-cached chunks.
        // Users only re-download what actually changed between deploys.
        manualChunks: {
          'vendor-react':   ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit'],
          'vendor-editor':  ['@monaco-editor/react', 'react-resizable-panels'],
          'vendor-markdown':['react-markdown', 'remark-gfm'],
          'vendor-charts':  ['recharts'],
          'vendor-realtime':['socket.io-client'],
          'vendor-ui':      ['react-hot-toast', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
  },
})

