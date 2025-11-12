# 📋 Análisis Completo de Rutas, Redirecciones y Renderización

## 🗺️ Índice
1. [Estructura de Rutas](#estructura-de-rutas)
2. [Sistema de Autenticación](#sistema-de-autenticación)
3. [Flujos de Redirección](#flujos-de-redirección)
4. [Renderización Condicional](#renderización-condicional)
5. [Problemas Detectados](#problemas-detectados)
6. [Recomendaciones de Mejora](#recomendaciones-de-mejora)

---

## 🗂️ Estructura de Rutas

### Rutas Públicas (Sin Autenticación)
```
/                          → Página principal (Home)
/products                  → Catálogo de productos
/products/[slug]           → Detalle de producto
/categories                → Lista de categorías
/categories/[slug]         → Productos por categoría
/promotions                → Promociones públicas
/auth/login                → Inicio de sesión
/auth/register             → Registro de usuario
```

### Rutas Protegidas (Requieren Autenticación)
```
/dashboard                 → Dashboard del cliente
/profile                   → Perfil del usuario
/cart                      → Carrito de compras
/checkout                  → Proceso de pago
/orders                    → Lista de órdenes del cliente
/orders/[id]               → Detalle de orden
```

### Rutas de Administración (Requieren rol "admin")
```
/admin                     → Dashboard administrativo
/admin/products            → Gestión de productos
/admin/products/new        → Crear producto
/admin/products/[id]       → Editar producto
/admin/categories          → Gestión de categorías
/admin/categories/new      → Crear categoría
/admin/categories/[id]     → Editar categoría
/admin/users               → Gestión de usuarios
/admin/promotions          → Gestión de promociones
/admin/promotions/new      → Crear promoción
/admin/promotions/[id]     → Editar promoción
/admin/orders              → Gestión de órdenes
/admin/orders/[id]         → Detalle de orden (admin)
```

---

## 🔐 Sistema de Autenticación

### Componentes Clave

#### 1. **AuthContext** (`lib/auth-context.tsx`)
```typescript
Estado Global:
- user: User | null          → Usuario autenticado
- loading: boolean           → Estado de carga inicial
- userRole: "customer" | "admin" | null  → Rol del usuario

Flujo de Inicialización:
1. useEffect se ejecuta al montar
2. Llama a supabase.auth.getUser()
3. Si hay usuario, consulta su rol en la BD
4. Suscribe a onAuthStateChange para cambios
5. Actualiza estado cuando cambia la sesión
```

**Renderización:**
- Mientras `loading === true`: No renderiza contenido protegido
- Cuando `loading === false`: Renderiza según estado de autenticación

#### 2. **Middleware** (`middleware.ts`)
```typescript
Función:
- Intercepta TODAS las rutas (excepto estáticos)
- Sincroniza cookies de Supabase
- Llama a supabase.auth.getUser() para mantener sesión
- NO hace redirecciones automáticas (solo sincroniza)
```

**Renderización:**
- Se ejecuta en el servidor antes de renderizar
- No afecta la renderización visual directamente
- Solo mantiene la sesión sincronizada

#### 3. **Navbar** (`components/navbar.tsx`)
```typescript
Renderización Condicional:
- !loading && !user → Muestra "Iniciar Sesión" y "Registrarse"
- !loading && user && userRole === "admin" → Muestra "Panel Admin" + botones de usuario
- !loading && user && userRole === "customer" → Muestra botones de usuario (sin Panel Admin)
```

---

## 🔄 Flujos de Redirección

### 1. **Flujo de Login** (`app/auth/login/page.tsx`)

```
Usuario ingresa credenciales
    ↓
supabase.auth.signInWithPassword()
    ↓
Consulta rol en BD: users.role
    ↓
┌─────────────────┬─────────────────┐
│  role === "admin" │ role === "customer" │
│       ↓          │        ↓            │
│ router.replace("/admin") │ router.replace("/dashboard") │
└─────────────────┴─────────────────┘
```

**Renderización:**
- Durante login: Muestra spinner (`loading === true`)
- Después de login: Redirige y renderiza la página destino
- Si error: Muestra mensaje de error, NO redirige

### 2. **Flujo de Registro** (`app/auth/register/page.tsx`)

```
Usuario completa formulario
    ↓
supabase.auth.signUp()
    ↓
Crea registro en users table
    ↓
Crea carrito en carts table
    ↓
┌─────────────────┬─────────────────┐
│  role === "admin" │ role === "customer" │
│       ↓          │        ↓            │
│ router.replace("/admin") │ router.replace("/dashboard") │
└─────────────────┴─────────────────┘
```

**Renderización:**
- Durante registro: Muestra "Registrando..." (`loading === true`)
- Después de registro: Redirige según rol
- Si error: Muestra mensaje, NO redirige

### 3. **Flujo de Logout** (`components/navbar.tsx`)

```
Usuario hace clic en "Cerrar Sesión"
    ↓
handleLogout() ejecuta:
  - supabase.auth.signOut()
  - router.push("/")
    ↓
AuthContext detecta cambio (onAuthStateChange)
    ↓
Actualiza: user = null, userRole = null
    ↓
Navbar se re-renderiza automáticamente
    ↓
Muestra botones de "Iniciar Sesión" y "Registrarse"
```

**Renderización:**
- Inmediatamente después de `signOut()`: Redirige a `/`
- Navbar se actualiza automáticamente (sin recargar página completa)
- Todas las rutas protegidas detectan `user === null` y redirigen

### 4. **Protección de Rutas Admin** (`app/admin/layout.tsx`)

```
Usuario intenta acceder a /admin/*
    ↓
AdminLayout se monta
    ↓
useAuth() obtiene user y userRole
    ↓
┌──────────────────┬──────────────────┐
│ loading === true │ loading === false│
│       ↓          │        ↓         │
│ Muestra spinner  │ Verifica acceso  │
└──────────────────┴──────────────────┘
                    ↓
        ┌───────────┴───────────┐
        │                       │
user === null          user !== null
OR                     AND
userRole !== "admin"   userRole === "admin"
        │                       │
        ↓                       ↓
redirect("/dashboard")    Renderiza contenido admin
```

**Renderización:**
- Mientras carga: Muestra `<Loader2 />` con Navbar
- Si no es admin: Redirige a `/dashboard` (NO renderiza contenido admin)
- Si es admin: Renderiza layout completo con navegación admin

### 5. **Protección de Rutas Cliente** (`app/dashboard/layout.tsx`)

```
Usuario intenta acceder a /dashboard/*
    ↓
DashboardLayout se monta
    ↓
useAuth() obtiene user
    ↓
┌──────────────────┬──────────────────┐
│ loading === true │ loading === false│
│       ↓          │        ↓         │
│ Muestra spinner  │ Verifica acceso  │
└──────────────────┴──────────────────┘
                    ↓
        ┌───────────┴───────────┐
        │                       │
   user === null          user !== null
        │                       │
        ↓                       ↓
redirect("/auth/login")    Renderiza contenido
```

**Renderización:**
- Mientras carga: Muestra spinner con Navbar
- Si no autenticado: Redirige a `/auth/login`
- Si autenticado: Renderiza contenido del dashboard

### 6. **Redirecciones en Formularios Admin**

#### Crear Producto (`app/admin/products/new/page.tsx`)
```
Formulario completado → Insert en BD → router.push("/admin/products")
```

#### Editar Producto (`app/admin/products/[id]/page.tsx`)
```
Formulario actualizado → Update en BD → router.push("/admin/products")
```

#### Crear Categoría (`app/admin/categories/new/page.tsx`)
```
Formulario completado → Insert en BD → router.push("/admin/categories")
```

#### Editar Categoría (`app/admin/categories/[id]/page.tsx`)
```
Formulario actualizado → Update en BD → router.push("/admin/categories")
```

#### Crear/Editar Promoción
```
Formulario completado → Insert/Update en BD → router.push("/admin/promotions")
```

**Renderización:**
- Durante guardado: Muestra estado "Guardando..."
- Después de guardar: Redirige a la lista correspondiente
- Si error: Muestra mensaje, NO redirige

### 7. **Redirecciones en Carrito y Checkout**

#### Agregar al Carrito (`app/products/[slug]/page.tsx`)
```
Usuario no autenticado → router.push("/auth/login")
Usuario autenticado → Agrega producto → Muestra toast
```

#### Ver Carrito (`app/cart/page.tsx`)
```
Usuario no autenticado → router.push("/auth/login")
Usuario autenticado → Muestra carrito
```

#### Procesar Orden (`app/checkout/page.tsx`)
```
Usuario no autenticado → router.push("/auth/login")
Usuario autenticado → Crea orden → router.push("/orders/[id]")
```

**Renderización:**
- Si no autenticado: Redirige inmediatamente a login
- Si autenticado: Renderiza contenido correspondiente

---

## 🎨 Renderización Condicional

### 1. **Navbar** - Renderización según Estado

```typescript
Estado: loading === false && user === null
Renderiza:
  - Logo
  - Links: Productos, Categorías
  - Botones: "Iniciar Sesión", "Registrarse"

Estado: loading === false && user !== null && userRole === "admin"
Renderiza:
  - Logo
  - Links: Productos, Categorías
  - Botón: "Panel Admin" (visible)
  - Botón: "Mi Perfil"
  - Icono: Carrito
  - Dropdown con:
    * Dashboard
    * Panel Admin
    * Mi Perfil
    * Cerrar Sesión

Estado: loading === false && user !== null && userRole === "customer"
Renderiza:
  - Logo
  - Links: Productos, Categorías
  - Botón: "Mi Perfil"
  - Icono: Carrito
  - Dropdown con:
    * Dashboard
    * Mi Perfil
    * Cerrar Sesión
```

### 2. **Layouts con Protección**

#### AdminLayout
```typescript
loading === true:
  → Renderiza: Navbar + Spinner

loading === false && (user === null || userRole !== "admin"):
  → redirect("/dashboard") (NO renderiza contenido)

loading === false && user !== null && userRole === "admin":
  → Renderiza: Navbar + Barra de navegación admin + children
```

#### DashboardLayout
```typescript
loading === true:
  → Renderiza: Navbar + Spinner

loading === false && user === null:
  → redirect("/auth/login") (NO renderiza contenido)

loading === false && user !== null:
  → Renderiza: Navbar + children
```

### 3. **Páginas con Protección Inline**

#### Checkout (`app/checkout/page.tsx`)
```typescript
if (!user) {
  router.push("/auth/login")
  return null  // NO renderiza nada
}

if (authLoading || loading) {
  return <Spinner />  // Renderiza solo spinner
}

// Renderiza formulario de checkout
```

#### Cart (`app/cart/page.tsx`)
```typescript
if (!user) {
  router.push("/auth/login")
  return null  // NO renderiza nada
}

// Renderiza carrito
```

---

## ⚠️ Problemas Detectados

### 1. **Problema: Uso de `redirect()` en Componente Cliente**

**Ubicación:** `app/admin/layout.tsx` línea 31, `app/dashboard/layout.tsx` línea 29

```typescript
// ❌ INCORRECTO: redirect() es para Server Components
if (!user || userRole !== "admin") {
  redirect("/dashboard")
}
```

**Problema:**
- `redirect()` de `next/navigation` está diseñado para Server Components
- En Client Components puede causar comportamientos inesperados
- No funciona correctamente con estados asíncronos

**Solución:**
```typescript
// ✅ CORRECTO: Usar router.replace() o router.push()
import { useRouter } from "next/navigation"

const router = useRouter()

useEffect(() => {
  if (!loading && (!user || userRole !== "admin")) {
    router.replace("/dashboard")
  }
}, [loading, user, userRole, router])
```

### 2. **Problema: Race Condition en Logout**

**Ubicación:** `components/navbar.tsx` línea 17-20

```typescript
const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push("/")
}
```

**Problema:**
- `router.push("/")` se ejecuta inmediatamente después de `signOut()`
- El `onAuthStateChange` puede no haberse propagado aún
- Puede causar que la página destino aún vea al usuario como autenticado

**Solución:**
```typescript
const handleLogout = async () => {
  await supabase.auth.signOut()
  // Esperar un tick para que el estado se actualice
  await new Promise(resolve => setTimeout(resolve, 100))
  router.push("/")
  router.refresh() // Forzar actualización
}
```

### 3. **Problema: Falta de Protección en Algunas Rutas**

**Rutas sin protección explícita:**
- `/profile` - No tiene layout que verifique autenticación
- `/orders` - No tiene layout que verifique autenticación
- `/orders/[id]` - No tiene verificación de propiedad de orden

**Solución:**
- Crear layout para `/profile` y `/orders`
- O agregar verificación inline en cada página

### 4. **Problema: Renderización Duplicada del Navbar**

**Ubicación:** Múltiples layouts

**Problema:**
- `AdminLayout` renderiza `<Navbar />`
- `DashboardLayout` renderiza `<Navbar />`
- Páginas individuales también pueden renderizar `<Navbar />`
- Esto puede causar múltiples renderizados del mismo componente

**Solución:**
- Mover `<Navbar />` al `RootLayout` o crear un componente wrapper

### 5. **Problema: Estado de Carga Inconsistente**

**Ubicación:** Varias páginas

**Problema:**
- Algunas páginas muestran spinner mientras `loading === true`
- Otras redirigen inmediatamente sin esperar
- Esto causa "flashes" de contenido no deseado

**Solución:**
- Estandarizar el manejo de estados de carga en todos los layouts

---

## ✅ Recomendaciones de Mejora

### 1. **Crear Hook de Protección de Rutas**

```typescript
// hooks/use-require-auth.ts
export function useRequireAuth(requiredRole?: "admin" | "customer") {
  const { user, loading, userRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.replace("/auth/login")
      return
    }

    if (requiredRole === "admin" && userRole !== "admin") {
      router.replace("/dashboard")
      return
    }

    if (requiredRole === "customer" && userRole === "admin") {
      // Opcional: redirigir admins lejos de rutas de cliente
    }
  }, [user, loading, userRole, requiredRole, router])

  return { user, loading, userRole, isAuthorized: !!user }
}
```

### 2. **Mejorar el Flujo de Logout**

```typescript
// components/navbar.tsx
const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    
    // Esperar a que el estado se actualice
    await new Promise(resolve => setTimeout(resolve, 150))
    
    // Redirigir y refrescar
    router.push("/")
    router.refresh()
    
    // Opcional: mostrar toast de confirmación
    toast({
      title: "Sesión cerrada",
      description: "Has cerrado sesión correctamente"
    })
  } catch (error) {
    console.error("Error al cerrar sesión:", error)
    toast({
      title: "Error",
      description: "No se pudo cerrar sesión",
      variant: "destructive"
    })
  }
}
```

### 3. **Crear Layout Unificado para Rutas Protegidas**

```typescript
// app/(protected)/layout.tsx
"use client"

import { useRequireAuth } from "@/hooks/use-require-auth"
import { Navbar } from "@/components/navbar"
import { Loader2 } from "lucide-react"

export default function ProtectedLayout({
  children,
  requiredRole,
}: {
  children: React.ReactNode
  requiredRole?: "admin" | "customer"
}) {
  const { loading, isAuthorized } = useRequireAuth(requiredRole)

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex justify-center items-center h-96">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return null // useRequireAuth ya redirigió
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
    </div>
  )
}
```

### 4. **Agregar Verificación de Propiedad en Órdenes**

```typescript
// app/orders/[id]/page.tsx
useEffect(() => {
  if (!user || !order) return

  // Verificar que la orden pertenece al usuario (o es admin)
  if (order.user_id !== user.id && userRole !== "admin") {
    router.replace("/orders")
    toast({
      title: "Acceso denegado",
      description: "No tienes permiso para ver esta orden",
      variant: "destructive"
    })
  }
}, [user, order, userRole, router])
```

### 5. **Mejorar Manejo de Errores en Redirecciones**

```typescript
// utils/navigation.ts
export async function safeRedirect(
  router: AppRouterInstance,
  path: string,
  options?: { replace?: boolean }
) {
  try {
    if (options?.replace) {
      router.replace(path)
    } else {
      router.push(path)
    }
  } catch (error) {
    console.error("Error en redirección:", error)
    // Fallback: usar window.location
    window.location.href = path
  }
}
```

### 6. **Agregar Loading States Consistentes**

```typescript
// components/loading-screen.tsx
export function LoadingScreen({ message = "Cargando..." }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  )
}
```

---

## 📊 Resumen de Flujos Críticos

### Flujo Completo: Login → Dashboard/Admin
```
1. Usuario en /auth/login
2. Ingresa credenciales
3. handleLogin() ejecuta
4. supabase.auth.signInWithPassword()
5. Consulta rol en BD
6. router.replace("/admin") o router.replace("/dashboard")
7. AdminLayout/DashboardLayout se monta
8. useAuth() verifica autenticación
9. Renderiza contenido correspondiente
```

### Flujo Completo: Logout → Home
```
1. Usuario en cualquier página autenticada
2. Clic en "Cerrar Sesión"
3. handleLogout() ejecuta
4. supabase.auth.signOut()
5. router.push("/")
6. onAuthStateChange detecta cambio
7. AuthContext actualiza: user = null, userRole = null
8. Navbar se re-renderiza (muestra botones de login)
9. Si estaba en ruta protegida, layout detecta user === null
10. Layout redirige a /auth/login (si aplica)
```

### Flujo Completo: Acceso No Autorizado
```
1. Usuario sin autenticación intenta /dashboard
2. DashboardLayout se monta
3. useAuth() retorna user = null
4. redirect("/auth/login") ejecuta
5. Usuario ve página de login
6. Después de login, redirige a /dashboard
```

---

## 🎯 Conclusión

El sistema tiene una estructura sólida de autenticación y redirecciones, pero hay áreas de mejora:

1. **Corregir uso de `redirect()` en Client Components**
2. **Mejorar el flujo de logout para evitar race conditions**
3. **Estandarizar protección de rutas**
4. **Evitar renderización duplicada del Navbar**
5. **Agregar verificaciones de propiedad en recursos sensibles**

Con estas mejoras, el sistema tendrá un flujo de autenticación y redirecciones más robusto y predecible.

