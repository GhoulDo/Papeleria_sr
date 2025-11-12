"use client"

import { useEffect, useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Loader2, 
  Eye, 
  ShoppingBag, 
  Calendar, 
  User, 
  DollarSign,
  Search,
  Filter,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  TrendingUp,
  FileText
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
  pending: { 
    label: "Pendiente", 
    color: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white",
    icon: Clock,
    bgColor: "bg-yellow-50 border-yellow-200"
  },
  processing: { 
    label: "Procesando", 
    color: "bg-gradient-to-r from-blue-400 to-blue-500 text-white",
    icon: Package,
    bgColor: "bg-blue-50 border-blue-200"
  },
  shipped: { 
    label: "Enviado", 
    color: "bg-gradient-to-r from-purple-400 to-purple-500 text-white",
    icon: Truck,
    bgColor: "bg-purple-50 border-purple-200"
  },
  delivered: { 
    label: "Entregado", 
    color: "bg-gradient-to-r from-green-400 to-green-500 text-white",
    icon: CheckCircle2,
    bgColor: "bg-green-50 border-green-200"
  },
  cancelled: { 
    label: "Cancelado", 
    color: "bg-gradient-to-r from-red-400 to-red-500 text-white",
    icon: XCircle,
    bgColor: "bg-red-50 border-red-200"
  },
}

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")

  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchOrders({ silent: true })
    }, 300)
    return () => clearTimeout(handler)
  }, [search])

  const fetchOrders = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    }

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

      if (search.trim()) {
        const term = search.trim()
        query = query.or(`order_number.ilike.%${term}%,user:users.email.ilike.%${term}%,user:users.full_name.ilike.%${term}%`)
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

  const stats = useMemo(() => {
    const total = orders.length
    const totalRevenue = orders.reduce((sum, order) => sum + order.total_amount, 0)
    const pending = orders.filter(o => o.status === "pending").length
    const delivered = orders.filter(o => o.status === "delivered").length

    return { total, totalRevenue, pending, delivered }
  }, [orders])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96 bg-gradient-to-b from-[#F7F1EB] to-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="space-y-8">
          {/* Header */}
          <div className="relative overflow-hidden rounded-3xl border-2 border-[#E1D5C8] bg-gradient-to-br from-[#F5F1ED] via-white to-[#FBF8F4] p-8 shadow-xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#5C4033]/10 to-transparent rounded-bl-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-[#5C4033] to-[#3D2817] shadow-lg">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-[#3D2817]">Gestión de Órdenes</h1>
                  <p className="text-[#6B5D52] mt-1">Administra y supervisa todas las órdenes de los clientes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6B5D52] mb-1">Total de Órdenes</p>
                    <p className="text-3xl font-bold text-[#3D2817]">{stats.total}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-[#5C4033] to-[#3D2817]">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6B5D52] mb-1">Ingresos Totales</p>
                    <p className="text-3xl font-bold text-[#3D2817]">${stats.totalRevenue.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6B5D52] mb-1">Pendientes</p>
                    <p className="text-3xl font-bold text-[#3D2817]">{stats.pending}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-500">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg hover:shadow-xl transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#6B5D52] mb-1">Entregadas</p>
                    <p className="text-3xl font-bold text-[#3D2817]">{stats.delivered}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-400 to-green-500">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Search */}
          <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#8B6F47]" />
                  <Input
                    placeholder="Buscar por número de orden, email o nombre del cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10 border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 h-11"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-[#5C4033]" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48 border-2 border-[#D4C4B0] bg-white focus:border-[#5C4033] h-11">
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          {orders.length === 0 ? (
            <Card className="border-dashed border-2 border-[#D4C4B0] bg-gradient-to-br from-[#F5F1ED] to-white py-16 text-center shadow-lg">
              <CardContent className="space-y-4">
                <div className="mx-auto w-20 h-20 rounded-full bg-[#F5F1ED] flex items-center justify-center mb-4">
                  <ShoppingBag className="h-10 w-10 text-[#8B6F47]" />
                </div>
                <h2 className="text-3xl font-bold text-[#3D2817]">No hay órdenes</h2>
                <p className="text-lg text-[#6B5D52] max-w-md mx-auto">
                  {search || statusFilter !== "all" 
                    ? "No se encontraron órdenes con los filtros aplicados. Intenta con otros criterios."
                    : "Aún no hay órdenes registradas en el sistema."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
                const StatusIcon = statusInfo.icon
                return (
                  <Card 
                    key={order.id} 
                    className="group border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] hover:border-[#5C4033] hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#5C4033]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5F1ED] to-white border border-[#E1D5C8]">
                                <FileText className="h-4 w-4 text-[#5C4033]" />
                              </div>
                              <h3 className="text-xl font-bold text-[#3D2817]">{order.order_number}</h3>
                            </div>
                            <Badge className={cn("flex items-center gap-1.5 px-3 py-1.5 shadow-md", statusInfo.color)}>
                              <StatusIcon className="h-3.5 w-3.5" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            <div className="flex items-center gap-2 text-[#6B5D52]">
                              <User className="h-4 w-4" />
                              <span className="font-medium">{order.user?.full_name || "Desconocido"}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[#6B5D52]">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(order.created_at).toLocaleDateString("es-ES", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">Total</p>
                            <p className="text-3xl font-bold text-[#5C4033]">${order.total_amount.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                          </div>
                          <Button 
                            asChild 
                            className="bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10] shadow-lg hover:shadow-xl transition-all"
                          >
                            <Link href={`/admin/orders/${order.id}`}>
                              <Eye className="h-4 w-4 mr-2" />
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
