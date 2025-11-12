"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bot, 
  X, 
  ChevronRight, 
  Lightbulb, 
  CheckCircle2,
  Percent,
  Calendar,
  Hash,
  DollarSign,
  Users,
  ShoppingCart,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Step {
  icon: React.ReactNode
  title: string
  description: string
  tips?: string[]
}

const steps: Step[] = [
  {
    icon: <Hash className="h-5 w-5" />,
    title: "1. Nombre y Código",
    description: "Elige un nombre descriptivo y un código único en mayúsculas que los clientes puedan recordar fácilmente.",
    tips: [
      "Usa nombres claros como 'Descuento de Verano' o 'Promo Navidad'",
      "Los códigos deben ser cortos (6-10 caracteres) y fáciles de escribir",
      "Evita caracteres especiales o espacios en el código"
    ]
  },
  {
    icon: <Percent className="h-5 w-5" />,
    title: "2. Tipo de Descuento",
    description: "Selecciona si el descuento será un porcentaje (%) o un monto fijo ($).",
    tips: [
      "Porcentaje: Ideal para descuentos generales (ej: 15% de descuento)",
      "Monto fijo: Perfecto para descuentos específicos (ej: $10.000 de descuento)",
      "Considera el margen de ganancia al definir el valor"
    ]
  },
  {
    icon: <Calendar className="h-5 w-5" />,
    title: "3. Fechas de Vigencia",
    description: "Define cuándo inicia y termina la promoción. Asegúrate de que la fecha de fin sea posterior a la de inicio.",
    tips: [
      "Las promociones solo funcionan dentro del rango de fechas",
      "Puedes crear promociones futuras programándolas con anticipación",
      "Revisa que las fechas no se solapen con otras promociones activas"
    ]
  },
  {
    icon: <ShoppingCart className="h-5 w-5" />,
    title: "4. Compra Mínima (Opcional)",
    description: "Si quieres que la promoción solo aplique a compras mayores a cierto monto, define el valor mínimo.",
    tips: [
      "Útil para incentivar compras más grandes",
      "Déjalo vacío si quieres que aplique a cualquier compra",
      "Ejemplo: $50.000 mínimo para obtener el descuento"
    ]
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "5. Límite de Usos (Opcional)",
    description: "Controla cuántas veces puede usarse el código. Déjalo vacío para uso ilimitado.",
    tips: [
      "Útil para promociones exclusivas o de lanzamiento",
      "El sistema cuenta automáticamente cada uso",
      "Ejemplo: Solo 100 clientes pueden usar este código"
    ]
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "6. Activar Promoción",
    description: "Activa la promoción para que esté disponible inmediatamente o déjala inactiva para activarla después.",
    tips: [
      "Puedes crear promociones inactivas y activarlas cuando quieras",
      "Las promociones inactivas no aparecen en la página pública",
      "Puedes pausar promociones activas en cualquier momento"
    ]
  }
]

export function PromotionAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [isMinimized, setIsMinimized] = useState(false)

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-16 w-16 rounded-full bg-gradient-to-br from-[#5C4033] to-[#3D2817] text-white shadow-2xl hover:scale-110 transition-all duration-300 hover:shadow-[#5C4033]/50"
        size="icon"
      >
        <Bot className="h-7 w-7 animate-pulse" />
        <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold animate-bounce">
          !
        </span>
      </Button>
    )
  }

  return (
    <Card className={cn(
      "fixed bottom-6 right-6 z-50 w-[90vw] max-w-md border-2 border-[#5C4033] bg-gradient-to-br from-white to-[#FBF8F4] shadow-2xl transition-all duration-300",
      isMinimized ? "h-auto" : "h-[600px]"
    )}>
      <CardHeader className="bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white rounded-t-lg pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bot className="h-6 w-6 animate-bounce" />
              <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-lg">Asistente de Promociones</CardTitle>
              <p className="text-xs text-white/80">Te guío paso a paso</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? "↑" : "↓"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {!isMinimized && (
        <CardContent className="p-4 space-y-4 overflow-y-auto max-h-[500px]">
          {/* Progress Indicator */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-2 flex-1 rounded-full transition-all",
                      index <= currentStep 
                        ? "bg-[#5C4033]" 
                        : "bg-[#E1D5C8]"
                    )}
                  />
                ))}
              </div>
              <p className="text-xs text-[#6B5D52] mt-2 text-center">
                Paso {currentStep + 1} de {steps.length}
              </p>
            </div>
          </div>

          {/* Current Step */}
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-br from-[#F5F1ED] to-white border border-[#E1D5C8]">
              <div className="p-2 rounded-full bg-[#5C4033] text-white">
                {steps[currentStep].icon}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-semibold text-[#3D2817]">{steps[currentStep].title}</h3>
                <p className="text-sm text-[#6B5D52] leading-relaxed">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>

            {/* Tips */}
            {steps[currentStep].tips && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-[#5C4033]">
                  <Lightbulb className="h-4 w-4" />
                  <span>Consejos útiles:</span>
                </div>
                <div className="space-y-2">
                  {steps[currentStep].tips!.map((tip, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-3 rounded-xl bg-[#FBF8F4] border border-[#E1D5C8]"
                    >
                      <CheckCircle2 className="h-4 w-4 text-[#5C4033] mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-[#6B5D52] leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-4 border-t border-[#E1D5C8]">
            <Button
              variant="outline"
              className="flex-1 border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5F1ED]"
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Anterior
            </Button>
            <Button
              className="flex-1 bg-[#5C4033] text-white hover:bg-[#3D2817]"
              onClick={() => {
                if (currentStep < steps.length - 1) {
                  setCurrentStep(currentStep + 1)
                } else {
                  setIsOpen(false)
                }
              }}
            >
              {currentStep < steps.length - 1 ? (
                <>
                  Siguiente
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "¡Entendido!"
              )}
            </Button>
          </div>

          {/* Quick Help */}
          <div className="pt-4 border-t border-[#E1D5C8]">
            <Badge className="w-full justify-center bg-[#F5F1ED] text-[#5C4033] border-[#D4C4B0] py-2">
              💡 Tip: Puedes volver a este asistente en cualquier momento
            </Badge>
          </div>
        </CardContent>
      )}
    </Card>
  )
}

