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
      <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="space-y-4">
            <div className="text-6xl mb-4">📋</div>
            <h1 className="text-3xl font-bold text-[#3D2817]">Orden no encontrada</h1>
            <p className="text-[#6B5D52]">La orden que buscas no existe o no tienes permiso para verla.</p>
            <Button asChild className="mt-6 bg-[#5C4033] hover:bg-[#3D2817] text-white">
              <Link href="/orders">Ver mis órdenes</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const status = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = status.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 pb-6 border-b border-[#E1D5C8]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#3D2817] mb-2">
                Orden {order.order_number}
              </h1>
              <p className="text-[#6B5D52]">
                Creada el {new Date(order.created_at).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <Badge className={`${status.color} px-4 py-2 text-sm font-semibold`}>
              <StatusIcon className="h-4 w-4 mr-2" />
              {status.label}
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items */}
            <Card className="border-[#E1D5C8] bg-white/90 shadow-sm">
              <CardHeader className="border-b border-[#E1D5C8]">
                <CardTitle className="text-[#3D2817]">Productos</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {order.order_items.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex justify-between items-center py-4 border-b border-[#E1D5C8]/50 last:border-b-0"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-[#3D2817]">{item.product.name}</p>
                        <p className="text-sm text-[#6B5D52]">Cantidad: {item.quantity}</p>
                      </div>
                      <span className="font-semibold text-[#5C4033] text-lg">
                        ${(item.unit_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card className="border-[#E1D5C8] bg-white/90 shadow-sm">
              <CardHeader className="border-b border-[#E1D5C8]">
                <CardTitle className="text-[#3D2817]">Dirección de Envío</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-2">
                <div className="text-[#3D2817] font-medium">{order.shipping_address}</div>
                <div className="text-[#6B5D52]">{order.shipping_city}</div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            <Card className="border-[#E1D5C8] bg-white/90 shadow-lg sticky top-4">
              <CardHeader className="border-b border-[#E1D5C8]">
                <CardTitle className="text-[#3D2817]">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-3 border-b border-[#E1D5C8] pb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5D52]">Subtotal</span>
                    <span className="text-[#3D2817] font-medium">${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5D52]">Impuestos</span>
                    <span className="text-[#3D2817] font-medium">${order.tax_amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5D52]">Envío</span>
                    <span className="text-[#3D2817] font-medium">${order.shipping_cost.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-lg font-semibold text-[#3D2817]">Total</span>
                  <span className="text-2xl font-bold text-[#5C4033]">${order.total_amount.toFixed(2)}</span>
                </div>

                <Button 
                  asChild 
                  className="w-full mt-6 bg-[#5C4033] hover:bg-[#3D2817] text-white"
                >
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
