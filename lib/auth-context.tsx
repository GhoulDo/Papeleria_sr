"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import type { User } from "@supabase/supabase-js"
import { getClient } from "./supabase/client"

interface AuthContextType {
  user: User | null
  loading: boolean
  userRole: "customer" | "admin" | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const supabase = getClient()

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<"customer" | "admin" | null>(null)
  const mountedRef = useRef(true)

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase.from("users").select("role").eq("id", userId).single()
      
      if (error) {
        console.error("Error fetching user role:", error)
        return "customer" // Default role on error
      }
      
      return (data?.role as "customer" | "admin") || "customer"
    } catch (error) {
      console.error("Error in fetchUserRole:", error)
      return "customer"
    }
  }

  useEffect(() => {
    mountedRef.current = true
    let retryCount = 0
    const maxRetries = 3

    const getUser = async (isRetry = false) => {
      try {
        const {
          data: { user },
          error: getUserError,
        } = await supabase.auth.getUser()

        if (getUserError) {
          console.error("Error getting user:", getUserError)
          // Si es un error de red o token, intentar refrescar
          if (getUserError.message?.includes("JWT") || getUserError.message?.includes("token")) {
            if (retryCount < maxRetries && mountedRef.current) {
              retryCount++
              console.log(`Reintentando obtener usuario (intento ${retryCount}/${maxRetries})...`)
              await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
              return getUser(true)
            }
          }
        }

        if (!mountedRef.current) return

        setUser(user ?? null)

        // Fetch user role from database
        if (user) {
          const role = await fetchUserRole(user.id)
          if (mountedRef.current) {
            setUserRole(role)
          }
        } else {
          if (mountedRef.current) {
            setUserRole(null)
          }
        }
      } catch (error) {
        console.error("Error fetching user:", error)
        // En caso de error, no establecer loading a false inmediatamente
        // para dar oportunidad de reintentar
        if (!isRetry && retryCount < maxRetries && mountedRef.current) {
          retryCount++
          console.log(`Reintentando después de error (intento ${retryCount}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount))
          return getUser(true)
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      console.log("[AuthContext] Auth state changed:", event, session?.user?.id)
      
      setUser(session?.user ?? null)

      if (session?.user) {
        const role = await fetchUserRole(session.user.id)
        if (mountedRef.current) {
          setUserRole(role)
        }
      } else {
        if (mountedRef.current) {
          setUserRole(null)
        }
      }
      
      // Si acabamos de iniciar sesión, asegurarnos de que loading sea false
      if (mountedRef.current) {
        setLoading(false)
      }
    })

    // Verificación periódica del estado de autenticación (cada 30 segundos)
    // Esto ayuda a mantener la sincronización en producción
    const intervalId = setInterval(async () => {
      if (!mountedRef.current) return
      
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()
        
        // Usar una función de actualización para obtener el estado más reciente
        setUser((prevUser) => {
          // Solo actualizar si el estado cambió
          if (currentUser?.id !== prevUser?.id) {
            if (mountedRef.current) {
              // Actualizar el rol si hay un usuario nuevo
              if (currentUser) {
                fetchUserRole(currentUser.id).then((role) => {
                  if (mountedRef.current) {
                    setUserRole(role)
                  }
                }).catch((error) => {
                  console.debug("Error fetching role in interval:", error)
                })
              } else {
                if (mountedRef.current) {
                  setUserRole(null)
                }
              }
            }
            return currentUser ?? null
          }
          return prevUser
        })
      } catch (error) {
        // Silenciar errores de verificación periódica para no llenar la consola
        console.debug("Error en verificación periódica de auth:", error)
      }
    }, 30000) // Cada 30 segundos

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
      clearInterval(intervalId)
    }
  }, []) // Sin dependencias para evitar re-crear el intervalo

  return <AuthContext.Provider value={{ user, loading, userRole }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}
