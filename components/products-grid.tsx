"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ProductCard } from "./product-card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Search, SlidersHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

interface Category {
  id: string
  name: string
  slug: string
}

interface Product {
  id: string
  name: string
  slug: string
  price: number
  image_url: string | null
  rating: number
  reviews_count: number
  stock_quantity: number
}

interface ProductsGridProps {
  defaultCategoryId?: string | null
  hideCategoryFilter?: boolean
  className?: string
  headline?: {
    title?: string
    description?: string
  }
}

export function ProductsGrid({
  defaultCategoryId = null,
  hideCategoryFilter = false,
  className,
  headline,
}: ProductsGridProps) {
  const normalizedDefaultCategory = defaultCategoryId ?? "all"
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>(normalizedDefaultCategory)
  const [sortBy, setSortBy] = useState<string>("newest")

  const supabase = createClient()

  useEffect(() => {
    setSelectedCategory(normalizedDefaultCategory)
  }, [normalizedDefaultCategory])

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true)
      try {
        const { data: categoriesData, error } = await supabase
          .from("categories")
          .select("id, name, slug")
          .eq("is_active", true)
          .order("name", { ascending: true })

        if (error) throw error
        setCategories(categoriesData || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true)
      try {
        let query = supabase.from("products").select("*").eq("is_active", true)

        if (selectedCategory !== "all") {
          query = query.eq("category_id", selectedCategory)
        }

        if (search) {
          query = query.ilike("name", `%${search}%`)
        }

        // Apply sorting
        switch (sortBy) {
          case "price-low":
            query = query.order("price", { ascending: true })
            break
          case "price-high":
            query = query.order("price", { ascending: false })
            break
          case "rating":
            query = query.order("rating", { ascending: false })
            break
          case "newest":
          default:
            query = query.order("created_at", { ascending: false })
        }

        const { data: productsData } = await query

        setProducts(productsData || [])
      } catch (error) {
        console.error("Error fetching products:", error)
      } finally {
        setLoadingProducts(false)
      }
    }

    fetchProducts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, search, sortBy])

  const activeCategoryName = useMemo(() => {
    if (selectedCategory === "all") return "todas las categorías"
    const category = categories.find((cat) => cat.id === selectedCategory)
    return category ? category.name.toLowerCase() : "todas las categorías"
  }, [categories, selectedCategory])

  const isLoading = loadingProducts || (loadingCategories && categories.length === 0)

  return (
    <div className={cn("space-y-8", className)}>
      {headline?.title && (
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-[#3D2817]">{headline.title}</h2>
          {headline.description && <p className="text-muted-foreground max-w-2xl mx-auto">{headline.description}</p>}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              placeholder="Buscar por nombre o palabra clave..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 bg-white/70 backdrop-blur"
          />
        </div>

          <div className="flex items-center justify-end gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground hidden lg:block" aria-hidden />
          <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11 bg-white/70 backdrop-blur">
                <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="newest">Novedades</SelectItem>
              <SelectItem value="price-low">Precio: Menor a Mayor</SelectItem>
              <SelectItem value="price-high">Precio: Mayor a Menor</SelectItem>
                <SelectItem value="rating">Mejor valorados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

        <div className="flex items-center lg:justify-end rounded-xl bg-[#F5F1ED] border border-[#D4C4B0]/70 px-4 py-3 text-sm text-muted-foreground shadow-sm">
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Preparando catálogo...
            </span>
          ) : (
            <span className="leading-tight">
              Mostrando <span className="font-semibold text-[#3D2817]">{products.length}</span>{" "}
              {products.length === 1 ? "producto" : "productos"} de {activeCategoryName}.
            </span>
          )}
        </div>
      </div>

      {!hideCategoryFilter && (
        <div className="rounded-2xl border border-[#D4C4B0]/70 bg-white/70 backdrop-blur shadow-sm p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#8B6F47]">Categorías</h3>
              {loadingCategories && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                <CategoryChip
                  label="Todas"
                  isActive={selectedCategory === "all"}
                  onClick={() => setSelectedCategory("all")}
                />
                {categories.map((cat) => (
                  <CategoryChip
                    key={cat.id}
                    label={cat.name}
                    isActive={selectedCategory === cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                  />
                ))}
              </div>
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <ProductSkeleton key={index} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D4C4B0] bg-[#F5F1ED]/60 py-16 text-center space-y-3">
            <Badge variant="secondary" className="bg-[#E8DFD5] text-[#5C4033]">
              Sin resultados
            </Badge>
            <div className="space-y-1">
              <h3 className="text-xl font-semibold text-[#3D2817]">No encontramos productos</h3>
              <p className="text-muted-foreground">
                Ajusta la búsqueda, cambia el orden o explora otra categoría para continuar descubriendo productos.
              </p>
            </div>
        </div>
      ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      )}
      </div>
    </div>
  )
}

interface CategoryChipProps {
  label: string
  isActive: boolean
  onClick: () => void
}

function CategoryChip({ label, isActive, onClick }: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-all",
        isActive
          ? "border-[#5C4033] bg-[#5C4033] text-white shadow-sm"
          : "border-[#D4C4B0] bg-white/80 text-[#5C4033] hover:border-[#5C4033] hover:text-[#3D2817]",
      )}
      type="button"
    >
      {label}
    </button>
  )
}

function ProductSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#E1D5C8] bg-white shadow-sm">
      <div className="relative">
        <Skeleton className="h-48 w-full bg-[#E8DFD5]" />
        <Badge className="absolute left-4 top-4 bg-white/80 text-[#8B6F47] backdrop-blur">Papelería SR</Badge>
        <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
      </div>
      <div className="space-y-3 p-4">
        <Skeleton className="h-5 w-3/4 bg-[#F2E9DF]" />
        <Skeleton className="h-4 w-full bg-[#F2E9DF]" />
        <Skeleton className="h-4 w-1/2 bg-[#F2E9DF]" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-20 rounded-full bg-[#E8DFD5]" />
          <Skeleton className="h-9 w-28 rounded-lg bg-[#E8DFD5]" />
        </div>
      </div>
    </div>
  )
}
