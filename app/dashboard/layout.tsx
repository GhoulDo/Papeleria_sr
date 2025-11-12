"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Dar un pequeño delay para permitir que el AuthContext se sincronice después del login
    const checkAuth = setTimeout(() => {
      if (!loading && !user) {
        router.replace("/auth/login")
      }
    }, 100)

    return () => clearTimeout(checkAuth)
  }, [loading, user, router])

  // Mostrar loading solo si realmente está cargando Y no hay usuario
  // Si hay usuario pero loading es true, mostrar el contenido (puede ser una actualización)
  if (loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Si no hay usuario después de cargar, redirigir (pero mostrar contenido mientras tanto)
  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
    </div>
  )
}
