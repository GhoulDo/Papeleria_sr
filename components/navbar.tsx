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
import { ShoppingCart, User, Menu, X, Package, FolderTree, BookOpen, LayoutDashboard, Settings, LogOut, LogIn, UserPlus } from "lucide-react"

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

              {/* Menú Hamburguesa Móvil - Mejorado */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden hover:bg-[#D4C4B0] transition-all duration-200 relative touch-manipulation"
                    aria-label="Abrir menú"
                    style={{
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <Menu 
                      className={`h-6 w-6 text-[#5C4033] absolute inset-0 m-auto transition-all duration-200 ease-out ${
                        mobileMenuOpen 
                          ? 'rotate-90 scale-0 opacity-0' 
                          : 'rotate-0 scale-100 opacity-100'
                      }`}
                      style={{
                        willChange: 'transform, opacity',
                      }}
                    />
                    <X 
                      className={`h-6 w-6 text-[#5C4033] absolute inset-0 m-auto transition-all duration-200 ease-out ${
                        mobileMenuOpen 
                          ? 'rotate-0 scale-100 opacity-100' 
                          : '-rotate-90 scale-0 opacity-0'
                      }`}
                      style={{
                        willChange: 'transform, opacity',
                      }}
                    />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent 
                  side="right" 
                  className="w-[320px] sm:w-[380px] bg-gradient-to-b from-[#F5F1ED] to-white border-l-2 border-[#D4C4B0] shadow-2xl overflow-y-auto"
                >
                  <SheetHeader className="pb-6 border-b border-[#D4C4B0]/50">
                    <SheetTitle className="text-2xl font-bold text-[#3D2817] flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#5C4033] to-[#8B6F47] flex items-center justify-center">
                        <Menu className="h-5 w-5 text-white" />
                      </div>
                      Menú
                    </SheetTitle>
                    <SheetDescription className="sr-only">Menú principal de navegación del sitio</SheetDescription>
                  </SheetHeader>
                  
                  <div className="flex flex-col gap-6 mt-8">
                    {/* Enlaces de navegación principal */}
                    <div className="flex flex-col gap-2">
                      <h3 className="text-xs font-semibold text-[#8B6F47] uppercase tracking-wider px-2 mb-2">
                        Navegación
                      </h3>
                      <Link
                        href="/products"
                        onClick={() => setMobileMenuOpen(false)}
                        className="group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#3D2817] hover:text-[#5C4033] hover:bg-gradient-to-r hover:from-[#F5F1ED] hover:to-white transition-all duration-150 ease-out active:scale-[0.97] border border-transparent hover:border-[#D4C4B0]/50 touch-manipulation"
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          willChange: 'transform',
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5C4033]/10 to-[#8B6F47]/10 flex items-center justify-center group-hover:from-[#5C4033]/20 group-hover:to-[#8B6F47]/20 transition-all duration-150 ease-out">
                          <Package className="h-5 w-5 text-[#5C4033] group-hover:scale-110 transition-transform duration-150 ease-out" style={{ willChange: 'transform' }} />
                        </div>
                        <span>Productos</span>
                      </Link>
                      <Link
                        href="/categories"
                        onClick={() => setMobileMenuOpen(false)}
                        className="group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#3D2817] hover:text-[#5C4033] hover:bg-gradient-to-r hover:from-[#F5F1ED] hover:to-white transition-all duration-150 ease-out active:scale-[0.97] border border-transparent hover:border-[#D4C4B0]/50 touch-manipulation"
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          willChange: 'transform',
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5C4033]/10 to-[#8B6F47]/10 flex items-center justify-center group-hover:from-[#5C4033]/20 group-hover:to-[#8B6F47]/20 transition-all duration-150 ease-out">
                          <FolderTree className="h-5 w-5 text-[#5C4033] group-hover:scale-110 transition-transform duration-150 ease-out" style={{ willChange: 'transform' }} />
                        </div>
                        <span>Categorías</span>
                      </Link>
                      <Link
                        href="/catalog"
                        onClick={() => setMobileMenuOpen(false)}
                        className="group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#3D2817] hover:text-[#5C4033] hover:bg-gradient-to-r hover:from-[#F5F1ED] hover:to-white transition-all duration-150 ease-out active:scale-[0.97] border border-transparent hover:border-[#D4C4B0]/50 touch-manipulation"
                        style={{
                          WebkitTapHighlightColor: 'transparent',
                          willChange: 'transform',
                        }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5C4033]/10 to-[#8B6F47]/10 flex items-center justify-center group-hover:from-[#5C4033]/20 group-hover:to-[#8B6F47]/20 transition-all duration-150 ease-out">
                          <BookOpen className="h-5 w-5 text-[#5C4033] group-hover:scale-110 transition-transform duration-150 ease-out" style={{ willChange: 'transform' }} />
                        </div>
                        <span>Catálogo</span>
                      </Link>
                    </div>

                    {/* Sección de usuario */}
                    {user ? (
                      <div className="flex flex-col gap-2 pt-4 border-t border-[#D4C4B0]/50">
                        <h3 className="text-xs font-semibold text-[#8B6F47] uppercase tracking-wider px-2 mb-2">
                          Mi Cuenta
                        </h3>
                        <Link
                          href="/dashboard"
                          onClick={() => setMobileMenuOpen(false)}
                          className="group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#3D2817] hover:text-[#5C4033] hover:bg-gradient-to-r hover:from-[#F5F1ED] hover:to-white transition-all duration-150 ease-out active:scale-[0.97] border border-transparent hover:border-[#D4C4B0]/50 touch-manipulation"
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            willChange: 'transform',
                          }}
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5C4033]/10 to-[#8B6F47]/10 flex items-center justify-center group-hover:from-[#5C4033]/20 group-hover:to-[#8B6F47]/20 transition-all duration-150 ease-out">
                            <LayoutDashboard className="h-5 w-5 text-[#5C4033] group-hover:scale-110 transition-transform duration-150 ease-out" style={{ willChange: 'transform' }} />
                          </div>
                          <span>Dashboard</span>
                        </Link>
                        {userRole === "admin" && (
                          <Link
                            href="/admin"
                            onClick={() => setMobileMenuOpen(false)}
                            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#3D2817] hover:text-[#5C4033] hover:bg-gradient-to-r hover:from-[#F5F1ED] hover:to-white transition-all duration-150 ease-out active:scale-[0.97] border border-transparent hover:border-[#D4C4B0]/50 touch-manipulation"
                            style={{
                              WebkitTapHighlightColor: 'transparent',
                              willChange: 'transform',
                            }}
                          >
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#C97D2E]/10 to-[#8B6F47]/10 flex items-center justify-center group-hover:from-[#C97D2E]/20 group-hover:to-[#8B6F47]/20 transition-all duration-150 ease-out">
                              <Settings className="h-5 w-5 text-[#C97D2E] group-hover:scale-110 transition-transform duration-150 ease-out" style={{ willChange: 'transform' }} />
                            </div>
                            <span>Panel Admin</span>
                          </Link>
                        )}
                        <Link
                          href="/profile"
                          onClick={() => setMobileMenuOpen(false)}
                          className="group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#3D2817] hover:text-[#5C4033] hover:bg-gradient-to-r hover:from-[#F5F1ED] hover:to-white transition-all duration-150 ease-out active:scale-[0.97] border border-transparent hover:border-[#D4C4B0]/50 touch-manipulation"
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            willChange: 'transform',
                          }}
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5C4033]/10 to-[#8B6F47]/10 flex items-center justify-center group-hover:from-[#5C4033]/20 group-hover:to-[#8B6F47]/20 transition-all duration-150 ease-out">
                            <User className="h-5 w-5 text-[#5C4033] group-hover:scale-110 transition-transform duration-150 ease-out" style={{ willChange: 'transform' }} />
                          </div>
                          <span>Mi Perfil</span>
                        </Link>
                        <Link
                          href="/cart"
                          onClick={() => setMobileMenuOpen(false)}
                          className="group flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-[#3D2817] hover:text-[#5C4033] hover:bg-gradient-to-r hover:from-[#F5F1ED] hover:to-white transition-all duration-150 ease-out active:scale-[0.97] border border-transparent hover:border-[#D4C4B0]/50 touch-manipulation"
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            willChange: 'transform',
                          }}
                        >
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#5C4033]/10 to-[#8B6F47]/10 flex items-center justify-center group-hover:from-[#5C4033]/20 group-hover:to-[#8B6F47]/20 transition-all duration-150 ease-out">
                            <ShoppingCart className="h-5 w-5 text-[#5C4033] group-hover:scale-110 transition-transform duration-150 ease-out" style={{ willChange: 'transform' }} />
                          </div>
                          <span>Carrito</span>
                        </Link>
                        <Button
                          onClick={async () => {
                            await handleLogout()
                            setMobileMenuOpen(false)
                          }}
                          variant="outline"
                          className="w-full mt-4 border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-150 ease-out active:scale-[0.97] flex items-center justify-center gap-2 py-3 touch-manipulation"
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            willChange: 'transform',
                          }}
                        >
                          <LogOut className="h-5 w-5" />
                          Cerrar Sesión
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3 pt-4 border-t border-[#D4C4B0]/50">
                        <Button
                          asChild
                          variant="outline"
                          className="w-full border-2 border-[#D4C4B0] text-[#3D2817] hover:bg-[#F5F1ED] transition-all duration-150 ease-out active:scale-[0.97] flex items-center justify-center gap-2 py-3 touch-manipulation"
                          onClick={() => setMobileMenuOpen(false)}
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            willChange: 'transform',
                          }}
                        >
                          <Link href="/auth/login" className="flex items-center gap-2">
                            <LogIn className="h-5 w-5" />
                            Iniciar Sesión
                          </Link>
                        </Button>
                        <Button
                          asChild
                          className="w-full bg-gradient-to-r from-[#5C4033] to-[#3D2817] hover:from-[#3D2817] hover:to-[#2A1C10] text-white transition-all duration-150 ease-out active:scale-[0.97] shadow-lg flex items-center justify-center gap-2 py-3 touch-manipulation"
                          onClick={() => setMobileMenuOpen(false)}
                          style={{
                            WebkitTapHighlightColor: 'transparent',
                            willChange: 'transform',
                          }}
                        >
                          <Link href="/auth/register" className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Registrarse
                          </Link>
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
