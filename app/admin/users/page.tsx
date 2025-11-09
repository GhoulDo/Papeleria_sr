"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Search, UserCog, ShieldCheck, ShieldAlert, CircleCheck, CircleDashed } from "lucide-react"
import { cn } from "@/lib/utils"

interface UserRecord {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: "admin" | "customer"
  is_active: boolean
  created_at: string
}

type RoleFilter = "all" | "admin" | "customer"
type StatusFilter = "all" | "active" | "inactive"

export default function UsersAdminPage() {
  const supabase = createClient()
  const { toast } = useToast()

  const [users, setUsers] = useState<UserRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    void fetchUsers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = setTimeout(() => {
      void fetchUsers({ silent: true })
    }, 250)
    return () => clearTimeout(handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, roleFilter, statusFilter])

  const fetchUsers = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      let query = supabase.from("users").select("*").order("created_at", { ascending: false })

      if (search.trim()) {
        const term = search.trim()
        query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)
      }

      if (roleFilter !== "all") {
        query = query.eq("role", roleFilter)
      }

      if (statusFilter !== "all") {
        query = query.eq("is_active", statusFilter === "active")
      }

      const { data, error } = await query

      if (error) throw error
      setUsers((data as UserRecord[]) ?? [])
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Error al cargar",
        description: "No fue posible obtener el listado de usuarios.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filteredCount = useMemo(() => users.length, [users])

  const handleToggleActive = async (user: UserRecord) => {
    setProcessingId(user.id)
    try {
      const { error } = await supabase.from("users").update({ is_active: !user.is_active }).eq("id", user.id)
      if (error) throw error
      setUsers((prev) =>
        prev.map((item) => (item.id === user.id ? { ...item, is_active: !user.is_active } : item)),
      )
      toast({
        title: user.is_active ? "Usuario desactivado" : "Usuario activado",
        description: `${user.email} ${user.is_active ? "ya no puede" : "ya puede"} iniciar sesión.`,
      })
    } catch (error) {
      console.error("Error toggling user status:", error)
      toast({
        title: "No se pudo actualizar",
        description: "Intenta nuevamente en unos segundos.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const handleChangeRole = async (user: UserRecord, role: "admin" | "customer") => {
    if (user.role === role) return
    setProcessingId(user.id)
    try {
      const { error } = await supabase.from("users").update({ role }).eq("id", user.id)
      if (error) throw error
      setUsers((prev) => prev.map((item) => (item.id === user.id ? { ...item, role } : item)))
      toast({
        title: "Rol actualizado",
        description: `${user.email} ahora es ${role === "admin" ? "Administrador" : "Usuario"}.`,
      })
    } catch (error) {
      console.error("Error updating role:", error)
      toast({
        title: "No se pudo asignar el rol",
        description: "Revisa que tengas permiso o inténtalo más tarde.",
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
          <Badge className="bg-[#5C4033] text-white uppercase tracking-[0.3em]">Usuarios</Badge>
          <h1 className="text-4xl font-bold text-[#3D2817]">Administración de cuentas</h1>
          <p className="max-w-2xl text-sm text-[#6B5D52]">
            Supervisa roles y estado de acceso. Activa, suspende o promueve cuentas según las necesidades del negocio.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]"
          onClick={() => fetchUsers({ silent: true })}
          disabled={refreshing}
        >
          <Search className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
          Actualizar lista
        </Button>
      </header>

      <Card className="mx-auto w-full max-w-6xl border-[#E1D5C8] bg-white/90 backdrop-blur">
        <CardContent className="space-y-4 p-6">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_250px]">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-[#8B6F47]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por correo o nombre..."
                className="pl-10 h-11 border-[#D4C4B0] bg-white/70"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
              <Select value={roleFilter} onValueChange={(value: RoleFilter) => setRoleFilter(value)}>
                <SelectTrigger className="h-11 border-[#D4C4B0] bg-white/70 text-[#5C4033]">
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  <SelectItem value="admin">Administradores</SelectItem>
                  <SelectItem value="customer">Usuarios</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={(value: StatusFilter) => setStatusFilter(value)}>
                <SelectTrigger className="h-11 border-[#D4C4B0] bg-white/70 text-[#5C4033]">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="inactive">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3 text-sm text-[#6B5D52]">
            {filteredCount === 0 ? (
              <span>No se encontraron usuarios con los filtros aplicados.</span>
            ) : (
              <span>
                Mostrando <strong className="text-[#3D2817]">{filteredCount}</strong>{" "}
                {filteredCount === 1 ? "usuario" : "usuarios"} filtrados.
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {filteredCount === 0 ? (
        <Card className="mx-auto w-full max-w-6xl border-dashed border-[#D4C4B0] bg-[#F5F1ED]/60 py-16 text-center">
          <CardContent className="space-y-3">
            <UserCog className="mx-auto h-10 w-10 text-[#8B6F47]" />
            <h3 className="text-2xl font-semibold text-[#3D2817]">Sin resultados</h3>
            <p className="text-sm text-[#6B5D52]">Ajusta los filtros o verifica la búsqueda ingresada.</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="mx-auto w-full max-w-6xl rounded-3xl border border-[#E1D5C8] bg-white/80 backdrop-blur">
          <div className="divide-y divide-[#F1E6D8]">
            {users.map((user) => {
              const isProcessing = processingId === user.id
              return (
                <div key={user.id} className="grid gap-4 p-5 transition hover:bg-[#FBF7F2]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-lg font-semibold text-[#3D2817]">
                          {user.full_name || "Sin nombre registrado"}
                        </h3>
                        <Badge
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                            user.role === "admin" ? "bg-[#5C4033] text-white" : "bg-[#E8DFD5] text-[#5C4033]",
                          )}
                        >
                          {user.role === "admin" ? "Administrador" : "Usuario"}
                        </Badge>
                        <Badge variant={user.is_active ? "outline" : "secondary"}>
                          {user.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-[#6B5D52]">
                        <p>{user.email}</p>
                        <p>{user.phone || "Teléfono no registrado"}</p>
                        <p className="text-xs">
                          Alta:{" "}
                          {new Date(user.created_at).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleChangeRole(user, value as "admin" | "customer")}
                        disabled={isProcessing}
                      >
                        <SelectTrigger className="w-40 border-[#D4C4B0] text-[#5C4033]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">
                            <span className="flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4" /> Usuario
                            </span>
                          </SelectItem>
                          <SelectItem value="admin">
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" /> Administrador
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        variant={user.is_active ? "outline" : "default"}
                        className={cn(
                          "border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]",
                          !user.is_active && "bg-[#5C4033] text-white hover:bg-[#3D2817]",
                        )}
                        onClick={() => handleToggleActive(user)}
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : user.is_active ? (
                          <CircleDashed className="mr-2 h-4 w-4" />
                        ) : (
                          <CircleCheck className="mr-2 h-4 w-4" />
                        )}
                        {user.is_active ? "Suspender" : "Reactivar"}
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

