// src/app/(public)/web/layout.tsx

import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Navbar } from "./components/Navbar"

// ============================================================================
// SEO — Metadata global del sitio institucional
// ============================================================================

export const metadata: Metadata = {
  title: {
    default: "Azar & Asociados — Estudio Jurídico en Córdoba",
    template: "%s | Azar & Asociados",
  },
  description:
    "Estudio jurídico familiar en Córdoba, Argentina. Especialistas en accidentes de trabajo, despidos y reclamos laborales. Atención personalizada y compromiso con sus derechos.",
  keywords: [
    "abogado laboral Córdoba",
    "accidente de trabajo",
    "despido injustificado",
    "estudio jurídico Córdoba",
    "abogado laboralista",
    "reclamo laboral",
    "indemnización laboral",
    "Azar y Asociados",
  ],
  authors: [{ name: "Azar & Asociados" }],
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Azar & Asociados",
    title: "Azar & Asociados — Estudio Jurídico en Córdoba",
    description:
      "Especialistas en accidentes de trabajo, despidos y reclamos laborales. Atención personalizada en Córdoba.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

// ============================================================================
// FOOTER
// ============================================================================

function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-400 border-t-4 border-[#5e1916]">
      <div className="container mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h4 className="text-white font-serif text-lg mb-4">Azar & Asociados</h4>
            <p className="text-sm leading-relaxed">
              Estudio jurídico familiar especializado en derecho laboral.
              Compromiso, experiencia y trato humano al servicio de sus derechos.
            </p>
          </div>
          <div>
            <h4 className="text-white font-serif text-lg mb-4">Contacto</h4>
            <address className="not-italic text-sm space-y-2">
              <p>Juan B. Justo 2337 1°B</p>
              <p>Córdoba Capital, Argentina</p>
              <p>
                <a href="tel:+5493512623984" className="hover:text-white transition-colors">
                  +54 9 3512-623984
                </a>
              </p>
            </address>
          </div>
          <div>
            <h4 className="text-white font-serif text-lg mb-4">Horarios</h4>
            <p className="text-sm">Lunes a Viernes</p>
            <p className="text-sm">09:00 a 18:00 hs</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-10 pt-6 text-center text-xs text-gray-500">
          <p>© {new Date().getFullYear()} Azar & Asociados. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

// ============================================================================
// LAYOUT
// ============================================================================

export default function SitioWebLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}