"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Star, ShoppingCart, Loader2 } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Product {
  id: string
  name: string
  description: string
  detailed_description: string
  price: number
  stock_quantity: number
  rating: number
  reviews_count: number
  image_url: string
  images: string[]
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .eq("slug", params.slug)
          .eq("is_active", true)
          .single()

        if (error) throw error
        setProduct(data)
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [params.slug, supabase])

  const handleAddToCart = async () => {
    if (!user) {
      router.push("/auth/login")
      return
    }

    setAdding(true)
    try {
      // Get user's cart
      const { data: cart, error: cartError } = await supabase.from("carts").select("id").eq("user_id", user.id).single()

      if (cartError) throw cartError

      // Add item to cart
      const { error: itemError } = await supabase.from("cart_items").upsert({
        cart_id: cart.id,
        product_id: product?.id,
        quantity: quantity,
      })

      if (itemError) throw itemError

      toast({
        title: "Producto agregado",
        description: `${quantity} ${quantity === 1 ? "unidad" : "unidades"} agregadas al carrito`,
      })

      setQuantity(1)
    } catch (error) {
      console.error("Error adding to cart:", error)
      toast({
        title: "Error",
        description: "No se pudo agregar el producto al carrito",
        variant: "destructive",
      })
    } finally {
      setAdding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <div className="space-y-4">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-3xl font-bold text-[#3D2817]">Producto no encontrado</h1>
            <p className="text-[#6B5D52]">El producto que buscas no existe o ha sido eliminado.</p>
            <Button asChild className="mt-6 bg-[#5C4033] hover:bg-[#3D2817] text-white">
            <a href="/products">Volver al catálogo</a>
          </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative h-[400px] md:h-[500px] bg-gradient-to-br from-[#F5F1ED] to-[#E8DFD5] rounded-3xl overflow-hidden border border-[#E1D5C8] shadow-xl flex items-center justify-center group">
              {product.image_url ? (
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="text-[#8B6F47] text-center">
                  <div className="text-4xl mb-2">📦</div>
                  <p className="text-sm">Sin imagen disponible</p>
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl md:text-5xl font-bold text-[#3D2817] leading-tight mb-3">
                  {product.name}
                </h1>
                <div className="flex items-center gap-3">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                          i < Math.round(product.rating) 
                            ? "fill-[#F59E0B] text-[#F59E0B]" 
                            : "text-[#D4C4B0]"
                      }`}
                    />
                  ))}
                  </div>
                  <span className="text-sm text-[#6B5D52]">
                    ({product.reviews_count} {product.reviews_count === 1 ? "reseña" : "reseñas"})
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-baseline gap-3">
                  <p className="text-5xl font-bold text-[#5C4033]">${product.price.toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {product.stock_quantity > 0 ? (
                    <>
                      <div className="h-3 w-3 rounded-full bg-green-500"></div>
                      <p className="text-sm font-medium text-[#3D2817]">
                        {product.stock_quantity} {product.stock_quantity === 1 ? "unidad disponible" : "unidades disponibles"}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-3 rounded-full bg-red-500"></div>
                      <p className="text-sm font-medium text-red-600">Producto agotado</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#E1D5C8]">
              <div>
                <h2 className="text-lg font-semibold text-[#3D2817] mb-2">Descripción</h2>
                <p className="text-[#6B5D52] leading-relaxed">{product.description}</p>
            </div>
              {product.detailed_description && (
                <div className="rounded-2xl border border-[#D4C4B0] bg-white/80 p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#5C4033] mb-2">Detalles adicionales</h3>
                  <p className="text-sm text-[#6B5D52] leading-relaxed">{product.detailed_description}</p>
                </div>
              )}
            </div>

            {product.stock_quantity > 0 && (
              <div className="space-y-4 pt-6 border-t border-[#E1D5C8]">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium text-[#3D2817] mb-2 block">Cantidad</label>
                    <Input
                      type="number"
                      min="1"
                      max={product.stock_quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      className="border-[#D4C4B0] bg-white/80 text-[#3D2817] focus:border-[#5C4033]"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleAddToCart} 
                  size="lg" 
                  disabled={adding} 
                  className="w-full bg-[#5C4033] hover:bg-[#3D2817] text-white h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  {adding ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      Agregar al Carrito
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
