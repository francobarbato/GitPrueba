// src/app/(public)/web/contacto/page.tsx

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contacto — Solicite una consulta",
  description:
    "Contáctese con Azar & Asociados. Estudio jurídico en Córdoba. Consultas gratuitas sobre accidentes de trabajo, despidos y reclamos laborales. Juan B. Justo 2337, Córdoba.",
  alternates: { canonical: "/web/contacto" },
}

// Schema.org structured data para SEO local
function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LegalService",
    name: "Azar & Asociados",
    description: "Estudio jurídico familiar especializado en derecho laboral",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Juan B. Justo 2337 1°B",
      addressLocality: "Córdoba",
      addressRegion: "Córdoba",
      addressCountry: "AR",
    },
    telephone: "+5493512623984",
    openingHours: "Mo-Fr 09:00-18:00",
    areaServed: "Córdoba, Argentina",
    priceRange: "Consulta gratuita",
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default function ContactoPage() {
  return (
    <>
      <JsonLd />

      <section className="min-h-screen bg-white text-black">
        <div className="container mx-auto px-6 md:px-12 py-20 flex flex-col md:flex-row gap-16">
          {/* Formulario */}
          <div className="w-full md:w-1/2">
            <h1 className="text-4xl font-serif text-[#5e1916] mb-4 border-b-2 border-[#e3dac9] pb-4 inline-block">
              Contáctenos
            </h1>
            <p className="mb-8 text-gray-700 text-lg">
              Estamos para asesorarlo en su reclamo. Envíenos su consulta y nos
              comunicaremos a la brevedad.
            </p>

            <form
              action="https://formspree.io/f/xeelygwy"
              method="POST"
              className="space-y-6"
            >
              {/* Honeypot anti-spam */}
              <input
                type="text"
                name="_gotcha"
                style={{ display: "none" }}
                tabIndex={-1}
                autoComplete="off"
              />

              <div>
                <label htmlFor="nombre" className="sr-only">Nombre completo</label>
                <input
                  id="nombre"
                  type="text"
                  name="nombre"
                  placeholder="Nombre completo *"
                  required
                  minLength={3}
                  maxLength={80}
                  className="w-full p-4 bg-[#f9f7f2] border border-[#e3dac9] text-black outline-none focus:border-[#5e1916] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="email" className="sr-only">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Correo electrónico *"
                  required
                  maxLength={100}
                  className="w-full p-4 bg-[#f9f7f2] border border-[#e3dac9] text-black outline-none focus:border-[#5e1916] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="telefono" className="sr-only">Teléfono</label>
                <input
                  id="telefono"
                  type="tel"
                  name="telefono"
                  placeholder="Teléfono (opcional)"
                  maxLength={20}
                  className="w-full p-4 bg-[#f9f7f2] border border-[#e3dac9] text-black outline-none focus:border-[#5e1916] transition-colors"
                />
              </div>

              <div>
                <label htmlFor="mensaje" className="sr-only">Mensaje</label>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  placeholder="Escriba su mensaje aquí... *"
                  rows={5}
                  required
                  minLength={10}
                  maxLength={1000}
                  className="w-full p-4 bg-[#f9f7f2] border border-[#e3dac9] text-black outline-none focus:border-[#5e1916] transition-colors resize-none"
                />
              </div>

              <button
                type="submit"
                className="bg-[#5e1916] text-white px-10 py-4 font-medium hover:bg-black transition duration-300 shadow-md"
              >
                Enviar Consulta
              </button>
            </form>
          </div>

          {/* Info de contacto */}
          <div className="w-full md:w-1/2">
            <div className="bg-[#f9f7f2] p-8 md:p-12 border-t-8 border-[#5e1916] shadow-lg h-full flex flex-col justify-center">
              <h2 className="text-2xl font-serif text-[#5e1916] mb-8">
                Información de Contacto
              </h2>

              <div className="space-y-6 text-gray-800">
                <div>
                  <p className="font-bold text-lg text-black">Oficina Central</p>
                  <p>Juan B. Justo 2337 1°B, Córdoba Capital.</p>
                </div>
                <div>
                  <p className="font-bold text-lg text-black">Teléfono</p>
                  <p>
                    <a
                      href="tel:+5493512623984"
                      className="hover:text-[#5e1916] transition-colors"
                    >
                      +54 9 3512-623984
                    </a>
                  </p>
                </div>
                <div>
                  <p className="font-bold text-lg text-black">Horario de Atención</p>
                  <p>Lunes a Viernes de 09:00 a 18:00 hs.</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-[#e3dac9]">
                <p className="text-sm text-gray-500">
                  La primera consulta es sin cargo. Evaluamos su caso y le informamos
                  sobre sus opciones legales.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}