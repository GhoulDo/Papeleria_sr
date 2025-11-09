"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Order {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  subtotal: number
  tax_amount: number
  shipping_cost: number
  shipping_address: string
  shipping_city: string
  created_at: string
  order_items: Array<{
    id: string
    quantity: number
    unit_price: number
    product: {
      name: string
    }
  }>
  user: {
    email: string
    full_name: string
    phone: string
  }
}

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"]

export default function OrderDetailAdminPage() {
  const params = useParams()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchOrder()
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items(
            id,
            quantity,
            unit_price,
            product:products(name)
          ),
          user:users(email, full_name, phone)
        `,
        )
        .eq("id", params.id)
        .single()

      if (error) throw error
      setOrder(data)
    } catch (error) {
      console.error("Error fetching order:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return

    setUpdating(true)
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", order.id)

      if (error) throw error

      setOrder({ ...order, status: newStatus })
      toast({
        title: "Estado actualizado",
        description: `La orden ahora está en estado: ${newStatus}`,
      })
    } catch (error) {
      console.error("Error updating order:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  const handlePaymentStatusChange = async (newStatus: string) => {
    if (!order) return

    setUpdating(true)
    try {
      const { error } = await supabase.from("orders").update({ payment_status: newStatus }).eq("id", order.id)

      if (error) throw error

      setOrder({ ...order, payment_status: newStatus })
      toast({
        title: "Estado de pago actualizado",
      })
    } catch (error) {
      console.error("Error updating payment status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de pago",
        variant: "destructive",
      })
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold">Orden no encontrada</h1>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Orden {order.order_number}</h1>
          <p className="text-muted-foreground mt-2">
            Creada el {new Date(order.created_at).toLocaleDateString("es-ES")}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Status Management */}
            <Card>
              <CardHeader>
                <CardTitle>Gestión de Orden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Estado de Orden</label>
                  <Select value={order.status} onValueChange={handleStatusChange} disabled={updating}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Estado de Pago</label>
                  <Select value={order.payment_status} onValueChange={handlePaymentStatusChange} disabled={updating}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="failed">Fallido</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información del Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-semibold">{order.user.full_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p>{order.user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p>{order.user.phone || "No proporcionado"}</p>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between py-2 border-b border-border last:border-b-0">
                    <div>
                      <p className="font-medium">{item.product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${item.unit_price.toFixed(2)} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">${(item.unit_price * item.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Dirección de Envío</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{order.shipping_address}</p>
                <p>{order.shipping_city}</p>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen Financiero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 border-b border-border pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Impuestos</span>
                    <span>${order.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envío</span>
                    <span>${order.shipping_cost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span className="text-lg text-primary">${order.total_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={order.status === "delivered" ? "default" : "secondary"}>{order.status}</Badge>
                    <Badge variant={order.payment_status === "completed" ? "default" : "secondary"}>
                      {order.payment_status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
