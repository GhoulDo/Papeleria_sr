"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CartSummary } from "@/components/cart-summary"
import { Loader2, Trash2, Plus, Minus } from "lucide-react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"

interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image_url: string
    stock_quantity: number
  }
}

export default function CartPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [promoCode, setPromoCode] = useState("")
  const [discount, setDiscount] = useState(0)
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }

    if (user) {
      fetchCartItems()
    }
  }, [user, authLoading, router])

  const fetchCartItems = async () => {
    try {
      const { data: cartData, error: cartError } = await supabase
        .from("carts")
        .select("id")
        .eq("user_id", user?.id)
        .single()

      if (cartError) throw cartError

      const { data: itemsData, error: itemsError } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          product_id,
          quantity,
          product:products(id, name, price, image_url, stock_quantity)
        `,
        )
        .eq("cart_id", cartData.id)

      if (itemsError) throw itemsError

      setItems(itemsData as unknown as CartItem[])
    } catch (error) {
      console.error("Error fetching cart:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar el carrito",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId)
      return
    }

    setUpdating(itemId)
    try {
      const { error } = await supabase.from("cart_items").update({ quantity: newQuantity }).eq("id", itemId)

      if (error) throw error

      setItems(items.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
    } catch (error) {
      console.error("Error updating quantity:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la cantidad",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    try {
      const { error } = await supabase.from("cart_items").delete().eq("id", itemId)

      if (error) throw error

      setItems(items.filter((item) => item.id !== itemId))
      toast({
        title: "Producto removido",
        description: "El producto fue eliminado del carrito",
      })
    } catch (error) {
      console.error("Error removing item:", error)
      toast({
        title: "Error",
        description: "No se pudo remover el producto",
        variant: "destructive",
      })
    } finally {
      setUpdating(null)
    }
  }

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return

    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("code", promoCode.toUpperCase())
        .eq("is_active", true)
        .single()

      if (error) throw error

      const now = new Date()
      if (new Date(data.start_date) > now || new Date(data.end_date) < now) {
        throw new Error("Código de promoción expirado")
      }

      if (data.usage_limit && data.usage_count >= data.usage_limit) {
        throw new Error("Código de promoción alcanzó el límite de usos")
      }

      const discountAmount =
        data.discount_type === "percentage" ? (subtotal * data.discount_value) / 100 : data.discount_value

      setDiscount(discountAmount)
      toast({
        title: "Cupón aplicado",
        description: `Descuento: $${discountAmount.toFixed(2)}`,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Código inválido"
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const tax = subtotal * 0.16 // IVA 16%
  const shipping = subtotal > 100 ? 0 : 10 // Envío gratis sobre $100
  const total = subtotal - discount + tax + shipping

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Carrito de Compras</h1>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Tu carrito está vacío</p>
            <Button asChild>
              <a href="/products">Volver al catálogo</a>
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="md:col-span-2 space-y-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 bg-muted rounded overflow-hidden flex-shrink-0">
                        {item.product.image_url ? (
                          <Image
                            src={item.product.image_url || "/placeholder.svg"}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-semibold">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground">${item.product.price.toFixed(2)} c/u</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 border border-border rounded">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={updating === item.id}
                              className="p-1 hover:bg-muted disabled:opacity-50"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-3 py-1 text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              disabled={updating === item.id || item.quantity >= item.product.stock_quantity}
                              className="p-1 hover:bg-muted disabled:opacity-50"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="text-right">
                            <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        disabled={updating === item.id}
                        className="p-1 hover:bg-destructive/10 text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="md:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Código Promocional</label>
                    <div className="flex gap-2">
                      <Input placeholder="Código..." value={promoCode} onChange={(e) => setPromoCode(e.target.value)} />
                      <Button onClick={applyPromoCode} variant="outline" size="sm">
                        Aplicar
                      </Button>
                    </div>
                  </div>

                  <CartSummary subtotal={subtotal} discount={discount} tax={tax} shipping={shipping} />

                  <Button onClick={() => router.push("/checkout")} className="w-full" size="lg">
                    Proceder al Checkout
                  </Button>

                  <Button asChild variant="outline" className="w-full bg-transparent">
                    <a href="/products">Continuar Comprando</a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
