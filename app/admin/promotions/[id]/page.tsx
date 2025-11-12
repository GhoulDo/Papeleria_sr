"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Save, Calendar, Percent, ShoppingCart } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PromotionAssistant } from "@/components/promotion-assistant"

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
    <>
      <PromotionAssistant />
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

      <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-xl">
        <CardContent className="space-y-6 pt-6">
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#F5F1ED] to-[#FBF8F4] border border-[#E1D5C8]">
            <h2 className="text-lg font-semibold text-[#3D2817] mb-2">✏️ Editar Promoción</h2>
            <p className="text-sm text-[#6B5D52]">Modifica los campos que necesites y guarda los cambios</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#3D2817] flex items-center gap-2">
                <span>Nombre *</span>
                <span className="text-xs font-normal text-[#8B6F47]">(Visible para clientes)</span>
              </Label>
              <Input
                value={formState.name}
                onChange={handleInputChange("name")}
                className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 h-11"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#3D2817]">Descripción</Label>
              <Textarea
                value={formState.description}
                onChange={handleInputChange("description")}
                rows={3}
                className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 resize-none"
              />
              <p className="text-xs text-[#8B6F47]">Esta descripción aparecerá en la página pública de promociones</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#3D2817] flex items-center gap-2">
                <span>Código de Promoción *</span>
                <Badge className="bg-[#5C4033]/10 text-[#5C4033] text-xs">Único</Badge>
              </Label>
              <Input
                value={formState.code.toUpperCase()}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 uppercase tracking-[0.35em] font-mono h-11 text-center text-lg"
                maxLength={20}
                required
              />
              <p className="text-xs text-[#8B6F47] flex items-center gap-1">
                <span>💡</span>
                <span>Este código lo usarán los clientes en el checkout. Debe ser único y fácil de recordar.</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F5F1ED] to-white border-2 border-[#E1D5C8] space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-5 w-5 text-[#5C4033]" />
                <Label className="text-base font-semibold text-[#3D2817]">Descuento</Label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#3D2817]">Tipo *</Label>
                  <Select value={formState.discountType} onValueChange={(value: "percentage" | "fixed") => setFormState((prev) => ({ ...prev, discountType: value }))}>
                    <SelectTrigger className="border-2 border-[#D4C4B0] bg-white focus:border-[#5C4033] h-11">
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
                  <div className="relative">
                    {formState.discountType === "percentage" ? (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5D52]">%</span>
                    ) : (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5D52]">$</span>
                    )}
                    <Input
                      value={formState.discountValue}
                      onChange={handleInputChange("discountValue")}
                      type="number"
                      step="0.01"
                      min="0"
                      className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 pl-8 h-11"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F5F1ED] to-white border-2 border-[#E1D5C8] space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-[#5C4033]" />
                <Label className="text-base font-semibold text-[#3D2817]">Vigencia</Label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#3D2817]">Fecha de inicio *</Label>
                  <Input
                    value={formState.startDate}
                    onChange={handleInputChange("startDate")}
                    type="datetime-local"
                    className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#3D2817]">Fecha de fin *</Label>
                  <Input
                    value={formState.endDate}
                    onChange={handleInputChange("endDate")}
                    type="datetime-local"
                    className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 h-11"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#F5F1ED] to-white border-2 border-[#E1D5C8] space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-5 w-5 text-[#5C4033]" />
                <Label className="text-base font-semibold text-[#3D2817]">Restricciones (Opcional)</Label>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#3D2817]">Límite de usos</Label>
                  <Input
                    value={formState.usageLimit}
                    onChange={handleInputChange("usageLimit")}
                    type="number"
                    min="0"
                    className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 h-11"
                  />
                  <p className="text-xs text-[#8B6F47]">Déjalo vacío para uso ilimitado</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#3D2817]">Compra mínima</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5D52]">$</span>
                    <Input
                      value={formState.minPurchaseAmount}
                      onChange={handleInputChange("minPurchaseAmount")}
                      type="number"
                      step="0.01"
                      min="0"
                      className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 pl-8 h-11"
                    />
                  </div>
                  <p className="text-xs text-[#8B6F47]">Monto mínimo para aplicar el descuento</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border-2 border-[#E1D5C8] bg-gradient-to-r from-[#F5F1ED] to-white px-5 py-4 shadow-sm">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#3D2817] mb-1 flex items-center gap-2">
                  <span>Estado de la Promoción</span>
                  <Badge className={formState.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}>
                    {formState.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </h3>
                <p className="text-xs text-[#6B5D52]">
                  {formState.isActive 
                    ? "El código estará disponible para los clientes en el checkout dentro del rango de fechas."
                    : "El código no estará disponible hasta que lo actives."}
                </p>
              </div>
              <Switch
                checked={formState.isActive}
                onCheckedChange={(checked) => setFormState((prev) => ({ ...prev, isActive: checked }))}
                className="ml-4"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t-2 border-[#E1D5C8]">
              <Button
                type="button"
                variant="outline"
                className="border-2 border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED] px-6 h-11"
                onClick={() => router.push("/admin/promotions")}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={saving} 
                className="bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10] px-8 h-11 shadow-lg hover:shadow-xl transition-all"
              >
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
    </>
  )
}

