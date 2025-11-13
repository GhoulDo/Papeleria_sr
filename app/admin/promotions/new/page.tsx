"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft, Calendar, Percent, ShoppingCart, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { PromotionAssistant } from "@/components/promotion-assistant"

export default function NewPromotionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    code: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
    minPurchaseAmount: "",
    isActive: true,
  })

  const supabase = createClient()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleDiscountTypeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      discountType: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.code || !formData.discountValue || !formData.startDate || !formData.endDate) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const { error } = await supabase.from("promotions").insert({
        name: formData.name,
        description: formData.description,
        discount_type: formData.discountType,
        discount_value: Number.parseFloat(formData.discountValue),
        code: formData.code.trim().toUpperCase(),
        start_date: new Date(formData.startDate).toISOString(),
        end_date: new Date(formData.endDate).toISOString(),
        usage_limit: formData.usageLimit ? Number.parseInt(formData.usageLimit) : null,
        min_purchase_amount: formData.minPurchaseAmount ? Number.parseFloat(formData.minPurchaseAmount) : null,
        is_active: formData.isActive,
      })

      if (error) throw error

      toast({
        title: "Promoción creada",
        description: "La promoción ha sido agregada correctamente",
      })

      router.push("/admin/promotions")
    } catch (error) {
      console.error("Error creating promotion:", error)
      toast({
        title: "Error",
        description: "No se pudo crear la promoción",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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
          <h1 className="text-3xl font-bold text-[#3D2817]">Nueva promoción</h1>
          <p className="text-sm text-[#6B5D52]">
            Define los parámetros de tu campaña: código, vigencia, descuentos y límites de uso.
          </p>
        </div>
        </div>

      <Card className="border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] shadow-xl">
        <CardContent className="space-y-6 pt-6">
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-[#F5F1ED] to-[#FBF8F4] border border-[#E1D5C8]">
            <h2 className="text-lg font-semibold text-[#3D2817] mb-2">📝 Información de la Promoción</h2>
            <p className="text-sm text-[#6B5D52]">Completa los campos requeridos para crear tu promoción</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#3D2817] flex items-center gap-2">
                <span>Nombre *</span>
                <span className="text-xs font-normal text-[#8B6F47]">(Visible para clientes)</span>
              </Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 h-11"
                placeholder="Ej: Semana del Cuaderno, Promo Navidad"
                required
              />
              </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#3D2817]">Descripción</Label>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 resize-none"
                placeholder="Cuéntale a los clientes en qué consiste la promoción y a qué productos aplica..."
                />
              <p className="text-xs text-[#8B6F47]">Esta descripción aparecerá en la página pública de promociones</p>
              </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-[#3D2817] flex items-center gap-2">
                <span>Código de Promoción *</span>
                <Badge className="bg-[#5C4033]/10 text-[#5C4033] text-xs">Único</Badge>
              </Label>
              <div className="relative">
                <Input
                  name="code"
                  value={formData.code.toUpperCase()}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 uppercase tracking-[0.35em] font-mono h-11 text-center text-lg"
                  placeholder="PROMO20"
                  maxLength={20}
                  required
                />
              </div>
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
                  <Select value={formData.discountType} onValueChange={handleDiscountTypeChange}>
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
                    {formData.discountType === "percentage" ? (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5D52]">%</span>
                    ) : (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5D52]">$</span>
                    )}
                  <Input
                    name="discountValue"
                    type="number"
                    step="0.01"
                      min="0"
                    value={formData.discountValue}
                    onChange={handleInputChange}
                      className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 pl-8 h-11"
                      placeholder={formData.discountType === "percentage" ? "15" : "20000"}
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
                    name="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 h-11"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#3D2817]">Fecha de fin *</Label>
                  <Input
                    name="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={handleInputChange}
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
                    name="usageLimit"
                    type="number"
                    min="0"
                    value={formData.usageLimit}
                    onChange={handleInputChange}
                    className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 h-11"
                    placeholder="Ej. 100"
                  />
                  <p className="text-xs text-[#8B6F47]">Déjalo vacío para uso ilimitado</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#3D2817]">Compra mínima</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5D52]">$</span>
                  <Input
                    name="minPurchaseAmount"
                    type="number"
                    step="0.01"
                      min="0"
                    value={formData.minPurchaseAmount}
                    onChange={handleInputChange}
                      className="border-2 border-[#D4C4B0] bg-white/80 focus:border-[#5C4033] focus:ring-2 focus:ring-[#5C4033]/20 pl-8 h-11"
                      placeholder="Ej. 50000"
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
                  <Badge className={formData.isActive ? "bg-green-500 text-white" : "bg-gray-400 text-white"}>
                    {formData.isActive ? "Activa" : "Inactiva"}
                  </Badge>
                </h3>
                <p className="text-xs text-[#6B5D52]">
                  {formData.isActive 
                    ? "El código estará disponible para los clientes en el checkout dentro del rango de fechas."
                    : "El código no estará disponible hasta que lo actives."}
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
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
                    <span>Crear promoción</span>
                    <CheckCircle2 className="ml-2 h-4 w-4" />
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
