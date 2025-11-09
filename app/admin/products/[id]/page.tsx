"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: string
  name: string
}

interface ProductRecord {
  id: string
  name: string
  slug: string
  description: string | null
  detailed_description: string | null
  price: number
  cost: number | null
  stock_quantity: number
  sku: string | null
  image_url: string | null
  is_active: boolean
  is_featured: boolean
  category_id: string
  created_at: string
  updated_at: string
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const supabase = createClient()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [product, setProduct] = useState<ProductRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [slugEdited, setSlugEdited] = useState(false)

  const [formState, setFormState] = useState({
    name: "",
    slug: "",
    categoryId: "",
    description: "",
    detailedDescription: "",
    price: "",
    cost: "",
    stockQuantity: "",
    sku: "",
    imageUrl: "",
    isActive: true,
    isFeatured: false,
  })

  useEffect(() => {
    void bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    if (!slugEdited) {
      setFormState((prev) => ({
        ...prev,
        slug: slugify(prev.name),
      }))
    }
  }, [formState.name, slugEdited])

  const bootstrap = async () => {
    setLoading(true)
    try {
      const [{ data: categoriesData }, { data: productData, error: productError }] = await Promise.all([
        supabase.from("categories").select("id, name").order("name", { ascending: true }),
        supabase.from("products").select("*").eq("id", params.id).single(),
      ])

      if (categoriesData) {
        setCategories(categoriesData)
      }

      if (productError || !productData) {
        toast({
          title: "Producto no encontrado",
          description: "No pudimos localizar el producto solicitado.",
          variant: "destructive",
        })
        router.push("/admin/products")
        return
      }

      setProduct(productData as ProductRecord)
      setFormState({
        name: productData.name ?? "",
        slug: productData.slug ?? "",
        categoryId: productData.category_id ?? "",
        description: productData.description ?? "",
        detailedDescription: productData.detailed_description ?? "",
        price: productData.price ? String(productData.price) : "",
        cost: productData.cost ? String(productData.cost) : "",
        stockQuantity: productData.stock_quantity ? String(productData.stock_quantity) : "",
        sku: productData.sku ?? "",
        imageUrl: productData.image_url ?? "",
        isActive: productData.is_active,
        isFeatured: productData.is_featured,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange =
    (field: keyof typeof formState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      if (field === "slug") {
        setSlugEdited(true)
      }
      setFormState((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

  const handleCategoryChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      categoryId: value,
    }))
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!product) return

    if (!formState.name || !formState.slug || !formState.categoryId || !formState.price) {
      toast({
        title: "Campos incompletos",
        description: "Ingresa nombre, slug, precio y categoría para continuar.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: formState.name.trim(),
          slug: formState.slug.trim(),
          category_id: formState.categoryId,
          description: formState.description.trim() || null,
          detailed_description: formState.detailedDescription.trim() || null,
          price: Number.parseFloat(formState.price),
          cost: formState.cost ? Number.parseFloat(formState.cost) : null,
          stock_quantity: Number.parseInt(formState.stockQuantity || "0"),
          sku: formState.sku?.trim() || null,
          image_url: formState.imageUrl?.trim() || null,
          is_active: formState.isActive,
          is_featured: formState.isFeatured,
        })
        .eq("id", product.id)

      if (error) throw error

      toast({
        title: "Producto actualizado",
        description: "Los cambios se guardaron correctamente.",
      })
      router.push("/admin/products")
    } catch (error) {
      console.error("Error updating product:", error)
      toast({
        title: "No se pudo actualizar",
        description: "Revise los datos e inténtelo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
      </div>
    )
  }

  if (!product) {
    return null
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
          <h1 className="text-3xl font-bold text-[#3D2817]">Editar producto</h1>
          <p className="text-sm text-[#6B5D52]">
            Ajusta los datos del artículo. Los cambios se reflejan inmediatamente en la tienda.
          </p>
        </div>
      </div>

      <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
        <CardContent className="space-y-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Nombre *</Label>
                <Input
                  value={formState.name}
                  onChange={handleInputChange("name")}
                  className="border-[#D4C4B0]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Slug *</Label>
                <Input
                  value={formState.slug}
                  onChange={handleInputChange("slug")}
                  className="border-[#D4C4B0]"
                  required
                />
                <p className="text-xs text-[#8B6F47]">
                  URL pública: <strong>/products/{formState.slug || "tu-slug"}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Categoría *</Label>
              <Select value={formState.categoryId} onValueChange={handleCategoryChange}>
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
                  value={formState.price}
                  onChange={handleInputChange("price")}
                  type="number"
                  step="0.01"
                  min="0"
                  className="border-[#D4C4B0]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Costo</Label>
                <Input
                  value={formState.cost}
                  onChange={handleInputChange("cost")}
                  type="number"
                  step="0.01"
                  min="0"
                  className="border-[#D4C4B0]"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Stock</Label>
                <Input
                  value={formState.stockQuantity}
                  onChange={handleInputChange("stockQuantity")}
                  type="number"
                  min="0"
                  className="border-[#D4C4B0]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">SKU</Label>
                <Input value={formState.sku} onChange={handleInputChange("sku")} className="border-[#D4C4B0]" />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Imagen principal</Label>
                <Input
                  value={formState.imageUrl}
                  onChange={handleInputChange("imageUrl")}
                  className="border-[#D4C4B0]"
                  placeholder="https://..."
                  type="url"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Descripción corta</Label>
              <Textarea
                value={formState.description}
                onChange={handleInputChange("description")}
                rows={3}
                className="border-[#D4C4B0]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Descripción detallada</Label>
              <Textarea
                value={formState.detailedDescription}
                onChange={handleInputChange("detailedDescription")}
                rows={5}
                className="border-[#D4C4B0]"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#3D2817]">Producto activo</h3>
                  <p className="text-xs text-[#6B5D52]">Controla si aparece en el catálogo público.</p>
                </div>
                <Switch
                  checked={formState.isActive}
                  onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#3D2817]">Producto destacado</h3>
                  <p className="text-xs text-[#6B5D52]">Ideal para campañas especiales o carruseles destacados.</p>
                </div>
                <Switch
                  checked={formState.isFeatured}
                  onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isFeatured: checked }))}
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

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
}

