"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { getClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Image from "next/image"

type UserRole = "customer" | "admin"

export default function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>("customer")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = getClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.includes("@")) {
      setError("Por favor ingresa un email válido")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: fullName,
            role,
          },
        },
      })

      if (signUpError) throw signUpError

      if (authData.user) {
        const { data: existingUser } = await supabase.from("users").select("id").eq("email", email).single()

        if (!existingUser) {
          const { error: profileError } = await supabase.from("users").insert({
            id: authData.user.id,
            email: email.toLowerCase(),
            full_name: fullName,
            role,
          })

          if (profileError) throw profileError
        }

        const { error: cartError } = await supabase.from("carts").insert({
          user_id: authData.user.id,
        })

        if (cartError && !cartError.message.includes("duplicate")) {
          throw cartError
        }
      }

      router.replace(role === "admin" ? "/admin" : "/dashboard")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al registrarse"
      setError(message)
      console.error("[v0] Registration error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="relative w-20 h-20">
              <Image src="/logo.png" alt="Papelería y Variedades S.R" fill className="object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Crear Cuenta</CardTitle>
          <CardDescription className="text-center">Únete a nuestra tienda de papelería en línea</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium">Nombre Completo</Label>
              <Input
                type="text"
                placeholder="Juan Pérez"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Email</Label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Confirmar Contraseña</Label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo de Usuario</Label>
              <Select value={role} onValueChange={(value: UserRole) => setRole(value)} disabled={loading}>
                <SelectTrigger className="border-[#D4C4B0]">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">Usuario</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecciona “Administrador” solo para crear cuentas de gestión interna. Esta opción es temporal.
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes cuenta? </span>
            <Link href="/auth/login" className="text-primary hover:underline font-medium">
              Inicia sesión aquí
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
