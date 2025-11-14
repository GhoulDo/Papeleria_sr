import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// Timeout para evitar que el middleware tarde demasiado (2 segundos máximo)
// Vercel tiene un límite de 10 segundos para middleware, pero es mejor ser más conservador
const MIDDLEWARE_TIMEOUT = 2000

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Excluir archivos estáticos y rutas de API
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/api/") ||
    pathname === "/favicon.ico" ||
    /\.(png|svg|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot)$/.test(pathname)
  ) {
    return NextResponse.next()
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
          },
        },
      },
    )

    // IMPORTANT: DO NOT REMOVE auth.getUser()
    // Agregar timeout para evitar que el middleware tarde demasiado
    const getUserPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), MIDDLEWARE_TIMEOUT)
    )

    // Usar Promise.race para aplicar timeout
    await Promise.race([getUserPromise, timeoutPromise])
  } catch (error) {
    // Si hay un error o timeout, continuar con la respuesta sin bloquear
    // Esto evita que el middleware cause timeouts en producción
    if (process.env.NODE_ENV === "development") {
      console.warn("[Middleware] Error or timeout getting user:", error instanceof Error ? error.message : error)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api routes
     * - archivos estáticos (se excluyen en el código del middleware)
     */
    "/(.*)",
  ],
}
