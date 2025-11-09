"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, RefreshCcw, Pencil, Trash2, CircleCheck, CircleDashed } from "lucide-react"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface AdminCategory {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function AdminCategoriesPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    void fetchCategories()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      void fetchCategories({ silent: true })
    }, 250)

    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter])

  const filteredCategories = useMemo(() => {
    if (!search && statusFilter === "all") return categories

    return categories.filter((category) => {
      const matchesSearch = search
        ? category.name.toLowerCase().includes(search.toLowerCase()) ||
          category.slug.toLowerCase().includes(search.toLowerCase())
        : true
      const matchesStatus =
        statusFilter === "all" ? true : statusFilter === "active" ? category.is_active : !category.is_active
      return matchesSearch && matchesStatus
    })
  }, [categories, search, statusFilter])

  const fetchCategories = async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error
      setCategories(data ?? [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "Error al cargar",
        description: "No pudimos obtener la lista de categorías. Intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleToggleStatus = async (category: AdminCategory) => {
    setProcessingId(category.id)
    try {
      const { error } = await supabase
        .from("categories")
        .update({ is_active: !category.is_active })
        .eq("id", category.id)

      if (error) throw error

      setCategories((prev) =>
        prev.map((cat) => (cat.id === category.id ? { ...cat, is_active: !cat.is_active } : cat)),
      )

      toast({
        title: !category.is_active ? "Categoría activada" : "Categoría desactivada",
        description: `${category.name} ahora está ${!category.is_active ? "disponible" : "en pausa"}.`,
      })
    } catch (error) {
      console.error("Error toggling category:", error)
      toast({
        title: "No se pudo actualizar",
        description: "Revisa la conexión y vuelve a intentarlo.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleDelete = async (category: AdminCategory) => {
    const confirmed = window.confirm(
      `¿Eliminar la categoría "${category.name}"?\nEsta acción no se puede deshacer y afectará a los productos relacionados.`,
    )
    if (!confirmed) return

    setProcessingId(category.id)
    try {
      const { error } = await supabase.from("categories").delete().eq("id", category.id)
      if (error) throw error

      setCategories((prev) => prev.filter((cat) => cat.id !== category.id))

      toast({
        title: "Categoría eliminada",
        description: `${category.name} fue removida del catálogo.`,
      })
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "No se pudo eliminar",
        description: "Verifica que no existan productos asociados o inténtalo más tarde.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <Badge className="bg-[#5C4033] text-white rounded-full px-4 py-1 uppercase tracking-widest">Gestión</Badge>
          <h1 className="text-4xl font-bold text-[#3D2817]">Categorías</h1>
          <p className="text-[#6B5D52] max-w-2xl">
            Administra el inventario de categorías, controla su disponibilidad y mantiene el catálogo organizado para el
            equipo de ventas y los clientes.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]"
            onClick={() => fetchCategories({ silent: true })}
            disabled={refreshing}
          >
            <RefreshCcw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
            Actualizar
          </Button>
          <Button asChild className="bg-[#5C4033] hover:bg-[#3D2817] text-white">
            <Link href="/admin/categories/new">
              <Plus className="mr-2 h-4 w-4" />
              Nueva categoría
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
        <CardHeader className="space-y-4">
          <CardTitle className="text-[#3D2817]">Búsqueda avanzada</CardTitle>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
            <Input
              placeholder="Buscar por nombre o slug..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-11 border-[#D4C4B0] bg-white/70"
            />

            <Select value={statusFilter} onValueChange={(value: typeof statusFilter) => setStatusFilter(value)}>
              <SelectTrigger className="h-11 border-[#D4C4B0] bg-white/70 text-[#5C4033]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                <SelectItem value="active">Solo activas</SelectItem>
                <SelectItem value="inactive">Solo inactivas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card className="border-dashed border-[#D4C4B0] bg-[#F5F1ED]/60 py-16 text-center">
          <CardContent className="space-y-3">
            <CircleDashed className="mx-auto h-10 w-10 text-[#8B6F47]" />
            <h3 className="text-2xl font-semibold text-[#3D2817]">No encontramos categorías</h3>
            <p className="text-sm text-[#6B5D52]">
              Ajusta los filtros o crea una nueva categoría para ampliar el catálogo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="rounded-3xl border border-[#E1D5C8] bg-white/70 backdrop-blur">
          <div className="divide-y divide-[#F1E6D8]">
            {filteredCategories.map((category) => {
              const isProcessing = processingId === category.id
              return (
                <div key={category.id} className="grid gap-4 p-5 transition hover:bg-[#FBF7F2]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-1 gap-4">
                      <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-[#E1D5C8] bg-[#F5F1ED]">
                        {category.image_url ? (
                          <Image src={category.image_url} alt={category.name} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-[#8B6F47]">
                            Sin imagen
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="text-xl font-semibold text-[#3D2817]">{category.name}</h3>
                          <Badge
                            variant={category.is_active ? "default" : "secondary"}
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                              category.is_active ? "bg-[#5C4033] text-white" : "bg-[#E8DFD5] text-[#5C4033]",
                            )}
                          >
                            {category.is_active ? "Activa" : "Inactiva"}
                          </Badge>
                        </div>
                        <p className="text-sm text-[#6B5D52] max-w-2xl">
                          {category.description || "Esta categoría todavía no tiene una descripción detallada."}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-[#8B6F47]">
                          <span className="rounded-full border border-[#D4C4B0] bg-[#F5F1ED]/70 px-3 py-1 font-medium">
                            slug: {category.slug}
                          </span>
                          <span className="rounded-full border border-[#D4C4B0] bg-[#F5F1ED]/70 px-3 py-1">
                            Creada: {new Date(category.created_at).toLocaleDateString("es-CO")}
                          </span>
                          <span className="rounded-full border border-[#D4C4B0] bg-[#F5F1ED]/70 px-3 py-1">
                            Actualizada: {new Date(category.updated_at).toLocaleDateString("es-CO")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={category.is_active ? "outline" : "default"}
                        className={cn(
                          "border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]",
                          !category.is_active && "bg-[#5C4033] text-white hover:bg-[#3D2817]",
                        )}
                        onClick={() => handleToggleStatus(category)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : category.is_active ? (
                          <CircleDashed className="mr-2 h-4 w-4" />
                        ) : (
                          <CircleCheck className="mr-2 h-4 w-4" />
                        )}
                        {category.is_active ? "Pausar" : "Activar"}
                      </Button>

                      <Button asChild variant="outline" className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]">
                        <Link href={`/admin/categories/${category.id}`}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Link>
                      </Button>

                      <Button
                        variant="destructive"
                        className="bg-[#C85A54] hover:bg-[#b24d48]"
                        onClick={() => handleDelete(category)}
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

