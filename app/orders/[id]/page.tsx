"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, Clock, Truck } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  order_number: string
  status: string
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
}

const statusConfig = {
  pending: { icon: Clock, label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  processing: { icon: Loader2, label: "Procesando", color: "bg-blue-100 text-blue-800" },
  shipped: { icon: Truck, label: "Enviado", color: "bg-purple-100 text-purple-800" },
  delivered: { icon: CheckCircle, label: "Entregado", color: "bg-green-100 text-green-800" },
  cancelled: { icon: Clock, label: "Cancelado", color: "bg-red-100 text-red-800" },
}

export default function OrderDetailPage() {
  const params = useParams()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
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
            )
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

    fetchOrder()
  }, [params.id, supabase])

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

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold">Orden no encontrada</h1>
        </div>
      </div>
    )
  }

  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold">Orden {order.order_number}</h1>
            <Badge className={status.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          <p className="text-muted-foreground">Creada el {new Date(order.created_at).toLocaleDateString("es-ES")}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="md:col-span-2 space-y-6">
            {/* Items */}
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div key={item.id} className="flex justify-between py-2 border-b border-border last:border-b-0">
                      <span>
                        {item.product.name} x{item.quantity}
                      </span>
                      <span className="font-semibold">${(item.unit_price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle>Dirección de Envío</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <div>{order.shipping_address}</div>
                <div>{order.shipping_city}</div>
                <div>
                  Total: <span className="font-semibold text-primary">${order.total_amount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Resumen</CardTitle>
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

                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${order.total_amount.toFixed(2)}</span>
                </div>

                <Button asChild className="w-full">
                  <Link href="/dashboard">Volver al Dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
