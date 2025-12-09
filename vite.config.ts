import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';

// Генерируем метку времени сборки
const now = new Date();

// Формируем компоненты даты
const year = now.getFullYear().toString().slice(-2); // 24
const month = (now.getMonth() + 1).toString().padStart(2, '0'); // 12
const day = now.getDate().toString().padStart(2, '0'); // 09
const hour = now.getHours().toString().padStart(2, '0'); // 10
const minute = now.getMinutes().toString().padStart(2, '0'); // 26
const second = now.getSeconds().toString().padStart(2, '0'); // 00

// Собираем в формат YYMMDD-HHmmss
const buildVersion = `${year}${month}${day}-${hour}${minute}${second}`;

export default defineConfig({
  base: './',
  define: {
    '__APP_VERSION__': JSON.stringify(buildVersion),
  },
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Игра Семечки (19)',
        short_name: 'Семечки',
        description: 'Классическая логическая игра с цифрами',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: './',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp3}']
      }
    })
  ]
});