"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { ProductsGrid } from "@/components/products-grid"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export default function ProductsPage() {
  const [activeImage, setActiveImage] = useState(0)
  const galleryImages = [
    { src: "/papeleria.png", alt: "Estantería completa de resaltadores, marcadores y artículos de papelería" },
    { src: "/papeleria2.png", alt: "Libretas y cuadernos organizados por colores" },
    { src: "/papeleria3.png", alt: "Materiales de oficina exhibidos en mostrador" },
    { src: "/papeleria4.png", alt: "Accesorios escolares y empaques creativos" },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % galleryImages.length)
    }, 4000)

    return () => clearInterval(interval)
  }, [galleryImages.length])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-[#FFFFFF]">
      <Navbar />

      <section className="relative overflow-hidden border-b border-[#E7D9C5]/70 bg-[#F5F1ED]/70 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#EBDCC8_0%,transparent_55%)] opacity-70" />
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid gap-10 md:grid-cols-[1.35fr_1fr] items-center">
            <div className="space-y-6">
              <Badge className="bg-[#5C4033] text-white inline-flex items-center gap-1 rounded-full px-4 py-1 text-xs uppercase tracking-widest">
                <Sparkles className="h-3 w-3" />
                Nueva colección 2025
              </Badge>
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-[#3D2817] leading-tight">
                  Catálogo de productos
                  <span className="block text-[#8B6F47]">para cada idea y proyecto</span>
                </h1>
                <p className="text-[#6B5D52] text-lg leading-relaxed max-w-2xl">
                  Organiza tu espacio creativo con artículos seleccionados cuidadosamente para la escuela, oficina y
                  emprendimientos. Descubre novedades, promos exclusivas y materiales premium sin salir de casa.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#D4C4B0] bg-white/80 p-4 flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F1ED] text-[#5C4033] font-semibold">
                    01
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#3D2817]">Papelería esencial</h3>
                    <p className="text-sm text-[#8B6F47]">Cuadernos, blocs, planners y agendas personalizadas.</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-[#D4C4B0] bg-white/80 p-4 flex gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F1ED] text-[#5C4033] font-semibold">
                    02
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#3D2817]">Para tu oficina</h3>
                    <p className="text-sm text-[#8B6F47]">Organización inteligente, suministros premium y más.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button asChild className="bg-[#5C4033] hover:bg-[#3D2817] text-white">
                  <Link href="/categories">
                    Explorar categorías
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-[#D4C4B0] bg-white/60 text-[#5C4033] hover:bg-[#F5F1ED]">
                  <Link href="/promotions">
                    Ver promociones
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative mx-auto flex h-full w-full max-w-sm flex-col items-center justify-center gap-4">
              <div className="absolute inset-0 rounded-full bg-[#E8DFD5] blur-3xl opacity-60" aria-hidden />
              <div className="relative h-96 w-full overflow-hidden rounded-[32px] border border-[#D4C4B0]/80 bg-white/80 shadow-xl backdrop-blur-md">
                {galleryImages.map((image, index) => (
                  <Image
                    key={image.src}
                    src={image.src}
                    alt={image.alt}
                    fill
                    priority={index === activeImage}
                    className={cn(
                      "absolute inset-0 object-cover transition-opacity duration-700 ease-in-out",
                      index === activeImage ? "opacity-100" : "opacity-0",
                    )}
                  />
                ))}
                <div className="absolute inset-x-6 bottom-6 space-y-3 rounded-2xl border border-[#E1D5C8] bg-white/90 p-4 text-sm text-[#5C4033] shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Más de 1200 productos</span>
                    <Badge className="bg-[#5C4033] text-white">Actualizado</Badge>
                  </div>
                  <p className="text-xs text-[#8B6F47]">
                    Cada semana agregamos colecciones temáticas, sets creativos y combos especiales para oficinas
                    dinámicas.
                  </p>
                </div>
              </div>
              <div className="relative z-10 flex items-center gap-2">
                {galleryImages.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImage(index)}
                    className={cn(
                      "h-2 w-6 rounded-full transition-all duration-300",
                      index === activeImage ? "bg-[#5C4033]" : "bg-[#D4C4B0]",
                    )}
                    aria-label={`Mostrar imagen ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <ProductsGrid
          headline={{
            title: "Explora y compara",
            description: "Filtra por categoría, ordena según tus prioridades y encuentra justo el material que necesitas.",
          }}
        />
      </div>
    </div>
  )
}
