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
      // Obtener o crear carrito
      let cartId: string

      const { data: cart, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user.id)
        .single()

      if (cartError && cartError.code === "PGRST116") {
        // Carrito no existe, crear uno nuevo
        const { data: newCart, error: createError } = await supabase
          .from("carts")
          .insert({ user_id: user.id })
          .select()
          .single()

        if (createError) {
          console.error("Error creating cart:", createError)
          throw createError
        }

        cartId = newCart.id
      } else if (cartError) {
        // Otro error al obtener el carrito
        console.error("Error fetching cart:", cartError)
        throw cartError
      } else {
        cartId = cart.id
      }

      // Verificar si el producto ya está en el carrito usando maybeSingle para evitar 406
      const { data: existingItem, error: checkError } = await supabase
        .from("cart_items")
        .select("id, quantity")
        .eq("cart_id", cartId)
        .eq("product_id", productId)
        .maybeSingle() // Usar maybeSingle en lugar de single para evitar 406

      if (checkError) {
        // Error al verificar (no es "no encontrado")
        console.error("Error checking cart item:", checkError)
        // Continuar e intentar insertar - si falla con 409, manejaremos ese caso
      }

      if (existingItem) {
        // Producto ya existe, incrementar cantidad
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + 1 })
          .eq("id", existingItem.id)

        if (updateError) {
          console.error("Error updating cart item:", updateError)
          throw updateError
        }

        toast({
          title: "✅ Cantidad actualizada",
          description: `${productName} - cantidad aumentada en el carrito`,
          duration: 3000,
        })
        return // Salir exitosamente
      }

      // Producto no existe, intentar agregarlo
      const { error: insertError } = await supabase
        .from("cart_items")
        .insert({
          cart_id: cartId,
          product_id: productId,
          quantity: 1,
        })

      // Si hay error 409 (conflicto), el producto existe pero no lo detectamos
      // Intentar actualizar la cantidad en su lugar
      if (insertError && insertError.code === "23505") {
        // Error de constraint único - el producto ya existe
        // Obtener el item existente y actualizar
        const { data: existingItemRetry, error: retryError } = await supabase
          .from("cart_items")
          .select("id, quantity")
          .eq("cart_id", cartId)
          .eq("product_id", productId)
          .maybeSingle()

        if (retryError || !existingItemRetry) {
          console.error("Error fetching existing item after conflict:", retryError)
          throw insertError // Lanzar el error original
        }

        // Actualizar la cantidad
        const { error: updateError } = await supabase
          .from("cart_items")
          .update({ quantity: existingItemRetry.quantity + 1 })
          .eq("id", existingItemRetry.id)

        if (updateError) {
          console.error("Error updating cart item after conflict:", updateError)
          throw updateError
        }

        toast({
          title: "✅ Cantidad actualizada",
          description: `${productName} - cantidad aumentada en el carrito`,
          duration: 3000,
        })
        return
      }

      if (insertError) {
        console.error("Error inserting cart item:", insertError)
        throw insertError
      }

      // Éxito - producto agregado
      toast({
        title: "✅ Producto agregado",
        description: `${productName} se agregó correctamente al carrito`,
        duration: 3000,
      })
    } catch (error: any) {
      console.error("Error adding to cart:", error)
      
      // Mensaje de error más específico
      let errorMessage = "No se pudo agregar el producto al carrito"
      if (error?.code === "23505") {
        errorMessage = "El producto ya está en el carrito"
      } else if (error?.message) {
        errorMessage = error.message
      }

      toast({
        title: "Error",
        description: errorMessage,
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


