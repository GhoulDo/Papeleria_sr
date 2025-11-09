import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/navbar"
import { ProductsGrid } from "@/components/products-grid"
import { createClient } from "@/lib/supabase/server"

interface CategoryPageProps {
  params: {
    slug: string
  }
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const supabase = await createClient()
  const { data: category, error } = await supabase
    .from("categories")
    .select("id, name, description, image_url")
    .eq("slug", params.slug)
    .eq("is_active", true)
    .single()

  if (error || !category) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
      <Navbar />

      <section className="border-b border-[#E7D9C5]/60 bg-[#F5F1ED]/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:py-14">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/">Inicio</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/categories">Categorías</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <span className="text-[#5C4033] font-medium">{category.name}</span>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr] lg:items-center">
            <div className="space-y-4">
              <Badge className="bg-[#5C4033] text-white rounded-full px-4 py-1 uppercase tracking-widest">
                {category.name}
              </Badge>
              <h1 className="text-4xl font-bold text-[#3D2817] leading-tight">{category.name}</h1>
              <p className="text-lg text-[#6B5D52] leading-relaxed">
                {category.description ||
                  "Explora nuestra selección de productos cuidadosamente curados para esta categoría y encuentra tu próxima inspiración creativa."}
              </p>
              <div className="rounded-2xl border border-[#D4C4B0] bg-white/80 p-4 text-sm text-[#8B6F47] shadow-sm">
                Actualizamos esta categoría con nuevos ítems cada temporada. Guarda tus favoritos y regresa para descubrir
                lanzamientos exclusivos.
              </div>
            </div>

            {category.image_url && (
              <div className="relative overflow-hidden rounded-[32px] border border-[#E1D5C8] bg-white/80 shadow-xl backdrop-blur-sm">
                <div className="relative h-full min-h-[260px] w-full">
                  <Image src={category.image_url} alt={category.name} fill className="object-cover" />
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <ProductsGrid
          defaultCategoryId={category.id}
          headline={{
            title: `Productos en ${category.name}`,
            description: "Puedes cambiar de categoría desde el listado o aplicar otros filtros de búsqueda.",
          }}
        />
      </section>
    </div>
  )
}

