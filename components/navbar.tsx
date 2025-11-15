"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, User, Menu } from "lucide-react"

export function Navbar() {
  const { user, loading, userRole } = useAuth()
  const router = useRouter()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Esperar un momento para que el estado se actualice
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Redirigir y refrescar
      router.push("/")
      router.refresh()
      setMobileMenuOpen(false)
    } catch (error) {
      console.error("Error al cerrar sesión:", error)
    }
  }

  return (
    <nav className="border-b border-[#D4C4B0] bg-[#F5F1ED]/95 backdrop-blur supports-[backdrop-filter]:bg-[#F5F1ED]/60 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Logo />

        {/* Menú Desktop */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm text-[#3D2817] hover:text-[#5C4033] transition font-medium">
            Productos
          </Link>
          <Link href="/categories" className="text-sm text-[#3D2817] hover:text-[#5C4033] transition font-medium">
            Categorías
          </Link>
          <Link href="/catalog" className="text-sm text-[#3D2817] hover:text-[#5C4033] transition font-medium">
            Catálogo
          </Link>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {loading ? (
            // Mostrar un placeholder mientras carga para evitar que desaparezca el navbar
            <div className="h-10 w-10 animate-pulse bg-[#D4C4B0] rounded-full" />
          ) : (
            <>
              {/* Carrito - Siempre visible */}
              {user && (
                <Button variant="ghost" size="icon" asChild className="hover:bg-[#D4C4B0]">
                  <Link href="/cart">
                    <ShoppingCart className="h-5 w-5 text-[#5C4033]" />
                  </Link>
                </Button>
              )}

              {/* Menú Desktop - Usuario autenticado */}
              {user && (
                <>
                  {userRole === "admin" && (
                    <Button variant="outline" asChild className="hidden md:inline-flex border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5F1ED]">
                      <Link href="/admin">Panel Admin</Link>
                    </Button>
                  )}
                  <Button variant="ghost" asChild className="hidden md:inline-flex text-[#5C4033] hover:bg-[#D4C4B0]">
                    <Link href="/profile">Mi Perfil</Link>
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:bg-[#D4C4B0]">
                        <User className="h-5 w-5 text-[#5C4033]" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-white border-[#D4C4B0]">
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard" className="text-[#3D2817]">
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      {userRole === "admin" && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="text-[#3D2817]">
                            Panel Admin
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="text-[#3D2817]">
                          Mi Perfil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={async (event) => {
                          event.preventDefault()
                          await handleLogout()
                        }}
                        className="text-[#3D2817]"
                      >
                        Cerrar Sesión
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {/* Menú Desktop - Usuario no autenticado */}
              {!user && !loading && (
                <>
                  <Button variant="ghost" asChild className="hidden md:inline-flex text-[#3D2817] hover:bg-[#D4C4B0]">
                    <Link href="/auth/login">Iniciar Sesión</Link>
                  </Button>
                  <Button asChild className="hidden md:inline-flex bg-[#5C4033] hover:bg-[#3D2817] text-white">
                    <Link href="/auth/register">Registrarse</Link>
                  </Button>
                </>
              )}

              {/* Menú Hamburguesa Móvil */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden hover:bg-[#D4C4B0]">
                    <Menu className="h-6 w-6 text-[#5C4033]" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] bg-[#F5F1ED] border-[#D4C4B0]">
                  <SheetHeader>
                    <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
                    <SheetDescription className="sr-only">Menú principal de navegación del sitio</SheetDescription>
                  </SheetHeader>
                  <div className="flex flex-col gap-6 mt-8">
                    {/* Enlaces de navegación */}
                    <div className="flex flex-col gap-4">
                      <Link
                        href="/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-base font-medium text-[#3D2817] hover:text-[#5C4033] transition py-2 border-b border-[#D4C4B0]"
                      >
                        Productos
                      </Link>
                      <Link
                        href="/categories"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-base font-medium text-[#3D2817] hover:text-[#5C4033] transition py-2 border-b border-[#D4C4B0]"
                      >
                        Categorías
                      </Link>
                      <Link
                        href="/catalog"
                        onClick={() => setMobileMenuOpen(false)}
                        className="text-base font-medium text-[#3D2817] hover:text-[#5C4033] transition py-2 border-b border-[#D4C4B0]"
                      >
                        Catálogo
                      </Link>
                    </div>

                    {/* Sección de usuario */}
                    {user ? (
                      <div className="flex flex-col gap-4 pt-4 border-t border-[#D4C4B0]">
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-base font-medium text-[#3D2817] hover:text-[#5C4033] transition py-2"
                        >
                          Dashboard
                        </Link>
                        {userRole === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="text-base font-medium text-[#3D2817] hover:text-[#5C4033] transition py-2"
                          >
                            Panel Admin
                          </Link>
                        )}
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-base font-medium text-[#3D2817] hover:text-[#5C4033] transition py-2"
                        >
                          Mi Perfil
                        </Link>
                        <Link
                          href="/cart"
                          onClick={() => setMobileMenuOpen(false)}
                          className="text-base font-medium text-[#3D2817] hover:text-[#5C4033] transition py-2"
                        >
                          Carrito
                        </Link>
                        <Button
                          onClick={async () => {
                            await handleLogout()
                            setMobileMenuOpen(false)
                          }}
                          variant="outline"
                          className="w-full border-[#D4C4B0] text-[#5C4033] hover:bg-[#D4C4B0] mt-4"
                        >
                          Cerrar Sesión
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 pt-4 border-t border-[#D4C4B0]">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full border-[#D4C4B0] text-[#3D2817] hover:bg-[#D4C4B0]"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href="/auth/login">Iniciar Sesión</Link>
                        </Button>
                        <Button
                          asChild
                          className="w-full bg-[#5C4033] hover:bg-[#3D2817] text-white"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Link href="/auth/register">Registrarse</Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
