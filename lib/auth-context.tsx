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
        // Asegurar que loading siempre se establezca en false después de un tiempo máximo
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    // Timeout de seguridad: si después de 3 segundos aún está cargando, forzar loading a false
    const loadingTimeout = setTimeout(() => {
      if (mountedRef.current) {
        console.log("[AuthContext] Timeout de seguridad: forzando loading a false")
        setLoading(false)
      }
    }, 3000)

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return

      console.log("[AuthContext] Auth state changed:", event, session?.user?.id)
      
      // Establecer loading en false inmediatamente cuando hay un cambio de estado
      // Esto evita que se quede cargando
      if (mountedRef.current) {
        setLoading(false)
      }
      
      setUser(session?.user ?? null)

      if (session?.user) {
        // Obtener el rol de forma asíncrona pero no bloquear el estado de loading
        fetchUserRole(session.user.id)
          .then((role) => {
            if (mountedRef.current) {
              setUserRole(role)
            }
          })
          .catch((error) => {
            console.error("Error fetching user role in onAuthStateChange:", error)
            // Establecer rol por defecto si falla
            if (mountedRef.current) {
              setUserRole("customer")
            }
          })
      } else {
        if (mountedRef.current) {
          setUserRole(null)
        }
      }
    })

    // Verificación periódica opcional - solo si la página está activa y han pasado 5 minutos
    // Esto es menos agresivo y solo se ejecuta cuando realmente es necesario
    let lastCheckTime = Date.now()
    const CHECK_INTERVAL = 300000 // 5 minutos (mucho menos frecuente)
    let intervalId: NodeJS.Timeout | null = null
    
    // Solo iniciar el intervalo si la página está visible (no en background)
    const startInterval = () => {
      if (intervalId) return // Ya está iniciado
      
      intervalId = setInterval(async () => {
        if (!mountedRef.current) return
        
        // Solo verificar si la página está visible
        if (document.hidden) {
          return
        }
        
        // Solo verificar si han pasado al menos 5 minutos desde la última verificación
        const timeSinceLastCheck = Date.now() - lastCheckTime
        if (timeSinceLastCheck < CHECK_INTERVAL) {
          return
        }
        
        lastCheckTime = Date.now()
        
        try {
          const {
            data: { user: currentUser },
            error,
          } = await supabase.auth.getUser()
          
          // Si hay error, no hacer nada
          if (error) {
            return
          }
          
          // Solo actualizar si el estado cambió significativamente
          setUser((prevUser) => {
            if (currentUser?.id !== prevUser?.id) {
              if (mountedRef.current) {
                if (currentUser) {
                  fetchUserRole(currentUser.id).then((role) => {
                    if (mountedRef.current) {
                      setUserRole(role)
                    }
                  }).catch(() => {
                    // Ignorar errores silenciosamente
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
          // Ignorar errores silenciosamente
        }
      }, CHECK_INTERVAL)
    }
    
    // Iniciar intervalo solo si la página está visible
    if (!document.hidden) {
      startInterval()
    }
    
    // Escuchar cambios de visibilidad de la página
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pausar verificación cuando la página está en background
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
      } else {
        // Reanudar verificación cuando la página vuelve a estar visible
        startInterval()
      }
    }
    
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
      clearTimeout(loadingTimeout)
      if (intervalId) {
        clearInterval(intervalId)
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange)
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
