"use client"

import { createBrowserClient } from "@supabase/ssr"

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null

// Validar variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "❌ Error: Las variables de entorno de Supabase no están configuradas.\n" +
      "Por favor, asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en tu archivo .env.local"
  )
}

export function createClient() {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "Las variables de entorno de Supabase no están configuradas. Por favor, verifica tu archivo .env.local"
      )
    }

    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        flowType: "pkce",
      },
    })
  }
  return supabaseClient
}

export function getClient() {
  if (!supabaseClient) {
    return createClient()
  }
  return supabaseClient
}
