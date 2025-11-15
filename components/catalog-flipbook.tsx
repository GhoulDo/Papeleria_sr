"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, ChevronLeft, ChevronRight, BookOpen, ShoppingCart, Star, Eye } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Product {
  id: string
  name: string
  slug: string
  description: string
  price: number
  image_url: string | null
  rating: number
  reviews_count: number
  stock_quantity: number
  category?: {
    name: string
  }
}

interface CatalogFlipbookProps {
  products: Product[]
  onAddToCart: (productId: string, productName: string) => void
}

export function CatalogFlipbook({ products, onAddToCart }: CatalogFlipbookProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [turnLoaded, setTurnLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const flipbookRef = useRef<HTMLDivElement>(null)
  const turnInstanceRef = useRef<any>(null)
  const scriptsLoadedRef = useRef(false)
  const initializationAttemptedRef = useRef(false)

  // Detectar si es dispositivo móvil y redimensionar flipbook
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      
      // Redimensionar flipbook si ya está inicializado
      if (turnInstanceRef.current && typeof turnInstanceRef.current.turn === "function") {
        try {
          let flipbookWidth: number
          let flipbookHeight: number
          
          if (mobile) {
            const viewportWidth = window.innerWidth
            const viewportHeight = window.innerHeight
            
            flipbookWidth = Math.min(
              Math.max(Math.floor(viewportWidth * 0.9), 300),
              400
            )
            
            const calculatedHeight = Math.round(flipbookWidth * 0.7)
            const maxHeight = Math.floor(viewportHeight * 0.65)
            flipbookHeight = Math.min(calculatedHeight, maxHeight, 600)
            
            if (flipbookHeight < 400) {
              flipbookHeight = 400
            }
          } else {
            flipbookWidth = 1000
            flipbookHeight = 700
          }
          
          if (flipbookRef.current) {
            flipbookRef.current.style.width = `${flipbookWidth}px`
            flipbookRef.current.style.height = `${flipbookHeight}px`
            flipbookRef.current.style.maxWidth = mobile ? `${flipbookWidth}px` : '1000px'
            flipbookRef.current.style.maxHeight = `${flipbookHeight}px`
            flipbookRef.current.style.overflow = 'hidden'
          }
          
          turnInstanceRef.current.turn('size', flipbookWidth, flipbookHeight)
        } catch (error) {
          console.warn("[Catalog] Error resizing flipbook:", error)
        }
      }
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (!flipbookRef.current || products.length === 0) {
      setIsLoading(false)
      return
    }

    // Prevenir múltiples inicializaciones (React Strict Mode)
    if (initializationAttemptedRef.current) {
      return
    }
    initializationAttemptedRef.current = true

    const LOAD_TIMEOUT = 10000 // 10 segundos máximo
    const startTime = Date.now()

    const loadTurnJS = async () => {
      try {
        // Cargar jQuery y Turn.js dinámicamente
        if (typeof window !== "undefined") {
          // Función helper para cargar script con timeout y verificación
          const loadScript = (src: string, id?: string, checkGlobal?: string): Promise<void> => {
            return new Promise((resolve, reject) => {
              // Verificar si ya existe y está disponible
              if (id && document.getElementById(id)) {
                // Si hay un global que verificar, esperar a que esté disponible
                if (checkGlobal) {
                  let attempts = 0
                  const maxAttempts = 60 // 3 segundos máximo
                  const checkInterval = setInterval(() => {
                    attempts++
                    if ((window as any)[checkGlobal]) {
                      clearInterval(checkInterval)
                      resolve()
                    } else if (attempts >= maxAttempts) {
                      clearInterval(checkInterval)
                      reject(new Error(`Global ${checkGlobal} not available after loading`))
                    }
                  }, 50)
                  return
                }
                resolve()
                return
              }

              const script = document.createElement("script")
              script.src = src
              script.async = false // Síncrono para mejor control
              script.crossOrigin = "anonymous"
              if (id) script.id = id

              const timeout = setTimeout(() => {
                if (script.parentNode) {
                  script.remove()
                }
                reject(new Error(`Timeout loading script: ${src}`))
              }, LOAD_TIMEOUT)

              script.onload = () => {
                clearTimeout(timeout)
                // Si hay un global que verificar, esperar a que esté disponible
                if (checkGlobal) {
                  let attempts = 0
                  const maxAttempts = 60 // 3 segundos máximo
                  const checkInterval = setInterval(() => {
                    attempts++
                    if (checkGlobal === "turn") {
                      // Turn.js se carga como plugin de jQuery, no como global
                      const jQuery = (window as any).jQuery
                      if (jQuery && typeof jQuery.fn?.turn === "function") {
                        clearInterval(checkInterval)
                        resolve()
                      } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval)
                        // No rechazar aquí, solo verificar después
                        resolve()
                      }
                    } else {
                      const global = (window as any)[checkGlobal]
                      if (global && (checkGlobal === "jQuery" ? typeof global.fn !== "undefined" : true)) {
                        clearInterval(checkInterval)
                        resolve()
                      } else if (attempts >= maxAttempts) {
                        clearInterval(checkInterval)
                        reject(new Error(`Global ${checkGlobal} not available after loading`))
                      }
                    }
                  }, 50)
                } else {
                  // Esperar un momento para que el script se ejecute
                  setTimeout(() => resolve(), 100)
                }
              }
              
              script.onerror = () => {
                clearTimeout(timeout)
                if (script.parentNode) {
                  script.remove()
                }
                reject(new Error(`Failed to load script: ${src}`))
              }

              document.head.appendChild(script)
            })
          }

          // Cargar jQuery - Estrategia: primero intentar desde node_modules, luego CDN
          let jqueryLoaded = false
          
          // Estrategia 1: Intentar importar jQuery desde node_modules (mejor para turn.js)
          if (!(window as any).jQuery) {
            try {
              console.log("[Catalog] Attempting to load jQuery from node_modules...")
              const jQueryModule = await import("jquery")
              
              // Hacer jQuery disponible globalmente
              const jQuery = jQueryModule.default || jQueryModule
              if (jQuery && typeof jQuery.fn !== "undefined") {
                (window as any).jQuery = jQuery
                (window as any).$ = jQuery
                console.log("[Catalog] jQuery loaded from node_modules")
                jqueryLoaded = true
              }
            } catch (importError) {
              console.warn("[Catalog] Failed to import jQuery from node_modules, trying CDN...", importError)
            }
          } else {
            console.log("[Catalog] jQuery already available")
            jqueryLoaded = true
          }

          // Estrategia 2: Si node_modules falla, intentar CDN
          if (!jqueryLoaded && !(window as any).jQuery) {
            console.log("[Catalog] Loading jQuery from CDN...")
            const jqueryCDNs = [
              "https://code.jquery.com/jquery-1.12.0.min.js", // Versión compatible con turn.js
              "https://code.jquery.com/jquery-3.6.0.min.js",
              "https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js",
              "https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js",
            ]

            for (const cdn of jqueryCDNs) {
              try {
                console.log(`[Catalog] Trying to load jQuery from ${cdn}`)
                await loadScript(cdn, "jquery-script", "jQuery")
                // Verificar que jQuery está disponible
                if ((window as any).jQuery && typeof (window as any).jQuery.fn !== "undefined") {
                  console.log("[Catalog] jQuery loaded successfully from CDN")
                  jqueryLoaded = true
                  break
                } else {
                  console.warn(`[Catalog] jQuery script loaded but not available from ${cdn}`)
                }
              } catch (error) {
                console.warn(`[Catalog] Error loading jQuery from ${cdn}, trying next...`, error)
                continue
              }
            }

            // Esperar un poco más y verificar de nuevo
            if (!jqueryLoaded) {
              console.log("[Catalog] Waiting for jQuery to become available...")
              await new Promise((resolve) => setTimeout(resolve, 500))
              if ((window as any).jQuery && typeof (window as any).jQuery.fn !== "undefined") {
                console.log("[Catalog] jQuery became available after waiting")
                jqueryLoaded = true
              }
            }
          }

          if (!jqueryLoaded || !(window as any).jQuery) {
            console.error("[Catalog] Failed to load jQuery from all sources")
            setIsLoading(false)
            return
          }
          
          // Asegurar que jQuery esté disponible globalmente
          if (!(window as any).$) {
            (window as any).$ = (window as any).jQuery
          }

          // Verificar que jQuery se cargó correctamente - esperar un poco más
          await new Promise((resolve) => setTimeout(resolve, 300))
          
          // Verificar que jQuery está disponible y sincronizado
          let jqueryReady = false
          let attempts = 0
          while (!jqueryReady && attempts < 30) {
            const $ = (window as any).jQuery
            if ($ && typeof $.fn !== "undefined") {
              // Asegurar que jQuery esté disponible en window.jQuery y window.$
              if (!(window as any).jQuery) {
                (window as any).jQuery = $
              }
              if (!(window as any).$) {
                (window as any).$ = $
              }
              jqueryReady = true
              break
            }
            await new Promise((resolve) => setTimeout(resolve, 100))
            attempts++
          }
          
          if (!jqueryReady) {
            console.error("[Catalog] jQuery not properly initialized after waiting")
            setIsLoading(false)
            return
          }
          
          // Verificación final: asegurar que jQuery esté disponible globalmente
          const finalJQuery = (window as any).jQuery
          if (!finalJQuery || typeof finalJQuery.fn === "undefined") {
            console.error("[Catalog] jQuery not available after all checks")
            setIsLoading(false)
            return
          }
          
          // Sincronizar una vez más antes de cargar turn.js
          (window as any).jQuery = finalJQuery
          ;(window as any).$ = finalJQuery
          
          console.log("[Catalog] jQuery verified and synchronized:", {
            jQuery: !!(window as any).jQuery,
            $: !!(window as any).$,
            fn: !!(window as any).jQuery?.fn
          })

          // Cargar Turn.js - Priorizar archivo local desde public
          let jQueryRef = (window as any).jQuery
          
          // Verificar si ya está disponible como plugin de jQuery
          const turnAlreadyAvailable = jQueryRef && typeof jQueryRef.fn?.turn === "function"
          
          if (!turnAlreadyAvailable) {
            console.log("[Catalog] Loading Turn.js from local file...")
            
            // Verificar que jQuery esté disponible
            if (!jQueryRef || typeof jQueryRef.fn === "undefined") {
              console.error("[Catalog] jQuery not available for Turn.js")
              setIsLoading(false)
              return
            }
            
            // Asegurar que jQuery esté disponible globalmente
            if (!(window as any).jQuery) {
              (window as any).jQuery = jQueryRef
            }
            if (!(window as any).$) {
              (window as any).$ = jQueryRef
            }
            
            // También asegurar en globalThis
            if (typeof globalThis !== 'undefined') {
              (globalThis as any).jQuery = jQueryRef
              ;(globalThis as any).$ = jQueryRef
            }
            
            // Esperar un momento para asegurar que jQuery esté completamente sincronizado
            await new Promise((resolve) => setTimeout(resolve, 100))
            
            let turnLoaded = false
            
            try {
              // Cargar turn.js desde public (archivo local modificado)
              console.log("[Catalog] Loading Turn.js from /turn.js")
              
              const script = document.createElement("script")
              script.src = "/turn.js"
              script.async = false
              script.id = "turnjs-script"
              
              await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  if (script.parentNode) {
                    script.remove()
                  }
                  reject(new Error(`Timeout loading Turn.js`))
                }, LOAD_TIMEOUT)
                
                script.onload = () => {
                  clearTimeout(timeout)
                  // Esperar a que el script se ejecute completamente
                  setTimeout(() => {
                    jQueryRef = (window as any).jQuery
                    if (jQueryRef && typeof jQueryRef.fn?.turn === "function") {
                      console.log("[Catalog] ✅ Turn.js loaded successfully")
                      turnLoaded = true
                      resolve()
                    } else {
                      // Esperar un poco más
                      setTimeout(() => {
                        jQueryRef = (window as any).jQuery
                        if (jQueryRef && typeof jQueryRef.fn?.turn === "function") {
                          console.log("[Catalog] ✅ Turn.js became available after waiting")
                          turnLoaded = true
                          resolve()
                        } else {
                          if (script.parentNode) {
                            script.remove()
                          }
                          reject(new Error("Turn.js loaded but jQuery.fn.turn not available"))
                        }
                      }, 500)
                    }
                  }, 300)
                }
                
                script.onerror = () => {
                  clearTimeout(timeout)
                  if (script.parentNode) {
                    script.remove()
                  }
                  reject(new Error("Failed to load Turn.js script"))
                }
                
                document.head.appendChild(script)
              })
            } catch (loadError) {
              console.error("[Catalog] ❌ Failed to load Turn.js:", loadError)
              setIsLoading(false)
              return
            }

            // Verificación final
            jQueryRef = (window as any).jQuery
            const turnAvailable = jQueryRef && typeof jQueryRef.fn?.turn === "function"
            if (!turnLoaded || !turnAvailable) {
              console.warn("[Catalog] Turn.js not available after loading, will show fallback view")
              setIsLoading(false)
              return
            }
          } else {
            console.log("[Catalog] Turn.js already available")
          }

          // Cargar CSS de Turn.js (inline para evitar CDN) - Mejorado para móviles
          if (!document.getElementById("turnjs-css")) {
            const turnCss = document.createElement("style")
            turnCss.id = "turnjs-css"
            turnCss.textContent = `
              .turn-page-wrapper {
                position: absolute;
                overflow: hidden;
                width: 100%;
                height: 100%;
              }
              .turn-page {
                position: relative;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                -webkit-tap-highlight-color: transparent;
                touch-action: pan-y;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
              }
              .hard {
                background: white;
                box-shadow: inset 0 0 5px #666;
                width: 100%;
                height: 100%;
                overflow: hidden;
                box-sizing: border-box;
              }
              #flipbook {
                position: relative;
                overflow: hidden !important;
                box-sizing: border-box;
              }
              /* Mejoras para móviles */
              @media (max-width: 768px) {
              #flipbook {
                touch-action: pan-y pinch-zoom;
                -webkit-overflow-scrolling: touch;
                max-height: 100vh;
                overflow: hidden !important;
                box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4) !important;
              }
                .turn-page {
                  -webkit-tap-highlight-color: rgba(0,0,0,0);
                  max-height: 100%;
                  overflow: hidden;
                }
                .hard {
                  max-height: 100%;
                  overflow: hidden;
                }
              }
            `
            document.head.appendChild(turnCss)
          }

          // Esperar un momento adicional para que todo se inicialice completamente
          await new Promise((resolve) => setTimeout(resolve, 300))

          // Verificar que todo está disponible
          const jQueryFinal = (window as any).jQuery
          // Turn.js se carga como plugin de jQuery, no como global
          const turnAvailable = jQueryFinal && typeof jQueryFinal.fn !== "undefined" && typeof jQueryFinal.fn.turn === "function"
          
          if (!turnAvailable) {
            console.error("[Catalog] Turn.js or jQuery not available after loading")
            console.error("[Catalog] jQuery:", !!jQueryFinal, "jQuery.fn:", !!jQueryFinal?.fn, "jQuery.fn.turn:", typeof jQueryFinal?.fn?.turn)
            setIsLoading(false)
            return
          }

          // Inicializar Turn.js
          if (flipbookRef.current && !turnInstanceRef.current && !scriptsLoadedRef.current) {
            // Calcular dimensiones según dispositivo
            const isMobileDevice = window.innerWidth < 768
            
            // En móviles: dimensiones fijas y controladas para evitar problemas
            let flipbookWidth: number
            let flipbookHeight: number
            
            if (isMobileDevice) {
              // En móviles: usar un tamaño fijo y controlado
              const viewportWidth = window.innerWidth
              const viewportHeight = window.innerHeight
              
              // Ancho: máximo 90% del viewport, mínimo 300px, máximo 400px
              flipbookWidth = Math.min(
                Math.max(Math.floor(viewportWidth * 0.9), 300),
                400
              )
              
              // Altura: mantener proporción 0.7:1 pero limitada a 70% del viewport
              const calculatedHeight = Math.round(flipbookWidth * 0.7)
              const maxHeight = Math.floor(viewportHeight * 0.65) // 65% del viewport para dejar espacio
              flipbookHeight = Math.min(calculatedHeight, maxHeight, 600)
              
              // Asegurar altura mínima
              if (flipbookHeight < 400) {
                flipbookHeight = 400
              }
            } else {
              flipbookWidth = 1000
              flipbookHeight = 700
            }
            
            const displayMode = isMobileDevice ? 'single' : 'double'
            const productsPerPageCalc = isMobileDevice ? 1 : 2
            // Calcular páginas totales correctamente
            const totalPagesCalc = isMobileDevice 
              ? products.length + 1  // Portada + una página por producto
              : Math.ceil(products.length / 2) + 1  // Portada + páginas con 2 productos

            console.log("[Catalog] Initializing Turn.js:", {
              isMobile: isMobileDevice,
              width: flipbookWidth,
              height: flipbookHeight,
              display: displayMode,
              totalPages: totalPagesCalc,
              productsCount: products.length
            })

            try {
              // Asegurarse de que el elemento esté en el DOM
              if (!flipbookRef.current.parentElement) {
                console.error("[Catalog] Flipbook element not in DOM")
                setIsLoading(false)
                return
              }

              // Ajustar tamaño del contenedor con valores específicos
              flipbookRef.current.style.width = `${flipbookWidth}px`
              flipbookRef.current.style.height = `${flipbookHeight}px`
              flipbookRef.current.style.maxWidth = isMobileDevice ? `${flipbookWidth}px` : '1000px'
              flipbookRef.current.style.minHeight = `${flipbookHeight}px`
              flipbookRef.current.style.maxHeight = `${flipbookHeight}px`
              flipbookRef.current.style.overflow = 'hidden'

              turnInstanceRef.current = jQueryFinal(flipbookRef.current).turn({
                width: flipbookWidth,
                height: flipbookHeight,
                autoCenter: true,
                pages: totalPagesCalc, // Usar el cálculo correcto
                gradients: true,
                elevation: isMobileDevice ? 30 : 60, // Mayor elevación para mejor efecto 3D
                duration: isMobileDevice ? 600 : 1000, // Animación más suave y fluida
                acceleration: true, // Aceleración de hardware
                display: displayMode, // Modo single en móviles, double en desktop
                when: {
                  turning: function (event: any, page: number) {
                    setCurrentPage(page)
                  },
                  turned: function (event: any, page: number) {
                    setCurrentPage(page)
                    console.log("[Catalog] Turned to page:", page, "of", totalPagesCalc)
                  },
                },
              })

              scriptsLoadedRef.current = true
              setTurnLoaded(true)
              setIsLoading(false)
              
              console.log("[Catalog] Turn.js initialized successfully", {
                width: flipbookWidth,
                height: flipbookHeight,
                pages: totalPagesCalc,
                display: displayMode
              })
            } catch (initError) {
              console.error("[Catalog] Error initializing Turn.js:", initError)
              setIsLoading(false)
            }
          } else {
            setIsLoading(false)
          }
        }
      } catch (error) {
        console.error("[Catalog] Error loading Turn.js:", error)
        setIsLoading(false)
      }

    }

    // Timeout de seguridad global
    const timeoutId = setTimeout(() => {
      if (!scriptsLoadedRef.current) {
        console.warn("[Catalog] Timeout loading Turn.js, showing content anyway")
        setIsLoading(false)
      }
    }, LOAD_TIMEOUT)

    loadTurnJS()

    return () => {
      clearTimeout(timeoutId)
      if (turnInstanceRef.current && typeof turnInstanceRef.current.turn === "function") {
        try {
          turnInstanceRef.current.turn("destroy")
        } catch (e) {
          console.error("Error destroying turn instance:", e)
        }
        turnInstanceRef.current = null
      }
      scriptsLoadedRef.current = false
      initializationAttemptedRef.current = false
    }
  }, [products])

  const handlePrevPage = () => {
    if (turnInstanceRef.current && typeof turnInstanceRef.current.turn === "function") {
      turnInstanceRef.current.turn("previous")
    }
  }

  const handleNextPage = () => {
    if (turnInstanceRef.current && typeof turnInstanceRef.current.turn === "function") {
      turnInstanceRef.current.turn("next")
    }
  }

  // Calcular páginas de forma consistente
  const productsPerPage = isMobile ? 1 : 2
  // En móviles: portada (1) + productos (products.length) = products.length + 1
  // En desktop: portada (1) + páginas de productos (Math.ceil(products.length / 2)) = Math.ceil(products.length / 2) + 1
  const totalPages = isMobile 
    ? products.length + 1  // Portada + una página por producto
    : Math.ceil(products.length / 2) + 1  // Portada + páginas con 2 productos

  // Si está cargando y no hay productos, mostrar loader
  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] md:h-[700px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#5C4033] mx-auto" />
          <p className="text-[#6B5D52] text-sm md:text-base">Cargando catálogo...</p>
        </div>
      </div>
    )
  }

  // Si hay productos pero Turn.js no se cargó, mostrar contenido sin animación
  if (!turnLoaded && products.length > 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center gap-8 w-full py-8">
        <div className="text-center space-y-4 mb-6">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-[#F5F1ED] to-white border-2 border-[#E1D5C8] shadow-sm">
            <BookOpen className="h-5 w-5 text-[#8B6F47]" />
            <p className="text-[#5C4033] font-medium">Catálogo de Productos</p>
          </div>
          <p className="text-sm text-[#6B5D52]">
            {products.length} {products.length === 1 ? "producto disponible" : "productos disponibles"}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl w-full px-4">
          {products.map((product, index) => (
            <div
              key={product.id}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${index * 50}ms`,
                animationDuration: "0.5s",
                animationFillMode: "both",
              }}
            >
              <ProductCard product={product} onAddToCart={onAddToCart} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 w-full">
      {/* Controls - Estilo mejorado */}
      <div className="flex items-center gap-3 md:gap-4 w-full max-w-2xl justify-center">
        <Button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          variant="outline"
          size="lg"
          className="border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg min-h-[48px] px-6 touch-manipulation"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          <span className="hidden sm:inline">Anterior</span>
        </Button>

        <div className="px-6 md:px-8 py-3 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 shadow-lg">
          <span className="text-white font-bold text-sm md:text-base">
            {currentPage} / {totalPages}
          </span>
        </div>

        <Button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          variant="outline"
          size="lg"
          className="border-2 border-white/30 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg min-h-[48px] px-6 touch-manipulation"
        >
          <span className="hidden sm:inline">Siguiente</span>
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {/* Flipbook - Responsive */}
      <div className="relative w-full flex justify-center" style={{ overflow: 'hidden' }}>
        <div
          ref={flipbookRef}
          id="flipbook"
          className="shadow-2xl mx-auto"
          style={{
            width: isMobile ? "90vw" : "1000px",
            maxWidth: isMobile ? "400px" : "1000px",
            margin: "0 auto",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Portada - Mejorada con colores vibrantes */}
          <div className="hard relative overflow-hidden">
            {/* Fondo con gradiente y patrones */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#5C4033] via-[#8B6F47] to-[#C97D2E]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(201,125,46,0.3)_0%,transparent_50%)]" />
            </div>
            
            {/* Decoración de esquinas */}
            <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-white/20" />
            <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-white/20" />
            <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-white/20" />
            <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-white/20" />
            
            {/* Contenido de la portada */}
            <div className="relative z-10 h-full flex flex-col items-center justify-center p-6 md:p-12 text-white">
              <div className="text-center space-y-4 md:space-y-6">
                {/* Icono decorativo */}
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
                  <div className="relative bg-white/10 backdrop-blur-sm rounded-full p-6 md:p-8 border-2 border-white/30">
                    <BookOpen className="h-16 w-16 md:h-24 md:w-24 mx-auto text-white drop-shadow-lg" />
                  </div>
                </div>
                
                {/* Título principal */}
                <div className="space-y-2 md:space-y-4">
                  <h2 className="text-4xl md:text-6xl font-bold mb-2 md:mb-4 drop-shadow-2xl">
                    <span className="bg-gradient-to-r from-white via-yellow-100 to-white bg-clip-text text-transparent">
                      Catálogo 2025
                    </span>
                  </h2>
                  <div className="w-32 md:w-48 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent mx-auto rounded-full" />
                  <p className="text-xl md:text-3xl font-semibold text-white/95 drop-shadow-lg">
                    Papelería y Variedades S.R
                  </p>
                </div>
                
                {/* Línea decorativa */}
                <div className="w-24 md:w-32 h-0.5 bg-white/40 mx-auto rounded-full my-4 md:my-6" />
                
                {/* Descripción */}
                <p className="text-sm md:text-lg text-white/90 mt-4 md:mt-6 px-4 max-w-md mx-auto leading-relaxed">
                  Descubre nuestra colección completa de productos cuidadosamente seleccionados
                </p>
                
                {/* Badge con productos */}
                <div className="mt-6 md:mt-8">
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-2 border-white/30 px-6 md:px-8 py-2 md:py-3 text-sm md:text-base font-semibold shadow-lg">
                    {products.length} {products.length === 1 ? "producto disponible" : "productos disponibles"}
                  </Badge>
                </div>
                
                {/* Elementos decorativos adicionales */}
                <div className="flex items-center justify-center gap-2 mt-6 md:mt-8">
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Páginas de productos - Responsive */}
          {Array.from({ length: totalPages - 1 }).map((_, pageIndex) => {
            const startIndex = pageIndex * productsPerPage
            const pageProducts = products.slice(startIndex, startIndex + productsPerPage)

            return (
              <div key={`page-${pageIndex}-${pageProducts[0]?.id || 'empty'}`} className="hard" style={{ height: '100%', overflow: 'hidden' }}>
                {isMobile ? (
                  // Modo móvil: un producto por página
                  pageProducts[0] ? (
                    <ProductPage 
                      product={pageProducts[0]} 
                      onAddToCart={onAddToCart} 
                      isMobile={isMobile} 
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-[#F5F1ED] to-white flex items-center justify-center p-8 h-full" style={{ minHeight: '100%' }}>
                      <div className="text-center space-y-4">
                        <BookOpen className="h-12 w-12 md:h-16 md:w-16 text-[#8B6F47] mx-auto opacity-50" />
                        <p className="text-[#6B5D52] text-base md:text-lg">Más productos próximamente</p>
                      </div>
                    </div>
                  )
                ) : (
                  // Modo desktop: dos productos por página
                  <div className="grid grid-cols-2 h-full" style={{ height: '100%' }}>
                    {/* Producto izquierdo */}
                    {pageProducts[0] && (
                      <ProductPage 
                        product={pageProducts[0]} 
                        onAddToCart={onAddToCart} 
                        isMobile={isMobile} 
                      />
                    )}

                    {/* Producto derecho */}
                    {pageProducts[1] ? (
                      <ProductPage 
                        product={pageProducts[1]} 
                        onAddToCart={onAddToCart} 
                        isMobile={isMobile} 
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-[#F5F1ED] to-white border-l border-[#E1D5C8] flex items-center justify-center p-8" style={{ minHeight: '100%' }}>
                        <div className="text-center space-y-4">
                          <BookOpen className="h-16 w-16 text-[#8B6F47] mx-auto opacity-50" />
                          <p className="text-[#6B5D52] text-lg">Más productos próximamente</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

interface ProductPageProps {
  product: Product
  onAddToCart: (productId: string, productName: string) => void
  isMobile?: boolean
}

function ProductCard({ product, onAddToCart }: ProductPageProps) {
  return (
    <div className="bg-gradient-to-br from-white to-[#FBF8F4] border-2 border-[#E1D5C8] rounded-xl p-4 md:p-6 flex flex-col h-full shadow-lg hover:shadow-xl transition-all">
      <div className="flex-1 space-y-3 md:space-y-4">
        {/* Imagen - Responsive */}
        <div className="relative w-full h-48 md:h-64 rounded-xl overflow-hidden border-2 border-[#E1D5C8] bg-white">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F5F1ED] to-[#E1D5C8] flex items-center justify-center">
              <BookOpen className="h-12 w-12 md:h-16 md:w-16 text-[#8B6F47] opacity-50" />
            </div>
          )}
          {product.category && (
            <Badge className="absolute top-2 left-2 md:top-3 md:left-3 bg-white/90 text-[#5C4033] backdrop-blur-sm text-xs">
              {product.category.name}
            </Badge>
          )}
        </div>

        {/* Información - Responsive */}
        <div className="space-y-2 md:space-y-3">
          <h3 className="text-lg md:text-2xl font-bold text-[#3D2817] line-clamp-2">{product.name}</h3>

          {product.description && (
            <p className="text-xs md:text-sm text-[#6B5D52] line-clamp-3">{product.description}</p>
          )}

          {/* Rating - Responsive */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3 md:h-4 md:w-4",
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-xs md:text-sm text-[#6B5D52]">
              {product.rating.toFixed(1)} ({product.reviews_count})
            </span>
          </div>

          {/* Precio - Responsive */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-[#5C4033]">
              ${product.price.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Stock - Responsive */}
          <div className="text-xs md:text-sm">
            {product.stock_quantity > 0 ? (
              <span className="text-green-600 font-medium">
                {product.stock_quantity} disponibles
              </span>
            ) : (
              <span className="text-red-600 font-medium">Agotado</span>
            )}
          </div>
        </div>
      </div>

      {/* Acciones - Responsive con mejor touch */}
      <div className="flex flex-col md:flex-row gap-2 md:gap-3 mt-4 md:mt-6 pt-4 md:pt-6 border-t border-[#E1D5C8]">
        <Button
          onClick={() => onAddToCart(product.id, product.name)}
          disabled={product.stock_quantity === 0}
          className="flex-1 bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10] min-h-[44px] touch-manipulation"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Agregar
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-2 border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5F1ED] min-h-[44px] touch-manipulation md:w-auto w-full"
        >
          <Link href={`/products/${product.slug}`} className="flex items-center justify-center">
            <Eye className="h-4 w-4 md:mr-0 mr-2" />
            <span className="md:hidden">Ver detalles</span>
          </Link>
        </Button>
      </div>
    </div>
  )
}

function ProductPage({ product, onAddToCart, isMobile = false }: ProductPageProps) {
  return (
    <div 
      className={cn(
        "bg-gradient-to-br from-white to-[#FBF8F4] flex flex-col",
        isMobile ? "p-4 md:p-6" : "border-r border-[#E1D5C8] p-6 md:p-8"
      )}
      style={{ 
        height: '100%', 
        minHeight: '100%',
        maxHeight: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div className="flex-1 space-y-2 md:space-y-3 overflow-hidden flex flex-col min-h-0">
        {/* Imagen - Responsive */}
        <div className={cn(
          "relative w-full rounded-xl overflow-hidden border-2 border-[#E1D5C8] bg-white flex-shrink-0",
          isMobile ? "h-40 md:h-48" : "h-48 md:h-56"
        )}>
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes={isMobile ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 50vw"}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F5F1ED] to-[#E1D5C8] flex items-center justify-center">
              <BookOpen className={cn(
                "text-[#8B6F47] opacity-50",
                isMobile ? "h-12 w-12" : "h-16 w-16"
              )} />
            </div>
          )}
          {product.category && (
            <Badge className="absolute top-2 left-2 md:top-3 md:left-3 bg-white/90 text-[#5C4033] backdrop-blur-sm text-xs">
              {product.category.name}
            </Badge>
          )}
        </div>

        {/* Información - Responsive */}
        <div className="space-y-1.5 md:space-y-2 flex-1 min-h-0 overflow-hidden flex flex-col">
          <h3 className={cn(
            "font-bold text-[#3D2817] line-clamp-2 flex-shrink-0",
            isMobile ? "text-base md:text-lg" : "text-lg md:text-xl"
          )}>
            {product.name}
          </h3>

          {product.description && (
            <p className={cn(
              "text-[#6B5D52] line-clamp-2 flex-shrink-0",
              isMobile ? "text-xs" : "text-xs md:text-sm"
            )}>
              {product.description}
            </p>
          )}

          {/* Rating - Responsive */}
          <div className="flex items-center gap-1.5 flex-wrap flex-shrink-0">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300",
                    isMobile ? "h-3 w-3" : "h-3.5 w-3.5"
                  )}
                />
              ))}
            </div>
            <span className={cn(
              "text-[#6B5D52]",
              isMobile ? "text-xs" : "text-xs"
            )}>
              {product.rating.toFixed(1)} ({product.reviews_count})
            </span>
          </div>

          {/* Precio - Responsive */}
          <div className="flex items-baseline gap-2 flex-shrink-0">
            <span className={cn(
              "font-bold text-[#5C4033]",
              isMobile ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
            )}>
              ${product.price.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Stock - Responsive */}
          <div className={cn("flex-shrink-0", isMobile ? "text-xs" : "text-xs")}>
            {product.stock_quantity > 0 ? (
              <span className="text-green-600 font-medium">
                {product.stock_quantity} disponibles
              </span>
            ) : (
              <span className="text-red-600 font-medium">Agotado</span>
            )}
          </div>
        </div>
      </div>

      {/* Acciones - Responsive con mejor touch */}
      <div className={cn(
        "flex gap-2 mt-auto pt-3 border-t border-[#E1D5C8] flex-shrink-0",
        isMobile && "flex-col"
      )}>
        <Button
          onClick={() => onAddToCart(product.id, product.name)}
          disabled={product.stock_quantity === 0}
          className={cn(
            "bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10] touch-manipulation",
            isMobile ? "w-full min-h-[44px]" : "flex-1"
          )}
        >
          <ShoppingCart className={cn("mr-2", isMobile ? "h-4 w-4" : "h-4 w-4")} />
          Agregar
        </Button>
        <Button
          asChild
          variant="outline"
          className={cn(
            "border-2 border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5F1ED] touch-manipulation",
            isMobile ? "w-full min-h-[44px]" : ""
          )}
        >
          <Link href={`/products/${product.slug}`} className="flex items-center justify-center">
            <Eye className={cn(isMobile ? "h-4 w-4 mr-2" : "h-4 w-4")} />
            {isMobile && <span>Ver detalles</span>}
          </Link>
        </Button>
      </div>
    </div>
  )
}

