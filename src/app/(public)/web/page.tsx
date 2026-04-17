// src/app/(public)/web/page.tsx

import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Inicio — Estudio Jurídico Laboral en Córdoba",
  description:
    "Azar & Asociados: estudio jurídico familiar en Córdoba especializado en accidentes de trabajo, despidos y reclamos a aseguradoras. Consulta gratuita.",
  alternates: { canonical: "/web" },
}

export default function InicioPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[28rem] md:h-[32rem] flex items-center bg-white border-t-8 border-[#d2c7b5] overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/sitio-web/equipo.png"
            alt="Equipo del estudio jurídico Azar & Asociados trabajando"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="container mx-auto px-6 md:px-12 relative z-10">
          <h1 className="text-3xl md:text-5xl font-normal text-white drop-shadow-lg">
            Conózcanos
          </h1>
          <div className="mt-6">
            <Link
              href="/web/nosotros"
              className="inline-block px-6 py-2.5 border-2 border-white text-white font-medium hover:bg-white hover:text-black transition-colors drop-shadow-lg"
            >
              Más información
            </Link>
          </div>
        </div>
      </section>

      {/* Título principal — H2 para SEO */}
      <section className="py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-light text-black max-w-2xl mx-auto leading-relaxed">
          Estudio familiar especialista en accidentes de trabajo
        </h2>
        <p className="text-gray-500 mt-4 max-w-lg mx-auto">
          Defendemos sus derechos con compromiso, experiencia y trato humano.
        </p>
      </section>

      {/* Servicios */}
      <section className="container mx-auto px-6 md:px-12 pb-20" aria-label="Áreas de práctica">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              src: "/sitio-web/accidente.jpg",
              alt: "Accidentes laborales — reclamos por incapacidad",
              titulo: "Accidentes laborales, determinación de incapacidades y comisiones médicas",
            },
            {
              src: "/sitio-web/choque.webp",
              alt: "Accidentes de tránsito — reclamos a aseguradoras",
              titulo: "Reclamos a aseguradoras por accidentes de tránsito",
            },
            {
              src: "/sitio-web/recorte.jpg",
              alt: "Despidos injustificados — defensa del trabajador",
              titulo: "Abogados laboralistas especialistas en despidos",
            },
          ].map((item, i) => (
            <article
              key={i}
              className="group h-64 relative overflow-hidden cursor-pointer rounded-sm shadow-md"
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-[#5e1916]/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-6">
                <p className="text-white text-xl font-serif italic text-center">
                  {item.titulo}
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-[#f9f7f2] py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-serif text-[#5e1916] mb-4">
          ¿Necesita asesoramiento legal?
        </h2>
        <p className="text-gray-600 mb-8 max-w-md mx-auto">
          Contáctenos sin compromiso. Evaluamos su caso de forma gratuita.
        </p>
        <Link
          href="/web/contacto"
          className="inline-block bg-[#5e1916] text-white px-10 py-3 font-medium hover:bg-black transition-colors shadow-md"
        >
          Solicitar consulta
        </Link>
      </section>
    </>
  )
}