// app/documentos/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { ExploradorDocumentos } from "./components/ExploradorDocumentos"
import { SelectorAbogado } from "./components/SelectorAbogado"
import prisma from "src/lib/db/prisma"
import Link from "next/link"
import { LayoutDashboard, ChevronRight } from "lucide-react"

// ────────────────────────────────────────────────────────────────────────────
// Filtrado de casos según rol:
//   ABOGADO    → sus propios casos (donde es titular)
//   ASISTENTE  → casos del abogado seleccionado por URL (?abogado=X).
//                Si no eligió abogado todavía, devuelve [] y la page mostrará
//                el SelectorAbogado.
//   ADMIN      → no llega acá (middleware redirige)
// ────────────────────────────────────────────────────────────────────────────
async function obtenerCasos(opts: {
  userId: string
  userRol: string
  abogadoFiltroId: string | null
}) {
  const { userId, userRol, abogadoFiltroId } = opts
  const rol = userRol.toUpperCase()

  let where: any = {}
  if (rol === 'ABOGADO') {
    where = { abogadoId: userId }
  } else if (rol === 'ASISTENTE') {
    if (!abogadoFiltroId) return []
    where = { abogadoId: abogadoFiltroId }
  } else {
    return []
  }

  return await prisma.caso.findMany({
    where,
    select: {
      id: true,
      numero: true,
      titulo: true,
      tipo: true,
      estaCerrado: true,
      cliente: { select: { nombre: true, apellido: true } },
      _count: { select: { documentos: true } }
    },
    orderBy: { updatedAt: 'desc' }
  })
}

async function obtenerAbogadosActivos() {
  return await prisma.user.findMany({
    where: {
      isActive: true,
      rol: 'ABOGADO',
    },
    select: {
      id: true,
      nombre: true,
      apellido: true,
      email: true,
      _count: { select: { casos: true } }
    },
    orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }]
  })
}

export default async function DocumentosPage({
  searchParams
}: {
  searchParams: { abogado?: string; caso?: string }
}) {
  const user = await getUserSessionServer()
  if (!user) redirect("/auth/signin")

  const userRol = user.rol?.toUpperCase() || ''
  // Defensa en profundidad: el middleware ya bloquea, pero por las dudas.
  if (userRol === 'ADMIN' || userRol === 'CLIENTE') redirect("/")

  const esAsistente = userRol === 'ASISTENTE'
  const abogadoFiltroId = esAsistente ? (searchParams.abogado || null) : null
  const mostrarSelectorAbogado = esAsistente && !abogadoFiltroId

  // Carga paralela
  const [casos, abogados, abogadoSeleccionado] = await Promise.all([
    obtenerCasos({ userId: user.id, userRol, abogadoFiltroId }),
    esAsistente ? obtenerAbogadosActivos() : Promise.resolve([]),
    abogadoFiltroId
      ? prisma.user.findUnique({
          where: { id: abogadoFiltroId },
          select: { id: true, nombre: true, apellido: true }
        })
      : Promise.resolve(null),
  ])

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 min-h-0 flex flex-col px-6 pb-6">
          {/* Breadcrumb */}
          <div className="pt-4 flex-shrink-0">
            <nav className="flex items-center gap-1.5 text-sm text-slate-400 mb-4">
              <Link href="/" className="hover:text-slate-700 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-3.5 h-3.5" />
                Inicio
              </Link>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className={abogadoSeleccionado ? "" : "text-slate-600 font-medium"}>
                {abogadoSeleccionado ? (
                  <Link href="/documentos" className="hover:text-slate-700 transition-colors">
                    Documentos
                  </Link>
                ) : (
                  "Documentos"
                )}
              </span>
              {abogadoSeleccionado && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="text-slate-600 font-medium">
                    {abogadoSeleccionado.nombre} {abogadoSeleccionado.apellido}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white flex flex-col">
            {mostrarSelectorAbogado ? (
              <SelectorAbogado abogados={abogados} basePath="/documentos" />
            ) : (
              <ExploradorDocumentos
                casos={casos}
                userId={user.id}
                userRol={user.rol || 'ABOGADO'}
                contextoAsistente={
                  esAsistente && abogadoSeleccionado
                    ? {
                        abogadoId: abogadoSeleccionado.id,
                        abogadoNombre: `${abogadoSeleccionado.nombre ?? ''} ${abogadoSeleccionado.apellido ?? ''}`.trim(),
                        basePath: '/documentos'
                      }
                    : null
                }
                casoInicialId={searchParams.caso || null}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}