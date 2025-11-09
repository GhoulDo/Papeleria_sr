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

      <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        {promotions.length === 0 ? (
          <Card className="border-dashed border-[#D4C4B0] bg-[#F5F1ED]/70 py-12 text-center">
            <CardContent className="space-y-3">
              <PercentCircle className="mx-auto h-10 w-10 text-[#8B6F47]" />
              <h2 className="text-2xl font-semibold text-[#3D2817]">No hay promociones activas</h2>
              <p className="text-sm text-[#6B5D52]">Vuelve pronto para obtener descuentos exclusivos.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {promotions.map((promo) => (
              <Card key={promo.id} className="border-[#E1D5C8] bg-white/90 backdrop-blur">
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-2xl font-semibold text-[#3D2817]">{promo.name}</CardTitle>
                    <Badge className="bg-[#5C4033] text-white font-mono text-xs">Código: {promo.code}</Badge>
                  </div>
                  <p className="text-sm text-[#6B5D52]">
                    {promo.description || "Aprovecha este descuento exclusivo en nuestra tienda online."}
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl border border-[#E1D5C8] bg-[#F5F1ED]/60 px-4 py-3 text-sm text-[#5C4033]">
                    Descuento de{" "}
                    <span className="font-semibold">
                      {promo.discount_type === "percentage"
                        ? `${promo.discount_value}%`
                        : `$${Number(promo.discount_value).toFixed(2)}`}
                    </span>{" "}
                    {promo.min_purchase_amount
                      ? `en compras desde $${Number(promo.min_purchase_amount).toFixed(2)}`
                      : "en cualquier compra"}{" "}
                    hasta el{" "}
                    {new Date(promo.end_date).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                    .
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#8B6F47]">
                    <CalendarDays className="h-4 w-4" />
                    Vigente desde{" "}
                    {new Date(promo.start_date).toLocaleDateString("es-CO", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

