"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PromotionRecord {
  id: string
  name: string
  description: string | null
  code: string
  discount_type: "percentage" | "fixed"
  discount_value: number
  start_date: string
  end_date: string
  usage_limit: number | null
  usage_count: number | null
  min_purchase_amount: number | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function EditPromotionPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const supabase = createClient()
  const { toast } = useToast()

  const [promotion, setPromotion] = useState<PromotionRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [formState, setFormState] = useState({
    name: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    code: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    minPurchaseAmount: "",
    isActive: true,
  })

  useEffect(() => {
    void fetchPromotion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchPromotion = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("promotions").select("*").eq("id", params.id).single()
      if (error || !data) {
        toast({
          title: "Promoción no encontrada",
          description: "No pudimos localizar la promoción solicitada.",
          variant: "destructive",
        })
        router.push("/admin/promotions")
        return
      }

      setPromotion(data as PromotionRecord)
      setFormState({
        name: data.name ?? "",
        description: data.description ?? "",
        discountType: data.discount_type ?? "percentage",
        discountValue: data.discount_value ? String(data.discount_value) : "",
        code: data.code ?? "",
        startDate: data.start_date ? new Date(data.start_date).toISOString().slice(0, 16) : "",
        endDate: data.end_date ? new Date(data.end_date).toISOString().slice(0, 16) : "",
        usageLimit: data.usage_limit ? String(data.usage_limit) : "",
        minPurchaseAmount: data.min_purchase_amount ? String(data.min_purchase_amount) : "",
        isActive: data.is_active ?? true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange =
    (field: keyof typeof formState) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value
      setFormState((prev) => ({
        ...prev,
        [field]: value,
      }))
    }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!promotion) return

    if (!formState.name || !formState.code || !formState.discountValue || !formState.startDate || !formState.endDate) {
      toast({
        title: "Campos incompletos",
        description: "Completa nombre, código, valor y fechas para continuar.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from("promotions")
        .update({
          name: formState.name.trim(),
          description: formState.description.trim() || null,
          discount_type: formState.discountType,
          discount_value: Number.parseFloat(formState.discountValue),
          code: formState.code.trim().toUpperCase(),
          start_date: new Date(formState.startDate).toISOString(),
          end_date: new Date(formState.endDate).toISOString(),
          usage_limit: formState.usageLimit ? Number.parseInt(formState.usageLimit) : null,
          min_purchase_amount: formState.minPurchaseAmount ? Number.parseFloat(formState.minPurchaseAmount) : null,
          is_active: formState.isActive,
        })
        .eq("id", promotion.id)

      if (error) throw error

      toast({
        title: "Promoción actualizada",
        description: "Los cambios se guardaron correctamente.",
      })
      router.push("/admin/promotions")
    } catch (error) {
      console.error("Error updating promotion:", error)
      toast({
        title: "No se pudo actualizar",
        description: "Verifica los datos e inténtalo más tarde.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#5C4033]" />
      </div>
    )
  }

  if (!promotion) {
    return null
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="outline"
          className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div className="text-right space-y-1">
          <h1 className="text-3xl font-bold text-[#3D2817]">Editar promoción</h1>
          <p className="text-sm text-[#6B5D52]">
            Ajusta los valores y fechas de la campaña. Los cambios aplican al instante.
          </p>
        </div>
      </div>

      <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
        <CardContent className="space-y-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Nombre *</Label>
              <Input
                value={formState.name}
                onChange={handleInputChange("name")}
                className="border-[#D4C4B0]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Descripción</Label>
              <Textarea
                value={formState.description}
                onChange={handleInputChange("description")}
                rows={3}
                className="border-[#D4C4B0]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Código *</Label>
              <Input
                value={formState.code.toUpperCase()}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                className="border-[#D4C4B0] uppercase tracking-[0.35em]"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Tipo de descuento *</Label>
                <Select value={formState.discountType} onValueChange={(value: "percentage" | "fixed") => setFormState((prev) => ({ ...prev, discountType: value }))}>
                  <SelectTrigger className="border-[#D4C4B0]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Porcentaje (%)</SelectItem>
                    <SelectItem value="fixed">Monto fijo ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Valor *</Label>
                <Input
                  value={formState.discountValue}
                  onChange={handleInputChange("discountValue")}
                  type="number"
                  step="0.01"
                  min="0"
                  className="border-[#D4C4B0]"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Fecha de inicio *</Label>
                <Input
                  value={formState.startDate}
                  onChange={handleInputChange("startDate")}
                  type="datetime-local"
                  className="border-[#D4C4B0]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Fecha de fin *</Label>
                <Input
                  value={formState.endDate}
                  onChange={handleInputChange("endDate")}
                  type="datetime-local"
                  className="border-[#D4C4B0]"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Límite de usos</Label>
                <Input
                  value={formState.usageLimit}
                  onChange={handleInputChange("usageLimit")}
                  type="number"
                  min="0"
                  className="border-[#D4C4B0]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Compra mínima</Label>
                <Input
                  value={formState.minPurchaseAmount}
                  onChange={handleInputChange("minPurchaseAmount")}
                  type="number"
                  step="0.01"
                  min="0"
                  className="border-[#D4C4B0]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-[#3D2817]">Promoción activa</h3>
                <p className="text-xs text-[#6B5D52]">
                  Si está activa, el código se podrá aplicar durante la vigencia configurada.
                </p>
              </div>
              <Switch
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]"
                onClick={() => router.push("/admin/promotions")}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="bg-[#5C4033] text-white hover:bg-[#3D2817]">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar cambios
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

