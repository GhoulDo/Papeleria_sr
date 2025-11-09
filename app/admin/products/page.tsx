"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  CircleCheck,
  CircleDashed,
  Sparkles,
  Store,
  Filter,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ProductRow {
  id: string
  name: string
  slug: string
  price: number
  stock_quantity: number
  is_active: boolean
  is_featured: boolean
  category_id: string
  image_url: string | null
  category: {
    name: string
  } | null
  created_at: string
  updated_at: string
}

interface Category {
  id: string
  name: string
}

type StatusFilter = "all" | "active" | "inactive"
type FeaturedFilter = "all" | "featured" | "regular"

export default function ProductsAdminPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [products, setProducts] = useState<ProductRow[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [featuredFilter, setFeaturedFilter] = useState<FeaturedFilter>("all")
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    void bootstrap()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      void fetchProducts({ silent: true })
    }, 250)
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, selectedCategory, statusFilter, featuredFilter])

  const bootstrap = async () => {
    try {
      setLoading(true)
      const [{ data: cats }] = await Promise.all([
        supabase.from("categories").select("id, name").order("name", { ascending: true }),
        fetchProducts(),
      ])
      setCategories(cats ?? [])
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      let query = supabase
        .from("products")
        .select("*, category:categories(name)")
        .order("created_at", { ascending: false })

      if (selectedCategory !== "all") {
        query = query.eq("category_id", selectedCategory)
      }

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active")
      }

      if (featuredFilter !== "all") {
        query = query.eq("is_featured", featuredFilter === "featured")
      }

      if (search.trim()) {
        query = query.or(
          `name.ilike.%${search.trim()}%,slug.ilike.%${search.trim()}%,sku.ilike.%${search
            .trim()
            .toUpperCase()}%`,
        )
      }

      const { data, error } = await query

      if (error) throw error
      setProducts(data ?? [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error al cargar",
        description: "No fue posible obtener el listado de productos.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredCount = useMemo(() => products.length, [products])

  const handleToggleActive = async (product: ProductRow) => {
    setProcessingId(product.id)
    try {
      const { error } = await supabase.from("products").update({ is_active: !product.is_active }).eq("id", product.id)
      if (error) throw error
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, is_active: !product.is_active } : item)),
      )
      toast({
        title: `Producto ${!product.is_active ? "activado" : "desactivado"}`,
        description: `${product.name} ahora está ${!product.is_active ? "visible" : "oculto"} en la tienda.`,
      })
    } catch (error) {
      console.error("Error toggling product:", error)
      toast({
        title: "No se pudo actualizar",
        description: "Intenta nuevamente en unos segundos.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleToggleFeatured = async (product: ProductRow) => {
    setProcessingId(product.id)
    try {
      const { error } = await supabase.from("products").update({ is_featured: !product.is_featured }).eq("id", product.id)
      if (error) throw error
      setProducts((prev) =>
        prev.map((item) => (item.id === product.id ? { ...item, is_featured: !product.is_featured } : item)),
      )
      toast({
        title: product.is_featured ? "Producto sin destacar" : "Producto destacado",
        description: `${product.name} ${product.is_featured ? "ya no aparece" : "aparece"} en secciones destacadas.`,
      })
    } catch (error) {
      console.error("Error toggling featured:", error)
      toast({
        title: "No se pudo actualizar",
        description: "Verifica la conexión y vuelve a intentarlo.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (product: ProductRow) => {
    const confirmed = window.confirm(
      `¿Eliminar el producto "${product.name}"?\nLos registros de órdenes conservarán la información existente.`,
    )
    if (!confirmed) return

    setProcessingId(product.id)
    try {
      const { error } = await supabase.from("products").delete().eq("id", product.id)
      if (error) throw error
      setProducts((prev) => prev.filter((item) => item.id !== product.id))
      toast({
        title: "Producto eliminado",
        description: `${product.name} fue removido del catálogo.`,
      })
    } catch (error) {
      console.error("Error deleting product:", error)
      toast({
        title: "No se pudo eliminar",
        description: "Verifica que no existan dependencias y vuelve a intentarlo.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 px-4 py-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Badge className="bg-[#5C4033] text-white uppercase tracking-[0.3em]">Inventario</Badge>
          <h1 className="text-4xl font-bold text-[#3D2817]">Gestión de productos</h1>
          <p className="max-w-2xl text-sm text-[#6B5D52]">
            Administra el catálogo, controla el estado de publicación, destaca artículos clave y revisa existencias de
            forma centralizada.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]"
            onClick={() => fetchProducts({ silent: true })}
            disabled={refreshing}
          >
            <Filter className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Actualizar lista
          </Button>
          <Button asChild className="bg-[#5C4033] hover:bg-[#3D2817] text-white">
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo producto
            </Link>
          </Button>
        </div>
      </header>

      <Card className="mx-auto w-full max-w-6xl border-[#E1D5C8] bg-white/90 backdrop-blur">
        <CardContent className="space-y-5 p-6">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="relative md:col-span-2">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre, slug o SKU..."
                className="h-11 border-[#D4C4B0] bg-white/70 pr-10"
              />
              <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B6F47]" />
            </div>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-11 w-full border-[#D4C4B0] bg-white/70 text-[#5C4033]">
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="h-11 w-full border-[#D4C4B0] bg-white/70 text-[#5C4033]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="active">Activos</SelectItem>
                <SelectItem value="inactive">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={featuredFilter} onValueChange={(value: FeaturedFilter) => setFeaturedFilter(value)}>
              <SelectTrigger className="h-11 w-full border-[#D4C4B0] bg-white/70 text-[#5C4033]">
                <SelectValue placeholder="Destacados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los productos</SelectItem>
                <SelectItem value="featured">Solo destacados</SelectItem>
                <SelectItem value="regular">No destacados</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3 text-sm text-[#6B5D52]">
            <div className="flex flex-wrap items-center gap-2">
              <Store className="h-4 w-4 text-[#5C4033]" />
              {filteredCount === 0 ? (
                <span>No se encontraron productos con los filtros aplicados.</span>
              ) : (
                <span>
                  Mostrando <strong className="text-[#3D2817]">{filteredCount}</strong>{" "}
                  {filteredCount === 1 ? "producto" : "productos"} filtrados.
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredCount === 0 ? (
        <Card className="mx-auto w-full max-w-6xl border-dashed border-[#D4C4B0] bg-[#F5F1ED]/60 py-16 text-center">
          <CardContent className="space-y-3">
            <Sparkles className="mx-auto h-10 w-10 text-[#8B6F47]" />
            <h3 className="text-2xl font-semibold text-[#3D2817]">No hay productos disponibles</h3>
            <p className="text-sm text-[#6B5D52]">Prueba ajustando los filtros o crea un nuevo producto.</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="mx-auto w-full max-w-6xl rounded-3xl border border-[#E1D5C8] bg-white/80 backdrop-blur">
          <div className="divide-y divide-[#F1E6D8]">
            {products.map((product) => {
              const isProcessing = processingId === product.id
              return (
                <div key={product.id} className="grid gap-4 p-5 transition hover:bg-[#FBF7F2]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-1 gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#E1D5C8] bg-[#F5F1ED]">
                        {product.image_url ? (
                          <Image src={product.image_url} alt={product.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[#8B6F47]">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-semibold text-[#3D2817]">{product.name}</h3>
                          <Badge
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                              product.is_active ? "bg-[#5C4033] text-white" : "bg-[#E8DFD5] text-[#5C4033]",
                            )}
                          >
                            {product.is_active ? "Publicado" : "Oculto"}
                          </Badge>
                          {product.is_featured && (
                            <Badge className="rounded-full bg-[#C97D2E] text-white">Destacado</Badge>
                          )}
                        </div>
                        <p className="text-sm text-[#6B5D52]">
                          {product.category?.name || "Sin categoría"} • Precio:{" "}
                          <span className="font-semibold text-[#3D2817]">
                            ${Number(product.price).toLocaleString("es-CO")}
                          </span>{" "}
                          • Stock: {product.stock_quantity}
                        </p>
                        <p className="text-xs text-[#8B6F47]">
                          Creado el{" "}
                          {new Date(product.created_at).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                          . Última actualización:{" "}
                          {new Date(product.updated_at).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant={product.is_active ? "outline" : "default"}
                        className={cn(
                          "border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]",
                          !product.is_active && "bg-[#5C4033] text-white hover:bg-[#3D2817]",
                        )}
                        size="sm"
                        onClick={() => handleToggleActive(product)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : product.is_active ? (
                          <CircleDashed className="mr-2 h-4 w-4" />
                        ) : (
                          <CircleCheck className="mr-2 h-4 w-4" />
                        )}
                        {product.is_active ? "Ocultar" : "Publicar"}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        className={cn(
                          "bg-[#F5F1ED] text-[#5C4033] hover:bg-[#E8DFD5]",
                          product.is_featured && "bg-[#C97D2E]/10 text-[#C97D2E]",
                        )}
                        onClick={() => handleToggleFeatured(product)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        {product.is_featured ? "Quitar Destacado" : "Destacar"}
                      </Button>

                      <Button asChild size="sm" variant="outline" className="border-[#D4C4B0] text-[#5C4033]">
                        <Link href={`/admin/products/${product.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="bg-[#C85A54] hover:bg-[#b24d48]"
                        onClick={() => handleDelete(product)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
