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
      cookies: {
        getAll() {
          if (typeof document === "undefined") return []
          return document.cookie.split("; ").map(cookie => {
            const [name, ...rest] = cookie.split("=")
            return { name, value: decodeURIComponent(rest.join("=")) }
          })
        },
        setAll(cookiesToSet) {
          if (typeof document === "undefined") return
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieValue = encodeURIComponent(value)
            let cookieString = `${name}=${cookieValue}`
            
            if (options?.path) cookieString += `; path=${options.path}`
            if (options?.maxAge) cookieString += `; max-age=${options.maxAge}`
            if (options?.domain) cookieString += `; domain=${options.domain}`
            if (options?.secure) cookieString += `; secure`
            if (options?.sameSite) cookieString += `; samesite=${options.sameSite}`
            if (options?.httpOnly) {
              // httpOnly no se puede establecer desde JavaScript, se ignora
              console.warn(`[Supabase Client] Cookie ${name} tiene httpOnly=true pero no se puede establecer desde el cliente`)
            }
            
            document.cookie = cookieString
          })
        },
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
