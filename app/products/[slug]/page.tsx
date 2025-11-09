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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Producto no encontrado</h1>
          <Button asChild className="mt-4">
            <a href="/products">Volver al catálogo</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="relative h-96 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
              {product.image_url ? (
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-muted-foreground">Sin imagen</div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold">{product.name}</h1>
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-5 w-5 ${
                        i < Math.round(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">({product.reviews_count} reseñas)</span>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-4xl font-bold text-primary">${product.price.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">
                {product.stock_quantity > 0 ? `${product.stock_quantity} unidades disponibles` : "Producto agotado"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-muted-foreground">{product.description}</p>
              {product.detailed_description && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm">{product.detailed_description}</p>
                </div>
              )}
            </div>

            {product.stock_quantity > 0 && (
              <div className="space-y-4 border-t border-border pt-6">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium">Cantidad</label>
                    <Input
                      type="number"
                      min="1"
                      max={product.stock_quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number.parseInt(e.target.value) || 1))}
                      className="mt-2"
                    />
                  </div>
                </div>

                <Button onClick={handleAddToCart} size="lg" disabled={adding} className="w-full">
                  {adding ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Agregando...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="mr-2 h-4 w-4" />
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
