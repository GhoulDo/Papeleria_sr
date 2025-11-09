"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

      <Card className="border-[#E1D5C8] bg-white/90 backdrop-blur">
        <CardContent className="space-y-6 pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Nombre *</Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="border-[#D4C4B0]"
                placeholder="Semana del Cuaderno"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Descripción</Label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="border-[#D4C4B0]"
                placeholder="Cuéntale al equipo comercial en qué consiste la promoción y a qué productos aplica."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#3D2817]">Código *</Label>
              <Input
                name="code"
                value={formData.code.toUpperCase()}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                className="border-[#D4C4B0] uppercase tracking-[0.35em]"
                placeholder="PROMO20"
                required
              />
              <p className="text-xs text-[#8B6F47]">Se mostrará tal cual al cliente. Se recomienda escribirlo en mayúsculas.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Tipo de descuento *</Label>
                <Select value={formData.discountType} onValueChange={handleDiscountTypeChange}>
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
                  name="discountValue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountValue}
                  onChange={handleInputChange}
                  className="border-[#D4C4B0]"
                  placeholder={formData.discountType === "percentage" ? "15" : "20000"}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Fecha de inicio *</Label>
                <Input
                  name="startDate"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="border-[#D4C4B0]"
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
                  className="border-[#D4C4B0]"
                  required
                />
              </div>
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
                  className="border-[#D4C4B0]"
                  placeholder="Ej. 100"
                />
                <p className="text-xs text-[#8B6F47]">Déjalo vacío si el código puede usarse ilimitadas veces.</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-[#3D2817]">Compra mínima</Label>
                <Input
                  name="minPurchaseAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minPurchaseAmount}
                  onChange={handleInputChange}
                  className="border-[#D4C4B0]"
                  placeholder="Ej. 50000"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-[#3D2817]">Promoción activa</h3>
                <p className="text-xs text-[#6B5D52]">
                  Si está activa, el código podrá aplicarse desde el checkout dentro del rango de fechas.
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
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
                  "Crear promoción"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
