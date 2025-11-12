"use client"

import type React from "react"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, userRole, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!user || userRole !== "admin")) {
      router.replace("/dashboard")
    }
  }, [loading, user, userRole, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!user || userRole !== "admin") {
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
      <div className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex gap-4 overflow-x-auto">
            <Button asChild variant="ghost">
              <Link href="/admin">Dashboard</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/products">Productos</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/categories">Categorías</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/users">Usuarios</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/promotions">Promociones</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/orders">Órdenes</Link>
            </Button>
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
