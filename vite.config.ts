import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    historyApiFallback: true,
  },
  preview: {
    port: 8080,
    host: "::",
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'robots.txt',
        'pwa/manifest-icon-192.png',
        'pwa/manifest-icon-512.png',
        'pwa/apple-icon-180.png'
      ],
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      manifest: {
        id: '/',
        start_url: '/',
        scope: '/',
        name: 'GrapeBD-G2G',
        short_name: 'GrapeBD',
        description: 'Gift to Gift Program',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa/manifest-icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa/manifest-icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa/manifest-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa/apple-icon-180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon',
          }
        ]
      }
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
