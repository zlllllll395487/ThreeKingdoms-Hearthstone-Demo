import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './', // 相对路径 · 让构建产物能在任意目录被静态服务
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // 5173 被 Windows 列入保留端口（Hyper-V/WSL/Docker），报 EACCES，改用 5174
    port: 5174,
    host: true, // 监听局域网 IP，手机同 WiFi 也能访问 dev
  },
})
