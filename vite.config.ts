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
      devOptions: {
        enabled: true,
        type: 'module'
      },
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/[^\/]+\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      manifest: {
        id: 'grapebd-g2g',
        start_url: '/',
        scope: '/',
        name: 'GrapeBD-G2G',
        short_name: 'GrapeBD',
        description: 'Gift to Gift Program',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        display_override: ['window-controls-overlay', 'standalone'],
        orientation: 'portrait',
        categories: ['social', 'lifestyle'],
        shortcuts: [
          {
            name: 'মেসেজ',
            short_name: 'মেসেজ',
            description: 'মেসেজ দেখুন',
            url: '/messages',
            icons: [{ src: '/pwa/manifest-icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'প্রোফাইল',
            short_name: 'প্রোফাইল',
            description: 'আপনার প্রোফাইল',
            url: '/profile',
            icons: [{ src: '/pwa/manifest-icon-192.png', sizes: '192x192' }]
          }
        ],
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
