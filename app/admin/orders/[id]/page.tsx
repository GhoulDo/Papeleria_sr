"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { 
  Loader2, 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Package,
  DollarSign,
  Calendar,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  CreditCard,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { updateStock } from "@/lib/utils/stock-validator"

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
    product_id: string
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

const paymentStatusConfig = {
  pending: { label: "Pendiente", color: "bg-yellow-100 text-yellow-800" },
  completed: { label: "Completado", color: "bg-green-100 text-green-800" },
  failed: { label: "Fallido", color: "bg-red-100 text-red-800" },
  refunded: { label: "Reembolsado", color: "bg-gray-100 text-gray-800" },
}

const statusOptions = ["pending", "processing", "shipped", "delivered", "cancelled"]

export default function OrderDetailAdminPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  const supabase = createClient()
  const orderId = useMemo(() => params?.id as string | undefined, [params?.id])

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    let cancelled = false

  const fetchOrder = async () => {
      setLoading(true)
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          order_items(
            id,
              product_id,
            quantity,
            unit_price,
            product:products(name)
          ),
          user:users(email, full_name, phone)
        `,
        )
          .eq("id", orderId)
        .single()

        if (cancelled) return

      if (error) throw error
      setOrder(data)
    } catch (error) {
        if (cancelled) return
      console.error("Error fetching order:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar la orden",
          variant: "destructive",
        })
    } finally {
        if (!cancelled) {
      setLoading(false)
    }
  }
    }

    fetchOrder()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  const handleStatusChange = async (newStatus: string) => {
    if (!order) return

    setUpdating(true)
    try {
      const oldStatus = order.status

      // Si se cancela una orden, restaurar el stock
      if (newStatus === "cancelled" && oldStatus !== "cancelled") {
        for (const item of order.order_items) {
          const stockUpdated = await updateStock(item.product_id, item.quantity, "increase")
          if (!stockUpdated) {
            console.error(`Error al restaurar stock del producto en la orden ${order.order_number}`)
          }
        }
      }

      // Si se cambia de cancelada a otro estado, reducir el stock nuevamente
      if (oldStatus === "cancelled" && newStatus !== "cancelled") {
        for (const item of order.order_items) {
          const stockUpdated = await updateStock(item.product_id, item.quantity, "decrease")
          if (!stockUpdated) {
            console.error(`Error al reducir stock del producto en la orden ${order.order_number}`)
            toast({
              title: "Advertencia",
              description: "La orden se actualizó pero hubo problemas al actualizar el stock. Verifica manualmente.",
              variant: "destructive",
            })
          }
        }
      }

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
        description: `El estado de pago ahora es: ${newStatus}`,
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
      <div className="flex justify-center items-center h-96 bg-gradient-to-b from-[#F7F1EB] to-white">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <div className="space-y-4">
            <div className="text-6xl mb-4">📋</div>
            <h1 className="text-3xl font-bold text-[#3D2817]">Orden no encontrada</h1>
            <p className="text-[#6B5D52]">La orden que buscas no existe o no tienes permiso para verla.</p>
            <Button asChild className="mt-6 bg-[#5C4033] hover:bg-[#3D2817] text-white">
              <Link href="/admin/orders">Volver a Órdenes</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const statusInfo = statusConfig[order.status as keyof typeof statusConfig] || statusConfig.pending
  const StatusIcon = statusInfo.icon
  const paymentStatusInfo = paymentStatusConfig[order.payment_status as keyof typeof paymentStatusConfig] || paymentStatusConfig.pending

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
      <div className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Button
              variant="outline"
              className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#5C4033] to-[#3D2817] shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
        <div>
                <h1 className="text-3xl md:text-4xl font-bold text-[#3D2817]">Orden {order.order_number}</h1>
                <p className="text-[#6B5D52] mt-1 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Creada el {new Date(order.created_at).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
          </p>
              </div>
            </div>
        </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
            {/* Status Management */}
              <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg">
                <CardHeader className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white">
                  <CardTitle className="text-[#3D2817] flex items-center gap-2">
                    <Package className="h-5 w-5 text-[#5C4033]" />
                    Gestión de Orden
                  </CardTitle>
              </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#3D2817] flex items-center gap-2">
                      <span>Estado de Orden</span>
                      <Badge className={cn("flex items-center gap-1.5", statusInfo.color)}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusInfo.label}
                      </Badge>
                    </Label>
                  <Select value={order.status} onValueChange={handleStatusChange} disabled={updating}>
                      <SelectTrigger className="border-2 border-[#D4C4B0] bg-white focus:border-[#5C4033] h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {statusOptions.map((status) => {
                          const config = statusConfig[status as keyof typeof statusConfig]
                          const Icon = config.icon
                          return (
                        <SelectItem key={status} value={status}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {config.label}
                              </div>
                        </SelectItem>
                          )
                        })}
                    </SelectContent>
                  </Select>
                </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-[#3D2817] flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-[#5C4033]" />
                      Estado de Pago
                    </Label>
                  <Select value={order.payment_status} onValueChange={handlePaymentStatusChange} disabled={updating}>
                      <SelectTrigger className="border-2 border-[#D4C4B0] bg-white focus:border-[#5C4033] h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="completed">Completado</SelectItem>
                      <SelectItem value="failed">Fallido</SelectItem>
                      <SelectItem value="refunded">Reembolsado</SelectItem>
                    </SelectContent>
                  </Select>
                    <Badge className={cn("mt-2", paymentStatusInfo.color)}>
                      {paymentStatusInfo.label}
                    </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Customer Info */}
              <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg">
                <CardHeader className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white">
                  <CardTitle className="text-[#3D2817] flex items-center gap-2">
                    <User className="h-5 w-5 text-[#5C4033]" />
                    Información del Cliente
                  </CardTitle>
              </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E1D5C8] bg-white/50">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5F1ED] to-white border border-[#E1D5C8]">
                      <User className="h-5 w-5 text-[#5C4033]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">Nombre Completo</p>
                      <p className="font-semibold text-[#3D2817]">{order.user.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E1D5C8] bg-white/50">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5F1ED] to-white border border-[#E1D5C8]">
                      <Mail className="h-5 w-5 text-[#5C4033]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">Email</p>
                      <p className="text-[#3D2817]">{order.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-xl border border-[#E1D5C8] bg-white/50">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-[#F5F1ED] to-white border border-[#E1D5C8]">
                      <Phone className="h-5 w-5 text-[#5C4033]" />
                </div>
                    <div className="flex-1">
                      <p className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">Teléfono</p>
                      <p className="text-[#3D2817]">{order.user.phone || "No proporcionado"}</p>
                </div>
                </div>
              </CardContent>
            </Card>

            {/* Items */}
              <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg">
                <CardHeader className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white">
                  <CardTitle className="text-[#3D2817] flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5 text-[#5C4033]" />
                    Productos ({order.order_items.length})
                  </CardTitle>
              </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {order.order_items.map((item, index) => (
                      <div 
                        key={item.id} 
                        className={cn(
                          "flex justify-between items-center p-4 rounded-xl border border-[#E1D5C8] bg-white/50",
                          index !== order.order_items.length - 1 && "border-b"
                        )}
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-[#3D2817] mb-1">{item.product.name}</p>
                          <p className="text-sm text-[#6B5D52]">
                            ${item.unit_price.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} x {item.quantity} unidades
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#5C4033]">
                            ${(item.unit_price * item.quantity).toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                      </div>
                    ))}
                  </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
              <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-lg">
                <CardHeader className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white">
                  <CardTitle className="text-[#3D2817] flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-[#5C4033]" />
                    Dirección de Envío
                  </CardTitle>
              </CardHeader>
                <CardContent className="p-6">
                  <div className="p-4 rounded-xl border border-[#E1D5C8] bg-white/50">
                    <p className="font-medium text-[#3D2817] mb-1">{order.shipping_address}</p>
                    <p className="text-[#6B5D52]">{order.shipping_city}</p>
                  </div>
              </CardContent>
            </Card>
          </div>

            {/* Summary Sidebar */}
          <div>
              <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-xl sticky top-4">
                <CardHeader className="border-b border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white">
                  <CardTitle className="text-[#3D2817] flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-[#5C4033]" />
                    Resumen Financiero
                  </CardTitle>
              </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-3 border-b border-[#E1D5C8] pb-4">
                  <div className="flex justify-between text-sm">
                      <span className="text-[#6B5D52]">Subtotal</span>
                      <span className="font-medium text-[#3D2817]">${order.subtotal.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-[#6B5D52]">Impuestos</span>
                      <span className="font-medium text-[#3D2817]">${order.tax_amount.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                      <span className="text-[#6B5D52]">Envío</span>
                      <span className="font-medium text-[#3D2817]">${order.shipping_cost.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-[#5C4033] to-[#3D2817] text-white">
                      <p className="text-xs uppercase tracking-wider mb-2 opacity-90">Total</p>
                      <p className="text-4xl font-bold">${order.total_amount.toLocaleString("es-CO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>

                <div className="space-y-2">
                      <p className="text-xs font-semibold text-[#8B6F47] uppercase tracking-wider">Estados</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge className={cn("flex items-center gap-1.5", statusInfo.color)}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {statusInfo.label}
                        </Badge>
                        <Badge className={cn(paymentStatusInfo.color)}>
                          {paymentStatusInfo.label}
                    </Badge>
                      </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
