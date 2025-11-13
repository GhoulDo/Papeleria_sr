"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, BookOpen } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CatalogFlipbook } from "@/components/catalog-flipbook"

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  image_url: string | null
  rating: number
  reviews_count: number
  stock_quantity: number
  category?: {
    name: string
  }
}

export default function CatalogPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            *,
            category:categories(name)
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false })

        if (error) {
          // Manejar errores de forma más elegante
          if (error.message?.includes("Failed to fetch") || error.message?.includes("ERR_NAME_NOT_RESOLVED")) {
            console.warn("[Catalog] Error de conexión al cargar productos:", error.message)
            toast({
              title: "Error de conexión",
              description: "No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.",
              variant: "destructive",
            })
            setProducts([]) // Establecer array vacío en lugar de fallar
            setLoading(false)
            return
          }
          throw error
        }
        setProducts(data || [])
      } catch (error: any) {
        // Solo mostrar errores críticos, no errores de red
        if (error?.message?.includes("Failed to fetch") || error?.message?.includes("ERR_NAME_NOT_RESOLVED")) {
          console.warn("[Catalog] Error de conexión:", error.message)
          setProducts([])
        } else {
          console.error("[Catalog] Error fetching products:", error)
          toast({
            title: "Error",
            description: "No se pudieron cargar los productos. Por favor, intenta nuevamente.",
            variant: "destructive",
          })
        }
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [supabase, toast])

  const handleAddToCart = async (productId: string, productName: string) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar productos al carrito",
        variant: "destructive",
      })
      return
    }

    try {
      const { data: cart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (cartError && cartError.code !== "PGRST116") {
        // Crear carrito si no existe
        const { data: newCart, error: createError } = await supabase
          .from("carts")
          .insert({ user_id: user.id })
          .select()
          .single()

        if (createError) throw createError

        await supabase.from("cart_items").upsert({
          cart_id: newCart.id,
          product_id: productId,
          quantity: 1,
        })
      } else {
        await supabase.from("cart_items").upsert({
          cart_id: cart.id,
          product_id: productId,
          quantity: 1,
        })
      }

      toast({
        title: "Producto agregado",
        description: `${productName} agregado al carrito`,
      })
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
        <Navbar />
        <div className="flex h-[80vh] items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-[#5C4033] mx-auto" />
            <p className="text-[#6B5D52] text-lg">Cargando catálogo...</p>
          </div>
        </div>
      </div>
    )
  }

  // Mostrar mensaje si no hay productos (puede ser por error de conexión)
  if (products.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
        <Navbar />
        <div className="flex h-[80vh] items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto px-4">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#F5F1ED] to-white border-2 border-[#E1D5C8] flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-[#8B6F47]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-[#3D2817]">No se pudieron cargar los productos</h2>
              <p className="text-[#6B5D52]">
                Por favor, verifica tu conexión a internet e intenta nuevamente.
              </p>
            </div>
            <Button
              onClick={() => {
                setLoading(true)
                window.location.reload()
              }}
              className="bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10]"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
      <Navbar />

      {/* Header */}
      <div className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <BookOpen className="h-8 w-8 text-[#5C4033]" />
                <h1 className="text-4xl font-bold text-[#3D2817]">Catálogo Digital</h1>
              </div>
              <p className="text-[#6B5D52] text-lg">
                Explora nuestros productos como si fuera una revista
              </p>
            </div>
            <Badge className="bg-[#5C4033] text-white px-4 py-2 text-sm">
              {products.length} productos
            </Badge>
          </div>
        </div>
      </div>

      {/* Flipbook Container */}
      <div className="py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center gap-8">
            <CatalogFlipbook products={products} onAddToCart={handleAddToCart} />
          </div>
        </div>
      </div>
    </div>
  )
}


