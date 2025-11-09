"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
}

export default function NewProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [skuPool, setSkuPool] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    detailedDescription: "",
    price: "",
    cost: "",
    stockQuantity: "",
    sku: "",
    imageUrl: "",
    isActive: true,
    isFeatured: false,
    categoryId: "",
  })

  const supabase = createClient()

  useEffect(() => {
    void bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bootstrap = async () => {
    setLoading(true)
    try {
      const [{ data: categoriesData }, { data: skuData }] = await Promise.all([
        supabase.from("categories").select("id, name").order("name", { ascending: true }),
        supabase.from("products").select("sku").not("sku", "is", null),
      ])

      setCategories(categoriesData || [])

      const skus = (skuData ?? [])
        .map((row: { sku: string | null }) => row.sku)
        .filter((sku: string | null): sku is string => Boolean(sku))
      setSkuPool(skus)

      setFormData((prev) => ({
        ...prev,
        sku: prev.sku || generateNextSku(skus),
      }))
    } catch (error) {
      console.error("Error initializing product form:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (slugEdited) return
    const nextSlug = slugify(formData.name)
    if (formData.slug === nextSlug) return
    setFormData((prev) => ({
      ...prev,
      slug: nextSlug,
    }))
  }, [formData.name, formData.slug, slugEdited])

  const handleInputChange =
    (field: keyof typeof formData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      if (field === "slug") {
        setSlugEdited(true)
      }
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

  const handleCategoryChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      categoryId: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.categoryId || !formData.price || !formData.slug) {
      toast({
        title: "Error",
        description: "Completa los campos obligatorios (nombre, slug, precio y categoría).",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const generatedSku = generateNextSku(skuPool)
      const skuValue = formData.sku?.trim() || generatedSku

      const { error } = await supabase.from("products").insert({
        category_id: formData.categoryId,
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        detailed_description: formData.detailedDescription,
        price: Number.parseFloat(formData.price),
        cost: formData.cost ? Number.parseFloat(formData.cost) : null,
        stock_quantity: Number.parseInt(formData.stockQuantity) || 0,
        sku: skuValue,
        image_url: formData.imageUrl || null,
        is_active: formData.isActive,
        is_featured: formData.isFeatured,
      })

      if (error) throw error

      toast({
        title: "Producto creado",
        description: "El producto ha sido agregado correctamente",
      })

      setSkuPool((prev) => [...prev, skuValue])
      setFormData((prev) => ({
        ...prev,
        sku: generatedSku,
      }))

      router.push("/admin/products")
    } catch (error) {
      console.error("Error creating product:", error)
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
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
          <h1 className="text-3xl font-bold text-[#3D2817]">Nuevo producto</h1>
          <p className="text-sm text-[#6B5D52]">
            Completa los detalles para incorporar un nuevo artículo al catálogo de la tienda.
          </p>
        </div>
      </div>

      <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
        <CardContent className="space-y-5 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={handleInputChange("name")}
                  placeholder="Cuaderno A5 edición limitada"
                  className="border-[#D4C4B0]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Slug *</Label>
                <Input
                  value={formData.slug}
                  onChange={handleInputChange("slug")}
                  placeholder="cuaderno-a5-edicion-limitada"
                  className="border-[#D4C4B0]"
                  required
                />
                <p className="text-xs text-[#8B6F47]">
                  Este valor se usa en la URL pública. Debe ser único, en minúsculas y sin espacios.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Categoría *</Label>
              <Select value={formData.categoryId} onValueChange={handleCategoryChange}>
                <SelectTrigger className="border-[#D4C4B0]">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Precio *</Label>
                <Input
                  value={formData.price}
                  onChange={handleInputChange("price")}
                  type="number"
                  step="0.01"
                  min="0"
                  className="border-[#D4C4B0]"
                  placeholder="35000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Costo</Label>
                <Input
                  value={formData.cost}
                  onChange={handleInputChange("cost")}
                  type="number"
                  step="0.01"
                  min="0"
                  className="border-[#D4C4B0]"
                  placeholder="18000"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Stock</Label>
                <Input
                  value={formData.stockQuantity}
                  onChange={handleInputChange("stockQuantity")}
                  type="number"
                  min="0"
                  className="border-[#D4C4B0]"
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">SKU</Label>
                <Input
                  value={formData.sku}
                  onChange={handleInputChange("sku")}
                  className="border-[#D4C4B0]"
                  placeholder="SKU-001"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Imagen principal</Label>
                <Input
                  value={formData.imageUrl}
                  onChange={handleInputChange("imageUrl")}
                  className="border-[#D4C4B0]"
                  placeholder="https://..."
                  type="url"
                />
                <p className="text-xs text-[#8B6F47]">Puedes usar URLs públicas de Supabase Storage u otros CDNs.</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Descripción corta</Label>
              <Textarea
                value={formData.description}
                onChange={handleInputChange("description")}
                rows={3}
                className="border-[#D4C4B0]"
                placeholder="Resumen breve del producto."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Descripción detallada</Label>
              <Textarea
                value={formData.detailedDescription}
                onChange={handleInputChange("detailedDescription")}
                rows={5}
                className="border-[#D4C4B0]"
                placeholder="Incluye especificaciones técnicas, materiales y usos recomendados."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#3D2817]">Publicar producto</h3>
                  <p className="text-xs text-[#6B5D52]">Si está activo, aparecerá en el catálogo público.</p>
                </div>
                <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))} />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#3D2817]">Marcar como destacado</h3>
                  <p className="text-xs text-[#6B5D52]">Úsalo para mostrar el producto en secciones especiales.</p>
                </div>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFeatured: checked }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]"
                onClick={() => router.push("/admin/products")}
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
                  "Crear producto"
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

function generateNextSku(existingSkus: (string | null)[]) {
  const prefix = "SKU-"
  const numbers = existingSkus
    .map((sku) => {
      if (!sku) return 0
      const match = sku.match(/(\d+)$/)
      return match ? Number.parseInt(match[1]) : 0
    })
    .filter((value) => !Number.isNaN(value))

  const nextNumber = (numbers.length > 0 ? Math.max(...numbers) : 0) + 1
  return `${prefix}${String(nextNumber).padStart(3, "0")}`
}