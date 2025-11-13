"use client"

import { useEffect, useState } from "react"
import { useRequireAuth } from "@/hooks/use-require-auth"
import { createClient } from "@/lib/supabase/client"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Eye } from "lucide-react"
import Link from "next/link"

interface Order {
  id: string
  order_number: string
  status: string
  total_amount: number
  created_at: string
}

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  processing: { label: "Procesando", color: "bg-blue-100 text-blue-800" },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800" },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800" },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800" },
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")

  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchOrders = async () => {
      try {
        let query = supabase.from("orders").select("*").eq("user_id", user.id).order("created_at", { ascending: false })

        if (filter !== "all") {
          query = query.eq("status", filter)
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

    setLoading(true)
    fetchOrders()
  }, [user, filter, supabase])

  const statusOptions = ["all", "pending", "processing", "shipped", "delivered"]

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

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Mis Órdenes</h1>
          <p className="text-muted-foreground mt-2">Visualiza y gestiona todas tus compras</p>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusOptions.map((status) => (
            <Button
              key={status}
              variant={filter === status ? "default" : "outline"}
              onClick={() => setFilter(status)}
              className="capitalize"
            >
              {status === "all" ? "Todas" : statusConfig[status as keyof typeof statusConfig]?.label}
            </Button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No hay órdenes</p>
              <Button asChild>
                <Link href="/products">Continuar Comprando</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
              return (
                <Card key={order.id} className="hover:shadow-lg transition">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{order.order_number}</h3>
                          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Creada el {new Date(order.created_at).toLocaleDateString("es-ES")}
                        </p>
                      </div>

                      <div className="text-right space-y-2">
                        <p className="text-2xl font-bold text-primary">${order.total_amount.toFixed(2)}</p>
                        <Button asChild size="sm">
                          <Link href={`/orders/${order.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Ver Detalles
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
    </div>
  )
}
