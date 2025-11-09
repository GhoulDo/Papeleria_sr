import Image from "next/image"
import Link from "next/link"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <div className="relative w-12 h-12">
        <Image src="/logo.png" alt="Papelería y Variedades S.R" fill className="object-contain" priority />
      </div>
      <div className="hidden sm:flex flex-col">
        <span className="text-sm font-bold text-[#5C4033]">Papelería</span>
        <span className="text-xs text-[#8B6F47] font-semibold">y Variedades S.R</span>
      </div>
    </Link>
  )
}
