import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { handleApiRequest } from './server/apiHandler.ts'

function apiMiddlewarePlugin(): Plugin {
  return {
    name: 'share-a-meal-api-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleApiRequest(req, res, { supabaseUrl: process.env.VITE_SUPABASE_URL, supabasePublishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY })
          if (!handled) {
            next()
          }
        } catch (err) {
          next(err)
        }
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        try {
          const handled = await handleApiRequest(req, res, { supabaseUrl: process.env.VITE_SUPABASE_URL, supabasePublishableKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY })
          if (!handled) {
            next()
          }
        } catch (err) {
          next(err)
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))
  return { plugins: [react(), tailwindcss(), apiMiddlewarePlugin()] }
})
