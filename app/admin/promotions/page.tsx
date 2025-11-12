"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  CircleCheck,
  CircleDashed,
  Percent,
  CalendarClock,
  Hash,
  Users,
  ShoppingCart,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface PromotionRow {
  id: string
  name: string
  description: string | null
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  is_active: boolean
  start_date: string
  end_date: string
  min_purchase_amount: number | null
  usage_limit: number | null
  usage_count: number | null
  created_at: string
  updated_at: string
}

type StatusFilter = "all" | "active" | "inactive"
type TypeFilter = "all" | "percentage" | "fixed"

export default function PromotionsAdminPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [promotions, setPromotions] = useState<PromotionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    void fetchPromotions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      void fetchPromotions({ silent: true })
    }, 250)
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, typeFilter])

  const fetchPromotions = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      let query = supabase.from("promotions").select("*").order("created_at", { ascending: false })

      if (search.trim()) {
        const term = search.trim()
        query = query.or(`name.ilike.%${term}%,code.ilike.%${term}%`)
      }

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active")
      }

      if (typeFilter !== "all") {
        query = query.eq("discount_type", typeFilter)
      }

      const { data, error } = await query

      if (error) throw error
      setPromotions((data as PromotionRow[]) ?? [])
    } catch (error) {
      console.error("Error fetching promotions:", error)
      toast({
        title: "Error al cargar",
        description: "No fue posible obtener la lista de promociones.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredCount = useMemo(() => promotions.length, [promotions])

  const handleToggleActive = async (promo: PromotionRow) => {
    setProcessingId(promo.id)
    try {
      const { error } = await supabase.from("promotions").update({ is_active: !promo.is_active }).eq("id", promo.id)
      if (error) throw error
      setPromotions((prev) =>
        prev.map((item) => (item.id === promo.id ? { ...item, is_active: !promo.is_active } : item)),
      )
      toast({
        title: `Promoción ${promo.is_active ? "pausada" : "activada"}`,
        description: `${promo.name} ${promo.is_active ? "ya no aplica" : "aplica nuevamente"} en el checkout.`,
      })
    } catch (error) {
      console.error("Error toggling promotion:", error)
      toast({
        title: "No se pudo actualizar",
        description: "Intenta de nuevo en unos segundos.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (promo: PromotionRow) => {
    const confirmed = window.confirm(`¿Eliminar la promoción "${promo.name}"? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    setProcessingId(promo.id)
    try {
      const { error } = await supabase.from("promotions").delete().eq("id", promo.id)
      if (error) throw error
      setPromotions((prev) => prev.filter((item) => item.id !== promo.id))
      toast({
        title: "Promoción eliminada",
        description: `${promo.name} se removió del sistema.`,
      })
    } catch (error) {
      console.error("Error deleting promotion:", error)
      toast({
        title: "No se pudo eliminar",
        description: "Revisa si la promoción está asociada a órdenes recientes.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
      </div>
    )
  }

  return (
    <div className="space-y-8 px-4 py-12 bg-gradient-to-b from-[#F7F1EB] to-white min-h-screen">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Badge className="bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white uppercase tracking-[0.3em] px-4 py-1.5 shadow-md">
              <Percent className="mr-2 h-3 w-3" />
              Promociones
            </Badge>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#3D2817] leading-tight">
            Gestión de Descuentos y Cupones
          </h1>
          <p className="max-w-2xl text-base text-[#6B5D52] leading-relaxed">
            Controla códigos promocionales, vigencias y límites para tus campañas comerciales. 
            Activa o pausa promociones en cualquier momento desde aquí.
          </p>
        </div>
        <Button 
          asChild 
          className="bg-gradient-to-r from-[#5C4033] to-[#3D2817] hover:from-[#3D2817] hover:to-[#2A1C10] text-white shadow-lg hover:shadow-xl transition-all h-12 px-6"
        >
          <Link href="/admin/promotions/new">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Promoción
          </Link>
        </Button>
      </header>

      <Card className="mx-auto w-full max-w-6xl border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-xl">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="relative">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="🔍 Buscar por nombre o código..."
                className="h-12 border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 text-[#3D2817] placeholder:text-[#8B6F47]"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="h-12 border-2 border-[#D4C4B0] bg-white/80 text-[#5C4033] focus:border-[#5C4033]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(value: TypeFilter) => setTypeFilter(value)}>
                <SelectTrigger className="h-12 border-2 border-[#D4C4B0] bg-white/80 text-[#5C4033] focus:border-[#5C4033]">
                  <SelectValue placeholder="Tipo de descuento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  <SelectItem value="percentage">Porcentaje</SelectItem>
                  <SelectItem value="fixed">Fijo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white px-5 py-4 text-sm text-[#6B5D52] shadow-inner">
            <div className="flex items-center justify-between">
              {filteredCount === 0 ? (
                <span className="flex items-center gap-2">
                  <span>📭</span>
                  <span>No se encontraron promociones con los filtros seleccionados.</span>
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <span>📊</span>
                  <span>
                    Mostrando <strong className="text-[#3D2817] font-semibold">{filteredCount}</strong>{" "}
                    {filteredCount === 1 ? "promoción" : "promociones"} en la lista.
                  </span>
                </span>
              )}
              {refreshing && (
                <Loader2 className="h-4 w-4 animate-spin text-[#5C4033]" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredCount === 0 ? (
        <Card className="mx-auto w-full max-w-6xl border-2 border-dashed border-[#D4C4B0] bg-gradient-to-br from-[#F5F1ED] to-white py-20 text-center shadow-lg">
          <CardContent className="space-y-4">
            <div className="mx-auto w-20 h-20 rounded-full bg-[#F5F1ED] flex items-center justify-center mb-4">
              <Percent className="h-10 w-10 text-[#8B6F47]" />
            </div>
            <h3 className="text-3xl font-bold text-[#3D2817]">Sin promociones encontradas</h3>
            <p className="text-base text-[#6B5D52] max-w-md mx-auto">
              {search || statusFilter !== "all" || typeFilter !== "all"
                ? "Intenta ajustar los filtros de búsqueda o crea una nueva promoción."
                : "Crea tu primera promoción para comenzar a impulsar tus ventas con descuentos atractivos."}
            </p>
            {(!search && statusFilter === "all" && typeFilter === "all") && (
              <Button asChild className="mt-4 bg-[#5C4033] hover:bg-[#3D2817] text-white">
                <Link href="/admin/promotions/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Crear Primera Promoción
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="mx-auto w-full max-w-6xl rounded-3xl border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-xl">
          <div className="divide-y divide-[#E1D5C8]">
            {promotions.map((promo) => {
              const isProcessing = processingId === promo.id
              const isExpired = new Date(promo.end_date) < new Date()
              const discountLabel =
                promo.discount_type === "percentage"
                  ? `${Number(promo.discount_value).toFixed(0)}%`
                  : `$${Number(promo.discount_value).toLocaleString("es-CO")}`

              return (
                <div 
                  key={promo.id} 
                  className="group grid gap-4 p-6 transition-all hover:bg-gradient-to-r hover:from-[#FBF8F4] hover:to-white border-l-4 border-l-transparent hover:border-l-[#5C4033]"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-[#3D2817]">{promo.name}</h3>
                        <Badge
                          className={cn(
                            "rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wide shadow-sm",
                            promo.is_active 
                              ? "bg-gradient-to-r from-green-500 to-green-600 text-white" 
                              : "bg-[#E8DFD5] text-[#5C4033]",
                          )}
                        >
                          {promo.is_active ? "✓ Activa" : "○ Inactiva"}
                        </Badge>
                        {isExpired && (
                          <Badge className="bg-red-100 text-red-800 border border-red-200">
                            ⏰ Expirada
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-[#6B5D52] leading-relaxed">
                        {promo.description || "Sin descripción personalizada."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#D4C4B0] bg-gradient-to-r from-[#F5F1ED] to-white px-4 py-2 text-xs font-mono font-semibold text-[#5C4033] shadow-sm">
                          <Hash className="h-3 w-3" />
                          {promo.code}
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#D4C4B0] bg-gradient-to-r from-[#F5F1ED] to-white px-4 py-2 text-xs font-semibold text-[#5C4033] shadow-sm">
                          <Percent className="h-3 w-3" />
                          {discountLabel}
                        </span>
                        {promo.min_purchase_amount && (
                          <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#D4C4B0] bg-gradient-to-r from-[#F5F1ED] to-white px-4 py-2 text-xs text-[#6B5D52] shadow-sm">
                            <ShoppingCart className="h-3 w-3" />
                            Mín: ${Number(promo.min_purchase_amount).toLocaleString("es-CO")}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-2 rounded-full border-2 border-[#D4C4B0] bg-gradient-to-r from-[#F5F1ED] to-white px-4 py-2 text-xs text-[#6B5D52] shadow-sm">
                          <Users className="h-3 w-3" />
                          {promo.usage_count ?? 0}
                          {promo.usage_limit ? ` / ${promo.usage_limit}` : " usos"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#6B5D52] pt-2">
                        <CalendarClock className="h-4 w-4 flex-shrink-0" />
                        <span>
                          <strong>Vigencia:</strong>{" "}
                          {new Date(promo.start_date).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(promo.end_date).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 lg:flex-col lg:items-end">
                      <Button
                        variant={promo.is_active ? "outline" : "default"}
                        size="sm"
                        className={cn(
                          "border-2 border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED] transition-all",
                          !promo.is_active && "bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10] border-0 shadow-md",
                        )}
                        onClick={() => handleToggleActive(promo)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : promo.is_active ? (
                          <CircleDashed className="mr-2 h-4 w-4" />
                        ) : (
                          <CircleCheck className="mr-2 h-4 w-4" />
                        )}
                        {promo.is_active ? "Pausar" : "Activar"}
                      </Button>

                      <Button 
                        asChild 
                        variant="outline" 
                        size="sm"
                        className="border-2 border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5F1ED] hover:border-[#5C4033] transition-all"
                      >
                        <Link href={`/admin/promotions/${promo.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>

                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-0 shadow-md"
                        onClick={() => handleDelete(promo)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Eliminar
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  )
}
