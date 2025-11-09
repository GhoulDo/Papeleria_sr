"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
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

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)

        // Fetch user role from database
        if (user) {
          const { data, error } = await supabase.from("users").select("role").eq("id", user.id).single()

          if (error) throw error
          setUserRole(data?.role || "customer")
        }
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data } = await supabase.from("users").select("role").eq("id", session.user.id).single()

        setUserRole(data?.role || "customer")
      } else {
        setUserRole(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return <AuthContext.Provider value={{ user, loading, userRole }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de AuthProvider")
  }
  return context
}
