"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import Link from "next/link"
import { ShoppingCart, Star } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface ProductCardProps {
  id: string
  name: string
  slug: string
  price: number
  image_url: string | null
  rating: number
  reviews_count: number
  stock_quantity: number
}

export function ProductCard({ name, slug, price, image_url, rating, reviews_count, stock_quantity }: ProductCardProps) {
  const formattedPrice = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price)

  const roundedRating = Math.round(rating || 0)
  const isOutOfStock = stock_quantity === 0

  return (
    <Card className={cn(
      "group overflow-hidden border border-[#E1D5C8]/80 bg-white/90 backdrop-blur transition-all",
      "hover:border-[#C9A57A] hover:shadow-xl"
    )}>
      <Link href={`/products/${slug}`} className="block">
        <div className="relative">
          <AspectRatio ratio={4 / 3}>
            {image_url ? (
              <Image
                src={image_url}
                alt={name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#F5F1ED] text-sm text-[#8B6F47]">
                Imagen no disponible
              </div>
            )}
          </AspectRatio>
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
          <Badge
            variant={isOutOfStock ? "destructive" : "secondary"}
            className={cn(
              "absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
              isOutOfStock ? "bg-[#C85A54] text-white" : "bg-white/90 text-[#5C4033]"
            )}
          >
            {isOutOfStock ? "Agotado" : "Disponible"}
          </Badge>
        </div>
      </Link>

      <CardContent className="space-y-4 p-5">
        <div className="space-y-2">
          <Link
            href={`/products/${slug}`}
            className="line-clamp-2 text-lg font-semibold text-[#3D2817] transition hover:text-[#5C4033]"
          >
            {name}
          </Link>

          <div className="flex items-center gap-2 text-xs text-[#8B6F47]">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Star
                  key={index}
                  className={cn(
                    "h-3.5 w-3.5 transition",
                    index < roundedRating ? "fill-[#C97D2E] text-[#C97D2E]" : "text-[#E4D8C8]"
                  )}
                />
              ))}
            </div>
            <span>({reviews_count} reseñas)</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-[#5C4033]">{formattedPrice}</div>
          <Badge className="bg-[#F5F1ED] text-[#5C4033] hover:bg-[#E8DFD5]">
            Stock: {stock_quantity}
          </Badge>
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0">
        <Button
          asChild
          className={cn(
            "w-full justify-center gap-2 text-sm font-semibold",
            isOutOfStock
              ? "bg-[#E8DFD5] text-[#5C4033] hover:bg-[#E1D7CA]"
              : "bg-[#5C4033] text-white hover:bg-[#3D2817]"
          )}
          disabled={isOutOfStock}
          variant={isOutOfStock ? "secondary" : "default"}
        >
          <Link href={`/products/${slug}`}>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Ver Detalles
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
