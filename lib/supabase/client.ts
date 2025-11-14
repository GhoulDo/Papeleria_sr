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

    // Validar que la URL de Supabase sea válida
    try {
      const url = new URL(supabaseUrl)
      if (!url.hostname.includes("supabase.co") && !url.hostname.includes("supabase.in")) {
        console.warn(`[Supabase Client] La URL de Supabase parece incorrecta: ${supabaseUrl}`)
      }
    } catch (error) {
      console.error(`[Supabase Client] URL de Supabase inválida: ${supabaseUrl}`, error)
      throw new Error(`La URL de Supabase es inválida: ${supabaseUrl}`)
    }

    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
        // Deshabilitar el auto-refresh si hay problemas de conexión
        // Esto evita intentos infinitos de refrescar tokens cuando la URL es incorrecta
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        flowType: "pkce",
      },
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
      global: {
        // Interceptar errores de fetch para manejar mejor los errores de conexión
        fetch: (url, options = {}) => {
          return fetch(url, options).catch((error) => {
            // Si hay un error de conexión (ERR_NAME_NOT_RESOLVED, etc.), limpiar tokens inválidos
            if (error.message?.includes("Failed to fetch") || 
                error.message?.includes("ERR_NAME_NOT_RESOLVED") ||
                error.message?.includes("NetworkError")) {
              console.warn(`[Supabase Client] Error de conexión al intentar conectar con Supabase: ${url}`)
              // No lanzar el error, solo registrarlo para evitar loops infinitos
              return Promise.reject(new Error("No se pudo conectar con el servidor de autenticación"))
            }
            return Promise.reject(error)
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
