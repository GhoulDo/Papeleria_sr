import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const require = createRequire(import.meta.url)
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.in',
      },
      {
        protocol: 'https',
        hostname: 'tse1.mm.bing.net',
      },
      {
        protocol: 'https',
        hostname: '**.bing.net',
      },
      {
        protocol: 'https',
        hostname: 'http2.mlstatic.com',
      },
      {
        protocol: 'https',
        hostname: '**.mlstatic.com',
      },
    ],
  },
  // Configurar Turbopack para evitar conflictos con webpack
  turbopack: {},
  // Mantener webpack para desarrollo si es necesario (usar --webpack flag)
  webpack: (config, { isServer }) => {
    // Configurar webpack para que turn.js pueda encontrar jQuery
    if (!isServer) {
      try {
        const jqueryPath = require.resolve('jquery')
        
        // Alias para que require('jquery') resuelva al mismo jQuery
        config.resolve.alias = {
          ...config.resolve.alias,
          jquery: jqueryPath,
        }
        
        // ProvidePlugin: hacer que jQuery esté disponible globalmente cuando se requiere
        // Esto asegura que turn.js use el mismo jQuery que está en window.jQuery
        const webpack = require('webpack')
        config.plugins = [
          ...(config.plugins || []),
          new webpack.ProvidePlugin({
            $: jqueryPath,
            jQuery: jqueryPath,
            'window.jQuery': jqueryPath,
            'window.$': jqueryPath,
          }),
        ]
      } catch (error) {
        console.warn('jQuery not found in node_modules, webpack configuration not set')
      }
    }
    return config
  },
}

export default nextConfig

