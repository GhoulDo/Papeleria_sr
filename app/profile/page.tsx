"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  id: string
  email: string
  full_name: string
  phone: string
  address: string
  city: string
  postal_code: string
  country: string
  avatar_url: string
}

export default function ProfilePage() {
  const { user, loading: authLoading } = useRequireAuth()
  const { toast } = useToast()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

        if (error) throw error

        setProfile(data)
        setFormData({
          fullName: data.full_name || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          postalCode: data.postal_code || "",
          country: data.country || "",
        })
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el perfil",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user, supabase, toast])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from("users")
        .update({
          full_name: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country,
        })
        .eq("id", user?.id)

      if (error) throw error

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados correctamente",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Mi Perfil</h1>
          <p className="text-muted-foreground mt-2">Actualiza tu información personal y dirección</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={profile?.email || ""} disabled className="mt-2" />
                <p className="text-xs text-muted-foreground mt-1">No se puede cambiar</p>
              </div>
              <div>
                <label className="text-sm font-medium">Nombre Completo</label>
                <Input name="fullName" value={formData.fullName} onChange={handleInputChange} className="mt-2" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Teléfono</label>
              <Input name="phone" value={formData.phone} onChange={handleInputChange} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dirección de Envío</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Dirección</label>
              <Input name="address" value={formData.address} onChange={handleInputChange} className="mt-2" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Ciudad</label>
                <Input name="city" value={formData.city} onChange={handleInputChange} className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">Código Postal</label>
                <Input name="postalCode" value={formData.postalCode} onChange={handleInputChange} className="mt-2" />
              </div>
              <div>
                <label className="text-sm font-medium">País</label>
                <Input name="country" value={formData.country} onChange={handleInputChange} className="mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} size="lg" className="w-full md:w-auto">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </>
          )}
        </Button>
      </div>
      </div>
    </div>
  )
}
