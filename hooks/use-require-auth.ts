"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

/**
 * Hook para proteger rutas que requieren autenticación
 * @param requiredRole - Rol requerido ("admin" o "customer"). Si no se especifica, solo requiere autenticación
 * @returns Objeto con estado de autenticación y autorización
 */
export function useRequireAuth(requiredRole?: "admin" | "customer") {
  const { user, loading, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // No hacer nada mientras carga
    if (loading) return

    // Si no hay usuario, redirigir a login
    if (!user) {
      router.replace("/auth/login")
      return
    }

    // Si se requiere rol admin y el usuario no es admin
    if (requiredRole === "admin" && userRole !== "admin") {
      router.replace("/dashboard")
      return
    }

    // Si se requiere rol customer y el usuario es admin (opcional: redirigir admins)
    // Por ahora permitimos que admins accedan a rutas de customer
  }, [user, loading, userRole, requiredRole, router])

  return {
    user,
    loading,
    userRole,
    isAuthorized: !!user && (!requiredRole || userRole === requiredRole),
  }
}

