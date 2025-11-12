import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { CalendarDays, PercentCircle } from "lucide-react"

export default async function PromotionsPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("promotions")
    .select("id, name, description, discount_type, discount_value, start_date, end_date, min_purchase_amount, code")
    .eq("is_active", true)
    .gte("end_date", new Date().toISOString())
    .order("start_date", { ascending: false })

  if (error) {
    throw new Error(`No se pudieron cargar las promociones: ${error.message}`)
  }

  const promotions = data ?? []

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-[#E7D9C5]/60 bg-[#F5F1ED]/60 py-14">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#F0E3D3_0%,transparent_55%)] opacity-70" />
        <div className="relative mx-auto flex max-w-4xl flex-col gap-4 px-4 text-center">
          <Badge className="mx-auto flex items-center gap-2 rounded-full bg-[#5C4033] px-4 py-1 text-xs uppercase tracking-[0.35em] text-white">
            <PercentCircle className="h-3 w-3" />
            Promociones
          </Badge>
          <h1 className="text-4xl font-bold text-[#3D2817] md:text-5xl">Ofertas preparadas para ti</h1>
          <p className="text-lg text-[#6B5D52]">
            Usa los códigos vigentes en el checkout y obtén descuentos especiales en tus compras de papelería favorita.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {promotions.length === 0 ? (
          <Card className="border-dashed border-[#D4C4B0] bg-gradient-to-br from-[#F5F1ED] to-white py-16 text-center shadow-lg">
            <CardContent className="space-y-4">
              <div className="mx-auto w-20 h-20 rounded-full bg-[#F5F1ED] flex items-center justify-center mb-4">
                <PercentCircle className="h-10 w-10 text-[#8B6F47]" />
              </div>
              <h2 className="text-3xl font-bold text-[#3D2817]">No hay promociones activas</h2>
              <p className="text-lg text-[#6B5D52] max-w-md mx-auto">
                Vuelve pronto para obtener descuentos exclusivos y ofertas especiales.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promotions.map((promo) => {
              const discountValue = promo.discount_type === "percentage"
                ? `${promo.discount_value}%`
                : `$${Number(promo.discount_value).toLocaleString("es-CO")}`
              
              return (
                <Card 
                  key={promo.id} 
                  className="group border-2 border-[#E1D5C8] bg-gradient-to-br from-white to-[#FBF8F4] backdrop-blur hover:border-[#5C4033] hover:shadow-2xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#5C4033]/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  <CardHeader className="space-y-3 relative z-10">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-xl font-bold text-[#3D2817] leading-tight flex-1">
                        {promo.name}
                      </CardTitle>
                      <Badge className="bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white font-mono text-xs px-3 py-1 shadow-md">
                        {promo.code}
                      </Badge>
                    </div>
                    <p className="text-sm text-[#6B5D52] leading-relaxed line-clamp-2">
                      {promo.description || "Aprovecha este descuento exclusivo en nuestra tienda online."}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 relative z-10">
                    <div className="rounded-2xl border-2 border-[#E1D5C8] bg-gradient-to-br from-[#F5F1ED] to-white px-5 py-4 text-center shadow-inner">
                      <div className="text-xs text-[#8B6F47] mb-1 uppercase tracking-wider">Descuento</div>
                      <div className="text-3xl font-bold text-[#5C4033] mb-2">
                        {discountValue}
                      </div>
                      {promo.min_purchase_amount && (
                        <div className="text-xs text-[#6B5D52] pt-2 border-t border-[#E1D5C8]">
                          Compra mínima: ${Number(promo.min_purchase_amount).toLocaleString("es-CO")}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-[#8B6F47]">
                        <CalendarDays className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1">
                          Vigente desde{" "}
                          {new Date(promo.start_date).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#8B6F47]">
                        <CalendarDays className="h-4 w-4 flex-shrink-0" />
                        <span className="flex-1">
                          Válido hasta{" "}
                          {new Date(promo.end_date).toLocaleDateString("es-CO", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#E1D5C8]">
                      <div className="text-center">
                        <p className="text-xs font-semibold text-[#5C4033] uppercase tracking-wider">
                          Usa el código en el checkout
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

