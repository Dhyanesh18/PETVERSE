import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: 'all',
    proxy: {
      '/api': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
        configure: (proxy, _options) => {
          proxy.on('error', (err) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req) => {
            console.log('proxy request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/socket.io': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
      '/images': {
        target: 'http://backend:8080',
        changeOrigin: true,
        secure: false,
      },
    }
  }
})