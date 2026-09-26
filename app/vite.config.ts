import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './', // works from any host path (e.g. GitHub Pages /cal-x/)
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: 'Cal-X',
        short_name: 'Cal-X',
        description: 'Calisthenics training and progression',
        theme_color: '#11141a',
        background_color: '#11141a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        importScripts: ['push-sw.js'], // reminder notifications
        // app shell + Latin fonts precached so the app works fully offline
        globPatterns: ['**/*.{js,css,html,png,svg}', '**/*latin-wdth*.woff2'],
      },
    }),
  ],
})
