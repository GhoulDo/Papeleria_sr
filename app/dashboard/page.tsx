"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  ShoppingBag,
  Package,
  User,
  ClipboardList,
  Headphones,
  Gift,
  ArrowRight,
  MapPin,
  Mail,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  Truck,
  Calendar,
  Phone,
  Sparkles,
  Star,
  ShoppingCart,
  Eye,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface UserProfile {
  full_name: string
  email: string
  phone: string
  created_at: string
}

interface Stats {
  totalOrders: number
  totalSpent: number
  pendingOrders: number
  deliveredOrders: number
  lastOrder?: {
    id: string
    orderNumber: string
    createdAt: string
    totalAmount: number
    status: string
  }
  recentOrders?: Array<{
    id: string
    order_number: string
    total_amount: number
    status: string
    created_at: string
  }>
}

type OrderSummary = {
  id: string
  order_number: string
  total_amount: number
  status: string
  created_at: string
}

const statusConfig = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  processing: { label: "Procesando", color: "bg-blue-100 text-blue-800", icon: Package },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800", icon: Truck },
  delivered: { label: "Entregado", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: Clock },
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
    deliveredOrders: 0,
  })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        // Fetch user profile
        const { data: profileData } = await supabase.from("users").select("*").eq("id", user.id).single()

        setUserProfile(profileData)

        // Fetch ALL orders for accurate stats
        const { data: allOrdersData } = await supabase
          .from("orders")
          .select("id, order_number, total_amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        // Fetch recent orders (last 5) for display
        const { data: recentOrdersData } = await supabase
          .from("orders")
          .select("id, order_number, total_amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5)

        if (allOrdersData && allOrdersData.length > 0) {
          // Calculate accurate stats from ALL orders
          const totalOrders = allOrdersData.length
          const totalSpent = allOrdersData.reduce((sum: number, order: OrderSummary) => sum + Number(order.total_amount), 0)
          const pendingOrders = allOrdersData.filter(
            (order: OrderSummary) => order.status === "pending" || order.status === "processing" || order.status === "shipped",
          ).length
          const deliveredOrders = allOrdersData.filter((order: OrderSummary) => order.status === "delivered").length
          
          // Get latest order
          const latestOrder = allOrdersData[0] as OrderSummary | undefined
          
          // Get recent orders for display (first 3)
          const recentOrders = recentOrdersData?.slice(0, 3) || []

          setStats({
            totalOrders,
            totalSpent,
            pendingOrders,
            deliveredOrders,
            lastOrder: latestOrder
              ? {
                  id: latestOrder.id,
                  orderNumber: latestOrder.order_number,
                  createdAt: latestOrder.created_at,
                  totalAmount: Number(latestOrder.total_amount),
                  status: latestOrder.status,
                }
              : undefined,
            recentOrders: recentOrders.map((order) => ({
              id: order.id,
              order_number: order.order_number,
              total_amount: Number(order.total_amount),
              status: order.status,
              created_at: order.created_at,
            })),
          })
        } else {
          // No orders yet
          setStats({
            totalOrders: 0,
            totalSpent: 0,
            pendingOrders: 0,
            deliveredOrders: 0,
          })
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user, supabase])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
        </div>
      </div>
    )
  }

  const memberSince = userProfile?.created_at
    ? new Date(userProfile.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
      })
    : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 md:py-12">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl border-2 border-[#E1D5C8] bg-gradient-to-br from-[#F5F1ED] via-white to-[#FBF8F4] p-8 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#5C4033]/10 to-transparent rounded-bl-full" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="space-y-3">
                <Badge className="bg-[#5C4033] text-white rounded-full px-4 py-1 uppercase tracking-widest text-xs">
                  Panel del Cliente
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold text-[#3D2817]">
                  ¡Hola, {userProfile?.full_name || user?.email?.split("@")[0]}! 👋
                </h1>
                <p className="text-lg text-[#6B5D52] max-w-2xl">
                  Bienvenido a tu centro de control. Aquí puedes gestionar tus compras, revisar tus pedidos y descubrir
                  las mejores ofertas.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10] shadow-lg hover:shadow-xl transition-all h-12 px-6"
              >
                <Link href="/products">
                  Explorar Catálogo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="group relative overflow-hidden border-2 border-[#E1D5C8] bg-gradient-to-br from-white via-[#FBF8F4] to-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-[#5C4033] hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#5C4033]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#6B5D52] mb-2 flex items-center gap-2">
                    <ShoppingBag className="h-4 w-4" />
                    Órdenes Totales
                  </p>
                  <p className="text-4xl font-bold text-[#3D2817] mb-1 bg-gradient-to-r from-[#3D2817] to-[#5C4033] bg-clip-text text-transparent">
                    {stats.totalOrders}
                  </p>
                  <p className="text-xs text-[#8B6F47]">Total de compras realizadas</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#5C4033] to-[#3D2817] shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <ShoppingBag className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-2 border-[#E1D5C8] bg-gradient-to-br from-white via-[#FBF8F4] to-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-green-500/50 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#6B5D52] mb-2 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Gastado
                  </p>
                  <p className="text-4xl font-bold text-[#3D2817] mb-1 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                    ${stats.totalSpent.toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-xs text-[#8B6F47]">En todas tus compras</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-2 border-[#E1D5C8] bg-gradient-to-br from-white via-[#FBF8F4] to-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-yellow-500/50 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-400/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#6B5D52] mb-2 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Pendientes
                  </p>
                  <p className="text-4xl font-bold text-[#3D2817] mb-1 bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent">
                    {stats.pendingOrders}
                  </p>
                  <p className="text-xs text-[#8B6F47]">En proceso o por entregar</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Clock className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-2 border-[#E1D5C8] bg-gradient-to-br from-white via-[#FBF8F4] to-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:border-green-500/50 hover:-translate-y-1">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-400/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#6B5D52] mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Entregadas
                  </p>
                  <p className="text-4xl font-bold text-[#3D2817] mb-1 bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
                    {stats.deliveredOrders}
                  </p>
                  <p className="text-xs text-[#8B6F47]">Compras completadas</p>
                </div>
                <div className="p-4 rounded-2xl bg-gradient-to-br from-green-400 to-green-500 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Última Orden y Órdenes Recientes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Última Orden */}
            <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg hover:shadow-xl transition-all">
              <CardHeader className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white">
                <CardTitle className="text-[#3D2817] flex items-center gap-2">
                  <Package className="h-5 w-5 text-[#5C4033]" />
                  Tu Última Compra
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {stats.lastOrder ? (
                  <div className="space-y-6">
                    <div className="relative p-6 rounded-2xl border-2 border-[#E1D5C8] bg-gradient-to-br from-[#F5F1ED] via-white to-[#FBF8F4] shadow-md hover:shadow-lg transition-all">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#5C4033]/5 to-transparent rounded-bl-full" />
                      <div className="relative z-10">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3 flex-wrap">
                              <h3 className="text-2xl font-bold text-[#3D2817]">{stats.lastOrder.orderNumber}</h3>
                              {(() => {
                                const statusInfo = statusConfig[stats.lastOrder.status as keyof typeof statusConfig] || statusConfig.pending
                                const StatusIcon = statusInfo.icon
                                return (
                                  <Badge className={cn("flex items-center gap-1.5 px-3 py-1 text-xs font-semibold", statusInfo.color)}>
                                    <StatusIcon className="h-3.5 w-3.5" />
                                    {statusInfo.label}
                                  </Badge>
                                )
                              })()}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-[#6B5D52] mb-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {new Date(stats.lastOrder.createdAt).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#8B6F47]">
                              <TrendingUp className="h-3.5 w-3.5" />
                              <span>Última actualización: {new Date(stats.lastOrder.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}</span>
                            </div>
                          </div>
                          <div className="text-right md:text-left md:min-w-[140px]">
                            <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider font-medium">Total</p>
                            <p className="text-3xl font-bold bg-gradient-to-r from-[#5C4033] to-[#3D2817] bg-clip-text text-transparent">
                              ${stats.lastOrder.totalAmount.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10] shadow-lg hover:shadow-xl transition-all"
                        >
                          <Link href={`/orders/${stats.lastOrder.id}`} className="flex items-center justify-center">
                            <Eye className="mr-2 h-4 w-4" />
                            Ver Detalles Completos
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-6">
                    <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-[#F5F1ED] to-white border-2 border-[#E1D5C8] flex items-center justify-center mb-4 shadow-lg">
                      <ShoppingCart className="h-12 w-12 text-[#8B6F47]" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-[#3D2817]">Aún no has realizado compras</h3>
                      <p className="text-[#6B5D52] max-w-md mx-auto text-lg">
                        ¡Explora nuestro catálogo y descubre todos los productos que tenemos para ti!
                      </p>
                    </div>
                    <Button
                      asChild
                      size="lg"
                      className="bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10] shadow-lg hover:shadow-xl transition-all mt-6 px-8"
                    >
                      <Link href="/products" className="flex items-center">
                        Comenzar a Comprar
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Órdenes Recientes */}
            {stats.recentOrders && stats.recentOrders.length > 0 && (
              <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg hover:shadow-xl transition-all">
                <CardHeader className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[#3D2817] flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-[#5C4033]" />
                      Órdenes Recientes
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild className="text-[#5C4033] hover:bg-[#F5F1ED] hover:text-[#3D2817]">
                      <Link href="/orders" className="flex items-center gap-1">
                        Ver todas
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {stats.recentOrders.map((order, index) => {
                      const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
                      const StatusIcon = statusInfo.icon
                      return (
                        <Link
                          key={order.id}
                          href={`/orders/${order.id}`}
                          className="block p-4 rounded-xl border-2 border-[#E1D5C8] bg-white/70 hover:bg-white hover:border-[#5C4033] hover:shadow-lg transition-all group relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#5C4033] to-[#3D2817] opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex items-center justify-between pl-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <h4 className="font-bold text-[#3D2817] group-hover:text-[#5C4033] transition text-lg">
                                  {order.order_number}
                                </h4>
                                <Badge className={cn("flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5", statusInfo.color)}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusInfo.label}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-[#6B5D52]">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {new Date(order.created_at).toLocaleDateString("es-ES", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-xl font-bold bg-gradient-to-r from-[#5C4033] to-[#3D2817] bg-clip-text text-transparent">
                                ${order.total_amount.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </p>
                              <ArrowRight className="h-5 w-5 text-[#8B6F47] ml-auto mt-2 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Información del Perfil */}
            <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg">
              <CardHeader className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white">
                <CardTitle className="text-[#3D2817] flex items-center gap-2">
                  <User className="h-5 w-5 text-[#5C4033]" />
                  Mi Perfil
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E1D5C8] bg-white/50">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5F1ED] to-white border border-[#E1D5C8]">
                      <User className="h-4 w-4 text-[#5C4033]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">Nombre</p>
                      <p className="font-semibold text-[#3D2817] truncate">{userProfile?.full_name || "No especificado"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E1D5C8] bg-white/50">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5F1ED] to-white border border-[#E1D5C8]">
                      <Mail className="h-4 w-4 text-[#5C4033]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">Email</p>
                      <p className="text-sm text-[#3D2817] truncate">{userProfile?.email || user?.email}</p>
                    </div>
                  </div>
                  {memberSince && (
                    <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E1D5C8] bg-white/50">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5F1ED] to-white border border-[#E1D5C8]">
                        <Calendar className="h-4 w-4 text-[#5C4033]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">Miembro desde</p>
                        <p className="text-sm font-semibold text-[#3D2817]">{memberSince}</p>
                      </div>
                    </div>
                  )}
                </div>
                <Button asChild variant="outline" className="w-full border-2 border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5F1ED]">
                  <Link href="/profile">
                    <User className="mr-2 h-4 w-4" />
                    Editar Perfil
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Ayuda y Contacto */}
            <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-[#F5F1ED] to-white shadow-lg">
              <CardHeader className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#5C4033] to-[#3D2817]">
                <CardTitle className="text-white flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  ¿Necesitas Ayuda?
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <a
                    href="https://wa.me/573214070292"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#E1D5C8] bg-white/50 hover:bg-white hover:border-[#5C4033] transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                      <Phone className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">WhatsApp</p>
                      <p className="font-semibold text-[#3D2817] group-hover:text-[#5C4033] transition">321 407 0292</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#8B6F47] group-hover:translate-x-1 transition-transform" />
                  </a>
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E1D5C8] bg-white/50">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5F1ED] to-white border border-[#E1D5C8]">
                      <Mail className="h-4 w-4 text-[#5C4033]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">Email</p>
                      <p className="text-sm font-semibold text-[#3D2817] break-all">papeleriyvariedadessr@gmail.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-[#E1D5C8] bg-white/50">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5F1ED] to-white border border-[#E1D5C8]">
                      <MapPin className="h-4 w-4 text-[#5C4033]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">Dirección</p>
                      <p className="text-sm text-[#3D2817]">
                        Calle 19 40a 12 SMZ 3 MZ 9, CS 15 Etapa II
                        <br />
                        Barrio San Antonio, Villavicencio - Meta
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Promociones */}
            <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-[#F5F1ED] via-white to-[#FBF8F4] shadow-lg overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#5C4033]/10 to-transparent rounded-bl-full" />
              <CardHeader className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white relative z-10">
                <CardTitle className="text-[#3D2817] flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[#5C4033]" />
                  Beneficios Exclusivos
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 relative z-10">
                <div className="space-y-4">
                  <p className="text-sm text-[#6B5D52] leading-relaxed">
                    Recibe promociones personalizadas, combos especiales y descuentos exclusivos por ser parte de nuestra
                    comunidad.
                  </p>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10] shadow-lg"
                  >
                    <Link href="/promotions">
                      <Gift className="mr-2 h-4 w-4" />
                      Ver Promociones Activas
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/orders"
            className="group relative h-auto p-6 rounded-2xl border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] hover:bg-gradient-to-br hover:from-[#F5F1ED] hover:to-white hover:border-[#5C4033] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#5C4033]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#5C4033] to-[#3D2817] shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <ClipboardList className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-[#3D2817] text-lg mb-1">Mis Órdenes</p>
                <p className="text-xs text-[#6B5D52]">Ver historial completo</p>
              </div>
            </div>
          </Link>

          <Link
            href="/cart"
            className="group relative h-auto p-6 rounded-2xl border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] hover:bg-gradient-to-br hover:from-[#F5F1ED] hover:to-white hover:border-[#5C4033] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#5C4033]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <ShoppingCart className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-[#3D2817] text-lg mb-1">Mi Carrito</p>
                <p className="text-xs text-[#6B5D52]">Continuar comprando</p>
              </div>
            </div>
          </Link>

          <Link
            href="/profile"
            className="group relative h-auto p-6 rounded-2xl border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] hover:bg-gradient-to-br hover:from-[#F5F1ED] hover:to-white hover:border-[#5C4033] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#5C4033]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <User className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-[#3D2817] text-lg mb-1">Mi Perfil</p>
                <p className="text-xs text-[#6B5D52]">Actualizar información</p>
              </div>
            </div>
          </Link>

          <Link
            href="/products"
            className="group relative h-auto p-6 rounded-2xl border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] hover:bg-gradient-to-br hover:from-[#F5F1ED] hover:to-white hover:border-[#5C4033] hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#5C4033]/5 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <ShoppingBag className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-[#3D2817] text-lg mb-1">Productos</p>
                <p className="text-xs text-[#6B5D52]">Explorar catálogo</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
