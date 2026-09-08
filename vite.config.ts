import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// Se publica como GitHub Pages en /economia-hogar-app/, por eso el base.
const base = '/economia-hogar-app/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Economía Hogar',
        short_name: 'Economía Hogar',
        description: 'Gastos, ingresos, tarjetas, deudas y ahorro del hogar',
        theme_color: '#15171B',
        background_color: '#15171B',
        display: 'standalone',
        start_url: base,
        scope: base,
        icons: [
          { src: `${base}favicon.svg`, sizes: 'any', type: 'image/svg+xml' },
          { src: `${base}favicon.svg`, sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
