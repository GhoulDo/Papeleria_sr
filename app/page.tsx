"use client"

import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  MapPin,
  Mail,
  Phone,
  Instagram,
  Facebook,
  TrendingUp,
} from "lucide-react"
import Image from "next/image"

const productHighlights = [
  "Cuadernos y libretas",
  "Accesorios escolares",
  "Libros y cuentos",
  "Útiles escolares",
  "Materiales de oficina",
  "Materiales para arte",
  "Complementos de belleza",
  "Muchos artículos más",
]

export default function HomePage() {
  const { user, loading } = useAuth()

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#3D2817]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#E7D9C5]/60 bg-gradient-to-br from-[#F8F1EB] via-[#FFFFFF] to-[#F5E8D8]">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-[#EBDCC8]/60 blur-3xl" aria-hidden />
        <div className="absolute -right-32 -bottom-20 h-96 w-96 rounded-full bg-[#F5F1ED]/70 blur-3xl" aria-hidden />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 md:flex-row md:items-center">
          <div className="space-y-6 md:w-1/2">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#5C4033] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Papelería y Variedades S.R
            </span>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Todo para la escuela, oficina y tu emprendimiento en un solo lugar
            </h1>
            <p className="text-lg text-[#6B5D52] md:text-xl">
              Brindamos productos y servicios de papelería con atención personalizada, precios justos y soluciones
              oportunas que responden a las necesidades de estudiantes, profesionales y negocios locales.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-[#5C4033] text-white hover:bg-[#3D2817]">
                <Link href="/products">
                  Explorar catálogo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {!user && !loading && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-[#D4C4B0] bg-white/70 text-[#5C4033] hover:bg-[#F8F4ED]"
                >
                  <Link href="/auth/register">
                    Crear cuenta
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          <div className="relative mx-auto grid w-full max-w-md gap-4 md:w-1/2">
            <div className="rounded-3xl border border-[#E1D5C8] bg-white/90 p-6 shadow-lg backdrop-blur">
              <Image
                src="/logo.png"
                alt="Papelería y Variedades S.R"
                width={520}
                height={420}
                className="rounded-2xl object-contain"
                priority
              />
            </div>
            <div className="grid gap-3 rounded-3xl border border-[#E1D5C8] bg-[#F8F4ED] p-5 text-sm text-[#5C4033]">
              <p className="font-semibold uppercase tracking-[0.35em] text-[#8B6F47]">Visítanos</p>
              <p>
                Calle 19 40a 12 SMZ 3 MZ 9 <br />
                CS 15 Etapa II Barrio San Antonio, Villavicencio - Meta
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B5D52]">
                <span className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4 text-[#5C4033]" />
                  321 407 0292
                </span>
                <span className="inline-flex items-center gap-2">
                  <Mail className="h-4 w-4 text-[#5C4033]" />
                  papeleriyvariedadessr@gmail.com
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#6B5D52]">
                <Instagram className="h-4 w-4 text-[#C97D2E]" />
                @papeleria_variedadesr
                <Facebook className="ml-4 h-4 w-4 text-[#5C4033]" />
                papelería variedades Sr.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mx-auto max-w-6xl space-y-10 px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2">
          <CardInfo
            title="Misión"
            description="Brindar a nuestros clientes productos y servicios de papelería, oficina y miscelánea de excelente calidad, ofreciendo atención personalizada, precios justos y soluciones oportunas que satisfagan sus necesidades escolares, laborales y empresariales."
          />
          <CardInfo
            title="Visión"
            description="Para el año 2027 queremos posicionarnos como una papelería innovadora y sostenible, con una oferta integral que responda a las necesidades del mercado local y regional, fortaleciendo nuestro emprendimiento familiar."
          />
        </div>
      </section>

      {/* Product Categories */}
      <section className="border-y border-[#E7D9C5]/60 bg-[#F8F3EC]">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 md:grid-cols-[1.2fr_0.8fr] md:items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#5C4033] px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white">
              Nuestros productos
            </span>
            <h2 className="text-3xl font-bold text-[#3D2817]">Especialistas en surtir tu creatividad y oficina</h2>
            <p className="text-sm text-[#6B5D52]">
              Contamos con un catálogo amplio que cubre desde útiles escolares y material didáctico hasta insumos para
              oficina, manualidades y detalles especiales. Elige lo que necesitas y llévalo con la mejor asesoría.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {productHighlights.map((item) => (
                <div key={item} className="flex items-center gap-3 rounded-xl border border-[#E1D5C8] bg-white/85 p-3 text-sm">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F1ED] text-[#C97D2E]">
                    <BookOpen className="h-4 w-4" />
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative mx-auto h-80 w-full max-w-sm overflow-hidden rounded-[32px] border border-[#E1D5C8] bg-white/90 shadow-lg">
            <Image src="/placeholder-logo.png" alt="Papelería SR" fill className="object-cover" />
          </div>
        </div>
      </section>

      {/* Visit & Contact */}
      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-[#E1D5C8] bg-white/90 p-6 shadow-sm backdrop-blur">
            <h3 className="text-2xl font-semibold text-[#3D2817]">Visítanos en Villavicencio</h3>
            <p className="mt-3 text-sm text-[#6B5D52]">
              Calle 19 40a 12 SMZ 3 MZ 9, CS 15 Etapa II Barrio San Antonio, Villavicencio - Meta.
            </p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#6B5D52]">
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-[#C97D2E]" />
                Abierto de lunes a sábado
              </span>
              <span className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#5C4033]" />
                321 407 0292
              </span>
              <span className="inline-flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#5C4033]" />
                papeleriyvariedadessr@gmail.com
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-[#E1D5C8] bg-[#F8F4ED] p-6 shadow-sm">
            <h3 className="text-2xl font-semibold text-[#3D2817]">¿Listo para tu próxima compra?</h3>
            <p className="mt-3 text-sm text-[#6B5D52]">
              Regístrate para obtener descuentos especiales o navega por nuestro catálogo en línea. ¡Estamos listos para
              asesorarte y surtir tus proyectos!
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild className="bg-[#5C4033] text-white hover:bg-[#3D2817]">
                <Link href="/products">
                  Ver productos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              {!user && !loading && (
                <Button asChild variant="outline" className="border-[#D4C4B0] bg-white text-[#5C4033] hover:bg-[#F5F1ED]">
                  <Link href="/auth/register">
                    Crear cuenta gratis
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function CardInfo({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-3xl border border-[#E1D5C8] bg-white/85 p-8 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-[#C97D2E]" />
        <h3 className="text-xl font-semibold text-[#3D2817]">{title}</h3>
      </div>
      <p className="mt-4 text-sm text-[#6B5D52] leading-relaxed">{description}</p>
    </div>
  )
}
