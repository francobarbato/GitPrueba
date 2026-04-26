// src/app/(public)/web/nosotros/page.tsx

import Image from "next/image"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Nosotros — Nuestra Historia",
  description:
    "Conozca al equipo de Azar & Asociados. Estudio jurídico familiar en Córdoba con años de trayectoria en derecho laboral, accidentes de trabajo y despidos.",
  alternates: { canonical: "/web/nosotros" },
}

export default function NosotrosPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[60vh] md:h-[70vh] w-full flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/sitio-web/nosotros.png"
            alt="Interior del estudio jurídico Azar & Asociados"
            fill
            className="object-cover brightness-[0.4]"
            priority
            sizes="100vw"
          />
        </div>
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <h1 className="text-white text-4xl md:text-6xl font-serif mb-6 drop-shadow-lg">
            Nuestra Historia
          </h1>
          <p className="text-[#e3dac9] text-lg md:text-2xl font-light italic drop-shadow-md">
            Compromiso, familia y excelencia jurídica al servicio de sus derechos.
          </p>
        </div>
      </section>

      {/* Descripción */}
      <section className="container mx-auto px-6 md:px-12 py-20" aria-label="Sobre el estudio">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-serif text-[#5e1916] border-b-2 border-[#e3dac9] pb-4 inline-block">
              Sobre Azar & Asociados
            </h2>
            <p className="text-gray-800 text-lg leading-relaxed text-justify">
              Fundado con la visión de brindar un trato humano y personalizado, nuestro estudio
              jurídico familiar se ha especializado en la defensa integral de los trabajadores.
              Entendemos que detrás de cada caso de accidente laboral o despido hay una persona
              y una familia que busca justicia.
            </p>
            <p className="text-gray-800 text-lg leading-relaxed text-justify">
              Con años de trayectoria en el fuero laboral, nuestro equipo combina la
              experiencia técnica con la calidez de una estructura familiar, asegurando que
              cada cliente reciba la atención y el respeto que su situación merece.
            </p>
          </div>
          <div className="relative h-[400px] border-l-8 border-[#e3dac9] pl-8">
            <div className="relative h-full w-full bg-gray-100 shadow-2xl">
              <Image
                src="/sitio-web/azar3.png"
                alt="Logo de Azar & Asociados"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Valores */}
      <section className="bg-[#f9f7f2] py-16" aria-label="Nuestros valores">
        <div className="container mx-auto px-6 md:px-12">
          <h2 className="text-3xl font-serif text-[#5e1916] text-center mb-12">
            Nuestros Valores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                titulo: "Compromiso",
                desc: "Nos involucramos en cada caso como si fuera propio. Su tranquilidad es nuestra prioridad.",
              },
              {
                titulo: "Transparencia",
                desc: "Comunicación clara y honesta en cada etapa del proceso. Sin sorpresas ni costos ocultos.",
              },
              {
                titulo: "Experiencia",
                desc: "Años de trayectoria en el fuero laboral nos respaldan para defender sus derechos con solidez.",
              },
            ].map((valor, i) => (
              <div key={i} className="bg-white p-8 shadow-md border-t-4 border-[#5e1916]">
                <h3 className="text-xl font-serif text-[#5e1916] mb-3">{valor.titulo}</h3>
                <p className="text-gray-700 leading-relaxed">{valor.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}