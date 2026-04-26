'use client'

import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

export function Navbar() {
  const pathname = usePathname()

  const links = [
    { href: "/web", label: "Inicio" },
    { href: "/web/novedades", label: "Novedades" },
    { href: "/web/nosotros", label: "Nosotros" },
    { href: "/web/contacto", label: "Contacto" },
  ]

  return (
    <nav className="relative z-50 flex justify-between items-center px-6 md:px-10 py-4 bg-[#e3dac9] text-[#5e1916]">
      <Link href="/web" className="flex items-center" aria-label="Ir al inicio">
        <div className="relative w-[200px] h-[60px]">
          <Image
            src="/sitio-web/azar3.png"
            alt="Logo Azar & Asociados — Estudio Jurídico"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </Link>
      <div className="hidden md:flex items-center gap-8">
        {links.map((link) => {
          const activo = pathname === link.href || 
            (link.href !== "/web" && pathname.startsWith(link.href))

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-lg font-medium transition-colors underline-offset-4 ${
                activo
                  ? "text-[#5e1916] underline font-semibold"
                  : "text-black hover:text-[#5e1916] hover:underline"
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}