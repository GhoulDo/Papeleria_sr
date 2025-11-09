"use client"

import { useAuth } from "@/lib/auth-context"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Logo } from "@/components/logo"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShoppingCart, User } from "lucide-react"

export function Navbar() {
  const { user, loading, userRole } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <nav className="border-b border-[#D4C4B0] bg-[#F5F1ED]/95 backdrop-blur supports-[backdrop-filter]:bg-[#F5F1ED]/60 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Logo />

        <div className="hidden md:flex items-center gap-6">
          <Link href="/products" className="text-sm text-[#3D2817] hover:text-[#5C4033] transition font-medium">
            Productos
          </Link>
          <Link href="/categories" className="text-sm text-[#3D2817] hover:text-[#5C4033] transition font-medium">
            Categorías
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {!loading && (
            <>
              {user ? (
                <>
                  {userRole === "admin" && (
                    <Button variant="outline" asChild className="hidden md:inline-flex border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5F1ED]">
                      <Link href="/admin">Panel Admin</Link>
                    </Button>
                  )}
                  <Button variant="ghost" asChild className="hidden md:inline-flex text-[#5C4033] hover:bg-[#D4C4B0]">
                    <Link href="/profile">Mi Perfil</Link>
                  </Button>
                  <Button variant="ghost" size="icon" asChild className="hover:bg-[#D4C4B0]">
                    <Link href="/cart">
                      <ShoppingCart className="h-5 w-5 text-[#5C4033]" />
                    </Link>
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
              ) : (
                <>
                  <Button variant="ghost" asChild className="text-[#3D2817] hover:bg-[#D4C4B0]">
                    <Link href="/auth/login">Iniciar Sesión</Link>
                  </Button>
                  <Button asChild className="bg-[#5C4033] hover:bg-[#3D2817] text-white">
                    <Link href="/auth/register">Registrarse</Link>
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
