"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { CartSummary } from "@/components/cart-summary"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { validateStock, updateStock } from "@/lib/utils/stock-validator"

interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login")
      return
    }

    if (user) {
      fetchCartItems()
      fetchUserData()
    }
  }, [user, authLoading, router])

  const fetchUserData = async () => {
    try {
      const { data } = await supabase.from("users").select("*").eq("id", user?.id).single()

      if (data) {
        setFormData((prev) => ({
          ...prev,
          fullName: data.full_name || "",
          email: data.email || "",
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          postalCode: data.postal_code || "",
          country: data.country || "",
        }))
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const fetchCartItems = async () => {
    try {
      const { data: cartData } = await supabase.from("carts").select("id").eq("user_id", user?.id).single()

      const { data: itemsData, error } = await supabase
        .from("cart_items")
        .select(
          `
          id,
          product_id,
          quantity,
          product:products(id, name, price)
        `,
        )
        .eq("cart_id", cartData.id)

      if (error) throw error

      setItems(itemsData as unknown as CartItem[])
    } catch (error) {
      console.error("Error fetching cart:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos antes de continuar",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      // Validar stock antes de crear la orden
      for (const item of items) {
        const hasStock = await validateStock(item.product_id, item.quantity)
        if (!hasStock) {
          toast({
            title: "Stock insuficiente",
            description: `El producto "${item.product.name}" no tiene suficiente stock disponible`,
            variant: "destructive",
          })
          setProcessing(false)
          return
        }
      }

      const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
      const tax = subtotal * 0.16
      const shipping = subtotal > 100 ? 0 : 10
      const totalAmount = subtotal + tax + shipping

      // Generate order number
      const orderNumber = `ORD-${Date.now()}`

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user?.id,
          order_number: orderNumber,
          status: "pending",
          subtotal: subtotal,
          tax_amount: tax,
          shipping_cost: shipping,
          total_amount: totalAmount,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_postal_code: formData.postalCode,
          shipping_country: formData.country,
          payment_method: "pending",
          payment_status: "pending",
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.product.price,
        subtotal: item.product.price * item.quantity,
      }))

      const { error: itemsError } = await supabase.from("order_items").insert(orderItems)

      if (itemsError) throw itemsError

      // Reducir stock de los productos - CRÍTICO: debe hacerse después de crear la orden pero antes de limpiar el carrito
      const stockUpdateErrors: string[] = []
      
      for (const item of items) {
        console.log(`[STOCK] Reduciendo stock para producto ${item.product.name} (ID: ${item.product_id}), cantidad: ${item.quantity}`)
        
        // Obtener stock antes de reducir
        const { data: beforeData } = await supabase
          .from("products")
          .select("stock_quantity, name")
          .eq("id", item.product_id)
          .single()
        
        const stockBefore = beforeData?.stock_quantity ?? 0
        console.log(`[STOCK] Stock ANTES de reducir para ${item.product.name}: ${stockBefore}`)
        
        const stockUpdated = await updateStock(item.product_id, item.quantity, "decrease")
        
        if (!stockUpdated) {
          const errorMsg = `Error al reducir stock del producto "${item.product.name}" (ID: ${item.product_id})`
          console.error(`[STOCK ERROR] ${errorMsg}`)
          stockUpdateErrors.push(errorMsg)
        } else {
          // Verificar que el stock se redujo correctamente
          const { data: afterData } = await supabase
            .from("products")
            .select("stock_quantity")
            .eq("id", item.product_id)
            .single()
          
          const stockAfter = afterData?.stock_quantity ?? 0
          const expectedStock = stockBefore - item.quantity
          
          console.log(`[STOCK] Stock DESPUÉS de reducir para ${item.product.name}: ${stockAfter}, Esperado: ${expectedStock}`)
          
          if (stockAfter !== expectedStock) {
            const errorMsg = `El stock no se redujo correctamente para "${item.product.name}". Stock antes: ${stockBefore}, después: ${stockAfter}, esperado: ${expectedStock}`
            console.error(`[STOCK ERROR] ${errorMsg}`)
            stockUpdateErrors.push(errorMsg)
          } else {
            console.log(`[STOCK] ✅ Stock reducido correctamente para ${item.product.name}: ${stockBefore} → ${stockAfter}`)
          }
        }
      }

      // Si hubo errores al reducir stock, revertir la orden y mostrar error
      if (stockUpdateErrors.length > 0) {
        console.error(`[STOCK] Errores al reducir stock. Revertiendo orden ${orderData.id}`)
        
        // Intentar revertir la orden eliminándola
        await supabase.from("order_items").delete().eq("order_id", orderData.id)
        await supabase.from("orders").delete().eq("id", orderData.id)
        
        toast({
          title: "Error al procesar la orden",
          description: `No se pudo reducir el stock de algunos productos. La orden ha sido cancelada. Errores: ${stockUpdateErrors.join(", ")}`,
          variant: "destructive",
        })
        setProcessing(false)
        return
      }

      // Update user profile
      await supabase
        .from("users")
        .update({
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          country: formData.country,
          phone: formData.phone,
        })
        .eq("id", user?.id)

      // Clear cart
      const { data: cartData } = await supabase.from("carts").select("id").eq("user_id", user?.id).single()

      await supabase.from("cart_items").delete().eq("cart_id", cartData.id)

      toast({
        title: "Orden creada exitosamente",
        description: `Tu número de orden es: ${orderNumber}`,
      })

      router.push(`/orders/${orderData.id}`)
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar la orden",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
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
  const tax = subtotal * 0.16
  const shipping = subtotal > 100 ? 0 : 10

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Información de Envío</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePlaceOrder} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Nombre Completo</label>
                      <Input name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <Input name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Teléfono</label>
                    <Input name="phone" value={formData.phone} onChange={handleInputChange} />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Dirección</label>
                    <Input name="address" value={formData.address} onChange={handleInputChange} required />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Ciudad</label>
                      <Input name="city" value={formData.city} onChange={handleInputChange} required />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Código Postal</label>
                      <Input name="postalCode" value={formData.postalCode} onChange={handleInputChange} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">País</label>
                      <Input name="country" value={formData.country} onChange={handleInputChange} />
                    </div>
                  </div>

                  <Button type="submit" disabled={processing} className="w-full">
                    {processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar Orden"
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Orden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.product.name} x{item.quantity}
                      </span>
                      <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <CartSummary subtotal={subtotal} discount={0} tax={tax} shipping={shipping} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
