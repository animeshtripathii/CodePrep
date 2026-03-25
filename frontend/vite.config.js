import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [ tailwindcss(),react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit'],
          editor: ['@monaco-editor/react', 'react-resizable-panels'],
          markdown: ['react-markdown', 'remark-gfm'],
          charts: ['recharts'],
          realtime: ['socket.io-client'],
          ui: ['react-hot-toast', 'clsx'],
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
