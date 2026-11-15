import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    // 端口固定，避免被占用时自动漂移导致地址变化
    strictPort: true,
  },
})
