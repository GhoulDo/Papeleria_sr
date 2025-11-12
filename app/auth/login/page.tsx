"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const {
        data: { user, session },
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) throw loginError
      if (!user) throw new Error("No se pudo iniciar sesión. Intenta nuevamente.")

      // Obtener el rol del usuario
      const { data: profile, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).single()
      if (roleError) {
        console.error("Error obteniendo rol:", roleError)
        // Continuar con rol por defecto si falla
      }

      // Esperar un momento para que el AuthContext se actualice con la nueva sesión
      // Esto asegura que el estado de autenticación esté sincronizado antes de redirigir
      await new Promise(resolve => setTimeout(resolve, 300))

      // Verificar que la sesión esté establecida
      const { data: { session: currentSession } } = await supabase.auth.getSession()
      if (!currentSession) {
        throw new Error("No se pudo establecer la sesión. Intenta nuevamente.")
      }

      // Redirigir según el rol
      const targetRoute = profile?.role === "admin" ? "/admin" : "/dashboard"
      
      // Usar router.push en lugar de replace para mejor manejo de navegación
      router.push(targetRoute)
      
      // Forzar un refresh para asegurar que el AuthContext se actualice
      setTimeout(() => {
        router.refresh()
      }, 100)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión"
      setError(message)
      setLoading(false)
    }
    // No usar finally aquí porque si el login es exitoso, la página se redirige
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F1ED] to-[#8B6F47]/10 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-[#D4C4B0]">
        <CardHeader className="space-y-1 bg-[#F5F1ED]">
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20">
              <Image src="/logo.png" alt="Papelería y Variedades S.R" fill className="object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl text-[#3D2817] text-center">Inicia Sesión</CardTitle>
          <CardDescription className="text-[#8B6F47] text-center">
            Accede a tu cuenta de Papelería y Variedades S.R
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-50 border-[#C85A54]">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-[#C85A54]">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3D2817]">Email</label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="border-[#D4C4B0] focus:border-[#5C4033]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#3D2817]">Contraseña</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="border-[#D4C4B0] focus:border-[#5C4033]"
              />
            </div>

            <Button type="submit" className="w-full bg-[#5C4033] hover:bg-[#3D2817] text-white" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando...
                </>
              ) : (
                "Iniciar Sesión"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-[#8B6F47]">¿No tienes cuenta? </span>
            <Link href="/auth/register" className="text-[#5C4033] hover:underline font-medium">
              Regístrate aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
