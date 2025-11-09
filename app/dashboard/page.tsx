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
} from "lucide-react"
import Link from "next/link"

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
  lastOrder?: {
    orderNumber: string
    createdAt: string
    totalAmount: number
    status: string
  }
}

type OrderSummary = {
  order_number: string
  total_amount: number
  status: string
  created_at: string
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    totalSpent: 0,
    pendingOrders: 0,
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

        // Fetch order stats
        const { data: ordersData } = await supabase
          .from("orders")
          .select("order_number, total_amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (ordersData) {
          const totalOrders = ordersData.length
          const totalSpent = ordersData.reduce((sum: number, order: OrderSummary) => sum + order.total_amount, 0)
          const pendingOrders = ordersData.filter(
            (order: OrderSummary) => order.status === "pending" || order.status === "processing",
          ).length
          const latestOrder = ordersData[0] as OrderSummary | undefined

          setStats({
            totalOrders,
            totalSpent,
            pendingOrders,
            lastOrder: latestOrder
              ? {
                  orderNumber: latestOrder.order_number,
                  createdAt: latestOrder.created_at,
                  totalAmount: latestOrder.total_amount,
                  status: latestOrder.status,
                }
              : undefined,
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
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8B6F47]">Panel del cliente</p>
          <h1 className="mt-2 text-3xl font-bold text-[#3D2817]">
            Hola, {userProfile?.full_name || user?.email?.split("@")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">
            Consulta tus compras, gestiona tu información y descubre las novedades de Papelería S.R.
          </p>
        </div>
        <Button asChild className="bg-[#5C4033] text-white hover:bg-[#3D2817]">
          <Link href="/products">
            Ir al catálogo
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-[#3D2817]">Órdenes totales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-[#C97D2E]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#3D2817]">{stats.totalOrders}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total gastado: ${stats.totalSpent.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-[#3D2817]">Órdenes pendientes</CardTitle>
            <Package className="h-4 w-4 text-[#5C4033]" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-[#3D2817]">{stats.pendingOrders}</p>
            <p className="mt-1 text-xs text-muted-foreground">En procesamiento o por entregar</p>
          </CardContent>
        </Card>

        <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium text-[#3D2817]">Miembro desde</CardTitle>
            <User className="h-4 w-4 text-[#8B6F47]" />
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-[#3D2817]">
              {userProfile?.created_at
                ? new Date(userProfile.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "short",
                  })
                : "-"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Gracias por confiar en nosotros</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-[#3D2817]">Tu última compra</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#6B5D52]">
            {stats.lastOrder ? (
              <>
                <p className="text-base font-semibold text-[#3D2817]">Orden {stats.lastOrder.orderNumber}</p>
                <div className="grid gap-2">
                  <span>
                    Fecha:{" "}
                    {new Date(stats.lastOrder.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span>
                    Total pagado:{" "}
                    <strong className="text-[#5C4033]">${stats.lastOrder.totalAmount.toFixed(2)}</strong>
                  </span>
                  <span>
                    Estado:{" "}
                    <Badge
                      variant="outline"
                      className="border-[#D4C4B0] bg-[#F8F4ED] text-[#5C4033]"
                    >
                      {stats.lastOrder.status}
                    </Badge>
                  </span>
                </div>
                <Button asChild variant="outline" className="border-[#D4C4B0] text-[#5C4033]">
                  <Link href={`/orders/${stats.lastOrder.orderNumber}`}>Ver detalles</Link>
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <p>Aún no has realizado compras. ¡Explora nuestro catálogo para descubrir todo lo que tenemos!</p>
                <Button asChild className="bg-[#5C4033] text-white hover:bg-[#3D2817]">
                  <Link href="/products">
                    Comprar ahora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-[#E1D5C8] bg-[#F8F4ED]">
          <CardHeader>
            <CardTitle className="text-[#3D2817]">¿Necesitas ayuda?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-[#6B5D52]">
            <div className="grid gap-2">
              <span className="inline-flex items-center gap-2">
                <Headphones className="h-4 w-4 text-[#C97D2E]" />
                Escríbenos al WhatsApp 321 407 0292
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#5C4033]" />
                papeleriyvariedadessr@gmail.com
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#5C4033]" />
                Calle 19 40a 12 SMZ 3 MZ 9 · Villavicencio
              </span>
            </div>
            <Button asChild variant="outline" className="border-[#D4C4B0] text-[#5C4033]">
              <Link href="/profile">Actualizar mis datos</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="rounded-3xl border border-[#E1D5C8] bg-white/80 p-6 text-sm text-[#6B5D52] shadow-sm backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8B6F47]">Beneficios exclusivos</p>
            <p className="mt-1 text-[#3D2817]">
              Recibe promociones personalizadas y combos especiales por ser parte de Papelería S.R.
            </p>
          </div>
          <Button asChild variant="secondary" className="bg-[#F5F1ED] text-[#5C4033] hover:bg-[#E8DFD5]">
            <Link href="/promotions">
              Ver promociones activas
              <Gift className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
