"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Eye } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  order_number: string
  user_id: string
  status: string
  total_amount: number
  created_at: string
  user?: {
    email: string
    full_name: string
  }
}

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Procesando", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
}

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")

  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from("orders")
        .select(
          `
          *,
          user:users(email, full_name)
        `,
        )
        .order("created_at", { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Gestión de Órdenes</h1>
          <p className="text-muted-foreground mt-2">Administra todas las órdenes de los clientes</p>
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="processing">Procesando</SelectItem>
            <SelectItem value="shipped">Enviado</SelectItem>
            <SelectItem value="delivered">Entregado</SelectItem>
            <SelectItem value="cancelled">Cancelado</SelectItem>
          </SelectContent>
        </Select>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No hay órdenes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
              return (
                <Card key={order.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{order.order_number}</h3>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {order.user?.full_name || "Desconocido"} ({order.user?.email})
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                      <div className="text-right space-y-2">
                        <p className="text-lg font-bold">${order.total_amount.toFixed(2)}</p>
                        <Button asChild size="sm">
                          <Link href={`/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
