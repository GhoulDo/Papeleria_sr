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
  const flipbookRef = useRef<HTMLDivElement>(null)
  const turnInstanceRef = useRef<any>(null)
  const scriptsLoadedRef = useRef(false)
  const initializationAttemptedRef = useRef(false)

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

          // Cargar CSS de Turn.js (inline para evitar CDN)
          if (!document.getElementById("turnjs-css")) {
            const turnCss = document.createElement("style")
            turnCss.id = "turnjs-css"
            turnCss.textContent = `
              .turn-page-wrapper {
                position: absolute;
                overflow: hidden;
              }
              .turn-page {
                position: relative;
                user-select: none;
                -webkit-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
              }
              .hard {
                background: white;
                box-shadow: inset 0 0 5px #666;
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
            const totalPages = Math.ceil(products.length / 2) + 1

            try {
              // Asegurarse de que el elemento esté en el DOM
              if (!flipbookRef.current.parentElement) {
                console.error("[Catalog] Flipbook element not in DOM")
                setIsLoading(false)
                return
              }

              turnInstanceRef.current = jQueryFinal(flipbookRef.current).turn({
                width: 1000,
                height: 700,
                autoCenter: true,
                pages: totalPages,
                gradients: true,
                elevation: 50,
                duration: 800, // Animación más rápida y fluida
                acceleration: true, // Aceleración de hardware
                display: 'double', // Modo doble página
                when: {
                  turning: function (event: any, page: number) {
                    setCurrentPage(page)
                  },
                  turned: function (event: any, page: number) {
                    setCurrentPage(page)
                  },
                },
              })

              scriptsLoadedRef.current = true
              setTurnLoaded(true)
              setIsLoading(false)
              
              console.log("[Catalog] Turn.js initialized successfully")
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
      console.warn("[Catalog] Timeout loading Turn.js, showing content anyway")
      setIsLoading(false)
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

  const totalPages = Math.ceil(products.length / 2) + 1
  const productsPerPage = 2

  // Si está cargando y no hay productos, mostrar loader
  if (isLoading && products.length === 0) {
    return (
      <div className="flex items-center justify-center h-[700px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#5C4033] mx-auto" />
          <p className="text-[#6B5D52]">Cargando catálogo...</p>
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
    <div className="flex flex-col items-center gap-8">
      {/* Controls */}
      <div className="flex items-center gap-4">
        <Button
          onClick={handlePrevPage}
          disabled={currentPage <= 1}
          variant="outline"
          size="lg"
          className="border-2 border-[#D4C4B0] bg-white hover:bg-[#F5F1ED] text-[#5C4033] disabled:opacity-50"
        >
          <ChevronLeft className="h-5 w-5 mr-2" />
          Anterior
        </Button>

        <div className="px-6 py-2 rounded-full bg-white border-2 border-[#D4C4B0] shadow-sm">
          <span className="text-[#3D2817] font-semibold">
            Página {currentPage} de {totalPages}
          </span>
        </div>

        <Button
          onClick={handleNextPage}
          disabled={currentPage >= totalPages}
          variant="outline"
          size="lg"
          className="border-2 border-[#D4C4B0] bg-white hover:bg-[#F5F1ED] text-[#5C4033] disabled:opacity-50"
        >
          Siguiente
          <ChevronRight className="h-5 w-5 ml-2" />
        </Button>
      </div>

      {/* Flipbook */}
      <div className="relative">
        <div
          ref={flipbookRef}
          id="flipbook"
          className="shadow-2xl"
          style={{
            width: "1000px",
            height: "700px",
            maxWidth: "100%",
            margin: "0 auto",
          }}
        >
          {/* Portada */}
          <div className="hard bg-gradient-to-br from-[#5C4033] to-[#3D2817] text-white flex flex-col items-center justify-center p-12">
            <div className="text-center space-y-6">
              <BookOpen className="h-24 w-24 mx-auto mb-4" />
              <h2 className="text-5xl font-bold mb-4">Catálogo 2025</h2>
              <p className="text-2xl text-white/90 mb-8">Papelería y Variedades S.R</p>
              <div className="w-32 h-1 bg-white/30 mx-auto rounded-full" />
              <p className="text-lg text-white/80 mt-8">
                Descubre nuestra colección completa de productos
              </p>
              <Badge className="bg-white/20 text-white px-6 py-2 text-sm mt-6">
                {products.length} productos disponibles
              </Badge>
            </div>
          </div>

          {/* Páginas de productos */}
          {Array.from({ length: totalPages - 1 }).map((_, pageIndex) => {
            const startIndex = pageIndex * productsPerPage
            const pageProducts = products.slice(startIndex, startIndex + productsPerPage)

            return (
              <div key={pageIndex} className="hard">
                <div className="grid grid-cols-2 h-full">
                  {/* Producto izquierdo */}
                  {pageProducts[0] && (
                    <ProductPage product={pageProducts[0]} onAddToCart={onAddToCart} />
                  )}

                  {/* Producto derecho */}
                  {pageProducts[1] ? (
                    <ProductPage product={pageProducts[1]} onAddToCart={onAddToCart} />
                  ) : (
                    <div className="bg-gradient-to-br from-[#F5F1ED] to-white border-l border-[#E1D5C8] flex items-center justify-center p-8">
                      <div className="text-center space-y-4">
                        <BookOpen className="h-16 w-16 text-[#8B6F47] mx-auto opacity-50" />
                        <p className="text-[#6B5D52] text-lg">Más productos próximamente</p>
                      </div>
                    </div>
                  )}
                </div>
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
}

function ProductCard({ product, onAddToCart }: ProductPageProps) {
  return (
    <div className="bg-gradient-to-br from-white to-[#FBF8F4] border-2 border-[#E1D5C8] rounded-xl p-6 flex flex-col h-full shadow-lg hover:shadow-xl transition-all">
      <div className="flex-1 space-y-4">
        {/* Imagen */}
        <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-[#E1D5C8] bg-white">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F5F1ED] to-[#E1D5C8] flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-[#8B6F47] opacity-50" />
            </div>
          )}
          {product.category && (
            <Badge className="absolute top-3 left-3 bg-white/90 text-[#5C4033] backdrop-blur-sm">
              {product.category.name}
            </Badge>
          )}
        </div>

        {/* Información */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-[#3D2817] line-clamp-2">{product.name}</h3>

          {product.description && (
            <p className="text-sm text-[#6B5D52] line-clamp-3">{product.description}</p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-[#6B5D52]">
              {product.rating.toFixed(1)} ({product.reviews_count} reseñas)
            </span>
          </div>

          {/* Precio */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#5C4033]">
              ${product.price.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Stock */}
          <div className="text-sm">
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

      {/* Acciones */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-[#E1D5C8]">
        <Button
          onClick={() => onAddToCart(product.id, product.name)}
          disabled={product.stock_quantity === 0}
          className="flex-1 bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10]"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Agregar
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-2 border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5F1ED]"
        >
          <Link href={`/products/${product.slug}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

function ProductPage({ product, onAddToCart }: ProductPageProps) {
  return (
    <div className="bg-gradient-to-br from-white to-[#FBF8F4] border-r border-[#E1D5C8] p-8 flex flex-col h-full">
      <div className="flex-1 space-y-4">
        {/* Imagen */}
        <div className="relative w-full h-64 rounded-xl overflow-hidden border-2 border-[#E1D5C8] bg-white">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#F5F1ED] to-[#E1D5C8] flex items-center justify-center">
              <BookOpen className="h-16 w-16 text-[#8B6F47] opacity-50" />
            </div>
          )}
          {product.category && (
            <Badge className="absolute top-3 left-3 bg-white/90 text-[#5C4033] backdrop-blur-sm">
              {product.category.name}
            </Badge>
          )}
        </div>

        {/* Información */}
        <div className="space-y-3">
          <h3 className="text-2xl font-bold text-[#3D2817] line-clamp-2">{product.name}</h3>

          {product.description && (
            <p className="text-sm text-[#6B5D52] line-clamp-3">{product.description}</p>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-4 w-4",
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-[#6B5D52]">
              {product.rating.toFixed(1)} ({product.reviews_count} reseñas)
            </span>
          </div>

          {/* Precio */}
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#5C4033]">
              ${product.price.toLocaleString("es-CO", { minimumFractionDigits: 2 })}
            </span>
          </div>

          {/* Stock */}
          <div className="text-sm">
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

      {/* Acciones */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-[#E1D5C8]">
        <Button
          onClick={() => onAddToCart(product.id, product.name)}
          disabled={product.stock_quantity === 0}
          className="flex-1 bg-gradient-to-r from-[#5C4033] to-[#3D2817] text-white hover:from-[#3D2817] hover:to-[#2A1C10]"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Agregar
        </Button>
        <Button
          asChild
          variant="outline"
          className="border-2 border-[#D4C4B0] text-[#5C4033] hover:bg-[#F5F1ED]"
        >
          <Link href={`/products/${product.slug}`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  )
}

