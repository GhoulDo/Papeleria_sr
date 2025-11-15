"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Loader2, BookOpen, ArrowLeft } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { CatalogFlipbook } from "@/components/catalog-flipbook"
import { useRouter } from "next/navigation"

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
  const router = useRouter()
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
      <div className="min-h-screen bg-gradient-to-br from-[#3D2817] via-[#5C4033] to-[#8B6F47] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-16 w-16 animate-spin text-white mx-auto" />
          <p className="text-white/90 text-lg font-medium">Cargando catálogo...</p>
        </div>
      </div>
    )
  }

  // Mostrar mensaje si no hay productos (puede ser por error de conexión)
  if (products.length === 0 && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3D2817] via-[#5C4033] to-[#8B6F47] flex items-center justify-center px-4">
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">No se pudieron cargar los productos</h2>
            <p className="text-white/80">
              Por favor, verifica tu conexión a internet e intenta nuevamente.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => router.back()}
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <Button
              onClick={() => {
                setLoading(true)
                window.location.reload()
              }}
              className="bg-white text-[#5C4033] hover:bg-white/90"
            >
              Reintentar
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3D2817] via-[#5C4033] to-[#8B6F47] relative overflow-hidden">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#C97D2E]/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-[#8B6F47]/20 rounded-full blur-3xl" />
      </div>

      {/* Botón de volver */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          onClick={() => router.back()}
          variant="outline"
          size="lg"
          className="border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 shadow-lg"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Volver
        </Button>
      </div>

      {/* Flipbook Container - Centrado y con espacio */}
      <div className="min-h-screen flex items-center justify-center py-8 px-4">
        <div className="w-full max-w-7xl">
          <CatalogFlipbook products={products} onAddToCart={handleAddToCart} />
        </div>
      </div>
    </div>
  )
}


