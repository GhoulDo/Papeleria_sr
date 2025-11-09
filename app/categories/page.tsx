import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Layers } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/server"

export default async function CategoriesPage() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, description, image_url")
    .eq("is_active", true)
    .order("name", { ascending: true })

  if (error) {
    throw new Error(`No se pudieron cargar las categorías: ${error.message}`)
  }

  const categories = data ?? []

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F1ED] via-[#FBF8F4] to-white">
      <Navbar />

      <section className="relative overflow-hidden border-b border-[#E7D9C5]/60 bg-[#F8F3EC]/80 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#F0E3D3_0%,transparent_55%)] opacity-60" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 text-center">
          <Badge className="mx-auto flex items-center gap-2 rounded-full bg-[#5C4033] px-4 py-1 text-xs uppercase tracking-[0.3em] text-white">
            <Layers className="h-3 w-3" />
            Categorías
          </Badge>
          <h1 className="text-4xl font-bold leading-tight text-[#3D2817] md:text-5xl">
            Organiza tus compras por categoría
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[#6B5D52]">
            Explora las familias de productos de Papelería y Variedades S.R para encontrar exactamente lo que necesitas
            según tus proyectos, oficina o estudios.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        {categories.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[#D4C4B0] bg-[#F5F1ED]/60 px-6 py-16 text-center">
            <h2 className="text-2xl font-semibold text-[#3D2817]">Aún no hay categorías activas</h2>
            <p className="mt-2 text-[#8B6F47]">
              Vuelve pronto para descubrir nuevas colecciones y familias de productos destacadas.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="group relative overflow-hidden rounded-3xl border border-[#E1D5C8] bg-white/90 p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#C9A57A] hover:shadow-xl"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#F5F1ED] via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                <div className="relative space-y-5">
                  <div className="relative h-40 overflow-hidden rounded-2xl border border-[#E8DFD5] bg-[#FAF6F1]">
                    {category.image_url ? (
                      <Image
                        src={category.image_url}
                        alt={category.name}
                        fill
                        className="object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-sm text-[#8B6F47]">
                        <span className="font-semibold uppercase tracking-widest">Papelería SR</span>
                        <span className="text-xs text-[#6B5D52]">Imagen próximamente</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="text-xl font-semibold text-[#3D2817] line-clamp-1">{category.name}</h2>
                      <ChevronRight className="h-5 w-5 text-[#8B6F47] transition group-hover:translate-x-1" />
                    </div>
                    <p className="text-sm text-[#6B5D52] line-clamp-3">
                      {category.description || "Descubre artículos especializados seleccionados para esta categoría."}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

