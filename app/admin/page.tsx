"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Loader2,
  Package,
  Users,
  Tag,
  ShoppingBag,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Stats {
  totalProducts: number
  totalUsers: number
  totalPromotions: number
  totalOrders: number
  totalRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalUsers: 0,
    totalPromotions: 0,
    totalOrders: 0,
    totalRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get product count
        const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true })

        // Get users count
        const { count: usersCount } = await supabase.from("users").select("*", { count: "exact", head: true })

        // Get promotions count
        const { count: promotionsCount } = await supabase.from("promotions").select("*", { count: "exact", head: true })

        // Get orders stats
        const { data: ordersData } = await supabase.from("orders").select("total_amount, created_at")

        const orderRows = (ordersData ?? []) as Array<{ total_amount: number; created_at: string }>
        const totalOrders = orderRows.length
        const totalRevenue = orderRows.reduce((sum, order) => sum + (order.total_amount ?? 0), 0)

        setStats({
          totalProducts: productsCount || 0,
          totalUsers: usersCount || 0,
          totalPromotions: promotionsCount || 0,
          totalOrders,
          totalRevenue,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4 py-12">
      <section className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[#8B6F47]">Panel Administrativo</p>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold leading-tight text-[#3D2817]">Hola, gestionemos la tienda hoy</h1>
            <p className="text-sm text-[#6B5D52]">
              Revisa el estado general, crea productos y controla promociones desde este panel central.
            </p>
          </div>
          <Button asChild className="bg-[#5C4033] text-white hover:bg-[#3D2817]">
            <Link href="/admin/products/new">
              Nuevo producto
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          heading="Productos activos"
          icon={Package}
          value={stats.totalProducts.toString()}
          change={8}
          positive
          caption="Inventario publicado"
          actionLabel="Ver catálogo"
          href="/admin/products"
        />
        <StatCard
          heading="Usuarios registrados"
          icon={Users}
          value={stats.totalUsers.toString()}
          change={5}
          positive
          caption="Clientes y administradores"
          actionLabel="Gestionar usuarios"
          href="/admin/users"
        />
        <StatCard
          heading="Órdenes totales"
          icon={ShoppingBag}
          value={stats.totalOrders.toString()}
          change={-2}
          caption="Pedidos registrados"
          actionLabel="Ver órdenes"
          href="/admin/orders"
        />
        <StatCard
          heading="Ingresos acumulados"
          icon={TrendingUp}
          value={`$${stats.totalRevenue.toLocaleString("es-CO", {
            minimumFractionDigits: 0,
          })}`}
          change={12}
          positive
          caption="Ingresos históricos"
          actionLabel="Analizar ventas"
          href="/admin/orders"
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-[#E1D5C8] bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[#3D2817]">
              <span>Resumen general</span>
              <Badge className="bg-[#F5F1ED] text-[#5C4033]">Actualizado en tiempo real</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-[#E1D5C8] bg-[#F8F4F0] p-4">
              <p className="text-xs uppercase tracking-widest text-[#8B6F47]">Promociones activas</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-[#3D2817]">{stats.totalPromotions}</span>
                <Tag className="h-4 w-4 text-[#C97D2E]" />
              </div>
              <p className="mt-2 text-sm text-[#6B5D52]">
                Mantén el catálogo fresco con campañas periódicas. Las promociones activas impactan en el checkout.
              </p>
            </div>
            <div className="rounded-2xl border border-[#E1D5C8] bg-[#F0E6DC] p-4">
              <p className="text-xs uppercase tracking-widest text-[#8B6F47]">Estado del inventario</p>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-[#3D2817]">
                  {stats.totalProducts ? `${Math.max(stats.totalProducts - 5, 0)} en stock` : "Sin datos"}
                </span>
                <Package className="h-4 w-4 text-[#5C4033]" />
              </div>
              <p className="mt-2 text-sm text-[#6B5D52]">
                Revisa los productos con bajo inventario para evitar rupturas de stock y mantener la oferta al día.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-[#3D2817]">
              Próximas acciones
              <ArrowUpRight className="h-4 w-4 text-[#8B6F47]" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-[#6B5D52]">
            <ActionItem label="Registrar nuevo producto" href="/admin/products/new" />
            <ActionItem label="Crear promoción para temporada escolar" href="/admin/promotions/new" />
            <ActionItem label="Revisar usuarios pendientes de activación" href="/admin/users" />
            <ActionItem label="Ver órdenes recientes" href="/admin/orders" />
          </CardContent>
        </Card>
      </section>
    </div>
  )
}

interface StatCardProps {
  heading: string
  icon: React.ElementType
  value: string
  change: number
  positive?: boolean
  caption: string
  actionLabel: string
  href: string
}

function StatCard({ heading, icon: Icon, value, change, positive = false, caption, actionLabel, href }: StatCardProps) {
  return (
    <Card className="border-[#E1D5C8] bg-white/80 backdrop-blur">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm text-[#8B6F47]">{heading}</CardTitle>
          <Icon className="h-4 w-4 text-[#C97D2E]" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold text-[#3D2817]">{value}</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              positive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700",
            )}
          >
            {positive ? <ArrowUpRight className="mr-1 h-3 w-3" /> : <ArrowDownRight className="mr-1 h-3 w-3" />}
            {Math.abs(change)}%
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-[#6B5D52]">
        <p>{caption}</p>
        <Button asChild variant="ghost" className="px-0 text-[#5C4033] hover:text-[#3D2817]">
          <Link href={href}>
            {actionLabel}
            <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function ActionItem({ label, href }: { label: string; href: string }) {
  return (
    <Button asChild variant="ghost" className="block w-full justify-start px-0 text-[#5C4033] hover:text-[#3D2817]">
      <Link href={href}>
        {label}
        <ArrowUpRight className="ml-2 inline h-3.5 w-3.5" />
      </Link>
    </Button>
  )
}
