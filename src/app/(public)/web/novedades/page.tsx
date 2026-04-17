// src/app/(public)/web/novedades/page.tsx

import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Novedades Jurídicas",
  description:
    "Últimas noticias y novedades del ámbito jurídico y laboral en Argentina. Fallos, jurisprudencia y actualidad legal.",
  alternates: { canonical: "/web/novedades" },
}

export default async function NovedadesPage() {
  const apiKey = process.env.NEWS_API_KEY

  let noticias: any[] = []

  if (apiKey) {
    try {
      const busqueda = encodeURIComponent(
        'Argentina AND ("Corte Suprema" OR "fallo judicial" OR "juzgado" OR "derecho laboral" OR "Cámara de Apelaciones" OR "ley de contrato de trabajo" OR "jurisprudencia")'
      )
      const url = `https://newsapi.org/v2/everything?q=${busqueda}&language=es&sortBy=publishedAt&apiKey=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 3600 } })

      if (res.ok) {
        const data = await res.json()
        const todasLasNoticias = data.articles || []

        const palabrasLegales = [
          "juez", "juzgado", "corte", "fallo", "ley", "laboral", "despido",
          "accidente", "jurídico", "abogado", "cámara", "justicia", "fiscal",
        ]

        noticias = todasLasNoticias
          .filter((noticia: any) => {
            if (!noticia.title || !noticia.description) return false
            const texto = (noticia.title + " " + noticia.description).toLowerCase()
            return palabrasLegales.some((p) => texto.includes(p))
          })
          .slice(0, 6)
      }
    } catch (error) {
      console.error("Error fetching noticias:", error)
    }
  }

  return (
    <section className="min-h-screen bg-[#f9f7f2] py-16">
      <div className="container mx-auto px-6 md:px-12">
        <h1 className="text-4xl font-serif text-[#5e1916] mb-4 border-b border-[#e3dac9] pb-4">
          Actualidad Jurídica
        </h1>
        <p className="text-gray-600 mb-10">
          Noticias relevantes del ámbito legal y laboral en Argentina.
        </p>

        {noticias.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">
              No hay novedades jurídicas relevantes en este momento.
            </p>
            <p className="text-gray-400 text-sm mt-2">Vuelva a consultar más tarde.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {noticias.map((noticia: any, index: number) => (
              <article
                key={index}
                className="bg-white shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
              >
                <div className="relative h-48 bg-gray-200">
                  {noticia.urlToImage ? (
                    <img
                      src={noticia.urlToImage}
                      alt={noticia.title}
                      className="object-cover w-full h-full"
                      loading="lazy"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 font-medium bg-gray-100">
                      Noticia Legal
                    </div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <p className="text-sm text-gray-500 mb-2 font-medium">
                    <time dateTime={noticia.publishedAt}>
                      {new Date(noticia.publishedAt).toLocaleDateString("es-AR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </time>{" "}
                    • {noticia.source.name}
                  </p>
                  <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                    {noticia.title}
                  </h2>
                  <p className="text-gray-700 text-sm mb-4 line-clamp-3 flex-1">
                    {noticia.description}
                  </p>
                  <a
                    href={noticia.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#5e1916] font-semibold hover:underline mt-auto"
                  >
                    Leer artículo completo →
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}