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
    <div className="space-y-8 px-4 py-12">
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Badge className="bg-[#5C4033] text-white uppercase tracking-[0.3em]">Promociones</Badge>
          <h1 className="text-4xl font-bold text-[#3D2817]">Gestión de descuentos y cupones</h1>
          <p className="max-w-2xl text-sm text-[#6B5D52]">
            Controla códigos, vigencias y límites para campañas comerciales. Activa o pausa promociones en cualquier
            momento.
          </p>
        </div>
        <Button asChild className="bg-[#5C4033] hover:bg-[#3D2817] text-white">
          <Link href="/admin/promotions/new">
            <Plus className="mr-2 h-4 w-4" />
            Nueva promoción
          </Link>
        </Button>
      </header>

      <Card className="mx-auto w-full max-w-6xl border-[#E1D5C8] bg-white/90 backdrop-blur">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_260px]">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nombre o código..."
              className="h-11 border-[#D4C4B0] bg-white/70"
            />
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="h-11 border-[#D4C4B0] bg-white/70 text-[#5C4033]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="active">Activas</SelectItem>
                  <SelectItem value="inactive">Inactivas</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={(value: TypeFilter) => setTypeFilter(value)}>
                <SelectTrigger className="h-11 border-[#D4C4B0] bg-white/70 text-[#5C4033]">
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

          <div className="rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3 text-sm text-[#6B5D52]">
            {filteredCount === 0 ? (
              <span>No se encontraron promociones con los filtros seleccionados.</span>
            ) : (
              <span>
                Mostrando <strong className="text-[#3D2817]">{filteredCount}</strong>{" "}
                {filteredCount === 1 ? "promoción" : "promociones"} en la tabla.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredCount === 0 ? (
        <Card className="mx-auto w-full max-w-6xl border-dashed border-[#D4C4B0] bg-[#F5F1ED]/60 py-16 text-center">
          <CardContent className="space-y-3">
            <Percent className="mx-auto h-10 w-10 text-[#8B6F47]" />
            <h3 className="text-2xl font-semibold text-[#3D2817]">Sin promociones activas</h3>
            <p className="text-sm text-[#6B5D52]">Crea una nueva promoción para impulsar tus ventas.</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="mx-auto w-full max-w-6xl rounded-3xl border border-[#E1D5C8] bg-white/80 backdrop-blur">
          <div className="divide-y divide-[#F1E6D8]">
            {promotions.map((promo) => {
              const isProcessing = processingId === promo.id
              const isExpired = new Date(promo.end_date) < new Date()
              const discountLabel =
                promo.discount_type === "percentage"
                  ? `${Number(promo.discount_value).toFixed(0)}%`
                  : `$${Number(promo.discount_value).toLocaleString("es-CO")}`

              return (
                <div key={promo.id} className="grid gap-4 p-5 transition hover:bg-[#FBF7F2]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-[#3D2817]">{promo.name}</h3>
                        <Badge
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                            promo.is_active ? "bg-[#5C4033] text-white" : "bg-[#E8DFD5] text-[#5C4033]",
                          )}
                        >
                          {promo.is_active ? "Activa" : "Inactiva"}
                        </Badge>
                        {isExpired && <Badge variant="secondary">Expirada</Badge>}
                      </div>
                      <p className="text-sm text-[#6B5D52]">{promo.description || "Sin descripción personalizada."}</p>
                      <div className="flex flex-wrap gap-3 text-xs text-[#8B6F47]">
                        <span className="rounded-full border border-[#D4C4B0] bg-[#F5F1ED]/70 px-3 py-1 font-mono">
                          Código: {promo.code}
                        </span>
                        <span className="rounded-full border border-[#D4C4B0] bg-[#F5F1ED]/70 px-3 py-1">
                          Descuento: {discountLabel}
                        </span>
                        {promo.min_purchase_amount && (
                          <span className="rounded-full border border-[#D4C4B0] bg-[#F5F1ED]/70 px-3 py-1">
                            Compra mínima: ${Number(promo.min_purchase_amount).toLocaleString("es-CO")}
                          </span>
                        )}
                        <span className="rounded-full border border-[#D4C4B0] bg-[#F5F1ED]/70 px-3 py-1">
                          Uso: {promo.usage_count ?? 0}
                          {promo.usage_limit ? ` / ${promo.usage_limit}` : ""}
                        </span>
                      </div>
                      <p className="flex items-center gap-2 text-xs text-[#6B5D52]">
                        <CalendarClock className="h-4 w-4" />
                        Vigencia:{" "}
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
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant={promo.is_active ? "outline" : "default"}
                        className={cn(
                          "border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]",
                          !promo.is_active && "bg-[#5C4033] text-white hover:bg-[#3D2817]",
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

                      <Button asChild variant="outline" className="border-[#D4C4B0] text-[#5C4033]">
                        <Link href={`/admin/promotions/${promo.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>

                      <Button
                        variant="destructive"
                        className="bg-[#C85A54] hover:bg-[#b24d48]"
                        onClick={() => handleDelete(promo)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
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
