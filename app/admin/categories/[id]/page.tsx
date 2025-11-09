"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CategoryRecord {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function EditCategoryPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const { toast } = useToast()
  const supabase = createClient()

  const [category, setCategory] = useState<CategoryRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formState, setFormState] = useState({
    name: "",
    slug: "",
    description: "",
    imageUrl: "",
    isActive: true,
  })

  useEffect(() => {
    void fetchCategory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchCategory = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("categories").select("*").eq("id", params.id).single()

      if (error) throw error
      if (!data) {
        toast({
          title: "Categoría no encontrada",
          description: "No pudimos localizar la categoría solicitada.",
          variant: "destructive",
        })
        router.push("/admin/categories")
        return
      }

      setCategory(data)
      setFormState({
        name: data.name ?? "",
        slug: data.slug ?? "",
        description: data.description ?? "",
        imageUrl: data.image_url ?? "",
        isActive: data.is_active ?? true,
      })
    } catch (error) {
      console.error("Error fetching category:", error)
      toast({
        title: "Error al cargar",
        description: "No se pudo cargar la categoría.",
        variant: "destructive",
      })
      router.push("/admin/categories")
    } finally {
      setLoading(false)
    }
  }

  const handleChange =
    (field: "name" | "slug" | "description" | "imageUrl") =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      setFormState((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

  const handleToggleActive = (checked: boolean) => {
    setFormState((prev) => ({ ...prev, isActive: checked }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!category) return

    if (!formState.name.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Ingresa un nombre para la categoría.",
        variant: "destructive",
      })
      return
    }

    if (!formState.slug.trim()) {
      toast({
        title: "Slug requerido",
        description: "El slug no puede quedar en blanco.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase
        .from("categories")
        .update({
          name: formState.name.trim(),
          slug: formState.slug.trim(),
          description: formState.description.trim() || null,
          image_url: formState.imageUrl.trim() || null,
          is_active: formState.isActive,
        })
        .eq("id", category.id)

      if (error) throw error

      toast({
        title: "Cambios guardados",
        description: "La categoría se actualizó correctamente.",
      })

      router.push("/admin/categories")
    } catch (error) {
      console.error("Error updating category:", error)
      toast({
        title: "No se pudo actualizar",
        description: "Revisa los datos e inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
      </div>
    )
  }

  if (!category) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="text-right space-y-1">
          <h1 className="text-3xl font-bold text-[#3D2817]">Editar categoría</h1>
          <p className="text-sm text-[#6B5D52]">
            Modifica los datos principales, ajusta la disponibilidad o actualiza la imagen de portada.
          </p>
        </div>
      </div>

      <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-[#3D2817]">Detalles de {category.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Nombre *</Label>
              <Input
                value={formState.name}
                onChange={handleChange("name")}
                className="border-[#D4C4B0] bg-white/70"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Slug *</Label>
              <Input
                value={formState.slug}
                onChange={handleChange("slug")}
                className="border-[#D4C4B0] bg-white/70"
                required
              />
              <p className="text-xs text-[#8B6F47]">
                Se recomienda que sea corto, sin espacios y en minúsculas. Ejemplo: <strong>papeleria-creativa</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Descripción</Label>
              <Textarea
                value={formState.description}
                onChange={handleChange("description")}
                className="border-[#D4C4B0] bg-white/70"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">URL de imagen</Label>
              <Input
                value={formState.imageUrl}
                onChange={handleChange("imageUrl")}
                placeholder="https://..."
                type="url"
                className="border-[#D4C4B0] bg-white/70"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-[#3D2817]">Categoría activa</h3>
                <p className="text-xs text-[#6B5D52]">
                  Si desactivas la categoría, los productos asociados dejarán de mostrarse en la tienda.
                </p>
              </div>
              <Switch checked={formState.isActive} onCheckedChange={handleToggleActive} />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]"
                onClick={() => router.push("/admin/categories")}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#5C4033] text-white hover:bg-[#3D2817]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

