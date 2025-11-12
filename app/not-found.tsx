import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F7F1EB] via-[#FBF8F4] to-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="space-y-6">
          <div className="text-8xl mb-6">🔍</div>
          <h1 className="text-5xl md:text-6xl font-bold text-[#3D2817] mb-4">
            404
          </h1>
          <h2 className="text-2xl md:text-3xl font-semibold text-[#5C4033] mb-4">
            Página no encontrada
          </h2>
          <p className="text-lg text-[#6B5D52] max-w-2xl mx-auto mb-8">
            Lo sentimos, la página que estás buscando no existe o ha sido movida. 
            Puedes volver al inicio o explorar nuestros productos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg"
              className="bg-[#5C4033] hover:bg-[#3D2817] text-white px-8"
            >
              <Link href="/">Ir al Inicio</Link>
            </Button>
            <Button 
              asChild 
              size="lg"
              variant="outline"
              className="border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5F1ED] px-8"
            >
              <Link href="/products">Ver Productos</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

