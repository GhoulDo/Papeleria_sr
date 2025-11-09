"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CategoryFormState {
  name: string
  slug: string
  description: string
  imageUrl: string
  isActive: boolean
}

const initialState: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  imageUrl: "",
  isActive: true,
}

export default function NewCategoryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [formState, setFormState] = useState<CategoryFormState>(initialState)
  const [saving, setSaving] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)

  useEffect(() => {
    if (slugEdited) return
    const nextSlug = slugify(formState.name)
    if (formState.slug === nextSlug) return
    setFormState((prev) => ({
      ...prev,
      slug: nextSlug,
    }))
  }, [formState.name, formState.slug, slugEdited])

  const handleChange =
    (field: keyof CategoryFormState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      if (field === "slug") {
        setSlugEdited(true)
      }
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
        description: "El slug es necesario para enlazar la categoría.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.from("categories").insert({
        name: formState.name.trim(),
        slug: formState.slug.trim(),
        description: formState.description.trim() || null,
        image_url: formState.imageUrl.trim() || null,
        is_active: formState.isActive,
      })

      if (error) throw error

      toast({
        title: "Categoría creada",
        description: "Ya puedes asignar productos a esta categoría.",
      })

      router.push("/admin/categories")
    } catch (error) {
      console.error("Error creating category:", error)
      toast({
        title: "No se pudo crear",
        description: "Revisa los datos ingresados o inténtalo más tarde.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-3xl font-bold text-[#3D2817]">Nueva categoría</h1>
          <p className="text-sm text-[#6B5D52]">
            Crea categorías para organizar el catálogo y facilitar el registro de productos.
          </p>
        </div>
      </div>

      <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-[#3D2817]">Información principal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Nombre *</Label>
              <Input
                value={formState.name}
                onChange={handleChange("name")}
                placeholder="Ej. Cuadernos y libretas"
                className="border-[#D4C4B0] bg-white/70"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Slug *</Label>
              <Input
                value={formState.slug}
                onChange={handleChange("slug")}
                placeholder="cuadernos-libretas"
                className="border-[#D4C4B0] bg-white/70"
                required
              />
              <p className="text-xs text-[#8B6F47]">
                El slug debe ser único. Se usa en las URLs públicas (por ejemplo, <strong>/categories/tu-slug</strong>).
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Descripción</Label>
              <Textarea
                value={formState.description}
                onChange={handleChange("description")}
                placeholder="Describe qué productos pertenecen a esta categoría y cómo se diferencian."
                rows={4}
                className="border-[#D4C4B0] bg-white/70"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">URL de imagen</Label>
              <Input
                value={formState.imageUrl}
                onChange={handleChange("imageUrl")}
                placeholder="https://..."
                className="border-[#D4C4B0] bg-white/70"
                type="url"
              />
              <p className="text-xs text-[#8B6F47]">
                Opcional. Puedes cargar imágenes desde Supabase Storage o un CDN y pegar la URL pública aquí.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-[#3D2817]">Categoría activa</h3>
                <p className="text-xs text-[#6B5D52]">Si está activa, estará disponible para los clientes.</p>
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
                  "Crear categoría"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

