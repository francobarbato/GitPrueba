import { WorkloadTable } from "./components/WorkloadTable"
import { InactivityAlerts } from "./components/InactivityAlerts"
import { RiskMatrix } from "./components/RiskMatrix"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import prisma from "src/lib/db/prisma"
import { subDays, differenceInDays } from "date-fns"

async function getCargaTrabajo() {
  const abogados = await prisma.user.findMany({
    where: { rol: "ABOGADO", isActive: true },
    include: {
      casos: {
        select: { estado: true, priority: true, updatedAt: true },
      },
    },
  })

  return abogados.map((abogado) => {
    const total = abogado.casos.length
    const casosActivos = abogado.casos.filter((c) => c.estado !== "Cerrado" && c.estado !== "Archivado")
    const cantidadActivos = casosActivos.length
    const cerrados = total - cantidadActivos
    const casosUrgentes = casosActivos.filter((c) => c.priority === "HIGH").length

    let estadoCarga = "Disponible"
    if (cantidadActivos >= 8) estadoCarga = "Ocupado"
    if (cantidadActivos >= 15) estadoCarga = "Saturado"
    if (casosUrgentes >= 3) estadoCarga = "Sobrecargado"

    const eficiencia = total > 0 ? Math.round((cerrados / total) * 100) : 0

    return {
      id: abogado.id,
      nombre: abogado.nombre ? `${abogado.nombre} ${abogado.apellido}` : abogado.name || "Sin Nombre",
      email: abogado.email,
      activos: cantidadActivos,
      enProceso: casosUrgentes,
      eficiencia,
      estadoCarga,
    }
  })
}

async function getMatrizRiesgos(userId?: string, esAdmin = true) {
  const whereUser = esAdmin ? {} : { abogadoId: userId }

  const casos = await prisma.caso.findMany({
    where: {
      ...whereUser,
      NOT: { estado: { in: ["Cerrado", "Archivado"] } },
    },
    select: {
      id: true,
      numero: true,
      titulo: true,
      priority: true,
      updatedAt: true,
      cliente: { select: { nombre: true, apellido: true } },
      requirements: {
        where: { isCompleted: false },
        orderBy: { dueDate: "asc" },
      },
    },
  })

  const resultados = casos.map((c) => {
    const diasInactivo = differenceInDays(new Date(), c.updatedAt)
    const proximoVencimiento = c.requirements.find((r) => r.dueDate !== null)
    let hayBombaInminente = false

    if (proximoVencimiento && proximoVencimiento.dueDate) {
      const hoy = new Date()
      const fechaVenc = new Date(proximoVencimiento.dueDate)
      const diasParaVencer = differenceInDays(fechaVenc, hoy)
      if (diasParaVencer <= 3) hayBombaInminente = true
    }

    let estadoRiesgo = "Al día"
    if (hayBombaInminente) estadoRiesgo = "Crítico"
    else if (diasInactivo > 45) estadoRiesgo = "Crítico"
    else if (c.priority === "HIGH" && diasInactivo > 20) estadoRiesgo = "Crítico"
    else if (diasInactivo > 15) estadoRiesgo = "Atención"

    return {
      id: c.id,
      expediente: c.numero,
      caratula: c.titulo,
      cliente: c.cliente ? `${c.cliente.nombre} ${c.cliente.apellido}` : "S/C",
      complejidad: c.priority === "HIGH" ? "Alta" : c.priority === "LOW" ? "Baja" : "Media",
      ultimoMovimiento: c.updatedAt.toLocaleDateString("es-ES"),
      diasInactivo,
      estado: estadoRiesgo,
      pesoOrden: estadoRiesgo === "Crítico" ? 3 : estadoRiesgo === "Atención" ? 2 : 1,
    }
  })

  return resultados.sort((a, b) => b.pesoOrden - a.pesoOrden || b.diasInactivo - a.diasInactivo).slice(0, 10)
}

async function getAlertasUnificadas(userId?: string, esAdmin = true) {
  const whereUser = esAdmin ? {} : { abogadoId: userId }
  const whereUserCaso = esAdmin ? {} : { caso: { abogadoId: userId } }
  const hoy = new Date()

  const fechaLimite = new Date()
  fechaLimite.setDate(hoy.getDate() + 7)

  const checklistItems = await prisma.requirement.findMany({
    where: {
      ...whereUserCaso,
      isCompleted: false,
      dueDate: { lte: fechaLimite },
    },
    include: {
      caso: {
        include: { abogado: true },
      },
    },
  })

  const casosZombies = await prisma.caso.findMany({
    where: {
      ...whereUser,
      updatedAt: { lt: subDays(hoy, 120) },
      estado: { notIn: ["Cerrado", "Archivado"] },
    },
    include: { abogado: true },
    take: 3,
  })

  const listaCombinada = [
    ...checklistItems.map((r) => {
      const diasDiferencia = differenceInDays(r.dueDate!, hoy)
      const esVencido = diasDiferencia < 0
      const esCasoUrgente = r.caso.priority === "HIGH"

      let score = 0
      let gravedad = "Baja"
      let tipo = "Pendiente"

      if (esVencido) {
        score = 100 + Math.abs(diasDiferencia)
        gravedad = "Critico"
        tipo = "Vencido"
      } else if (diasDiferencia <= 1) {
        score = 80 + (esCasoUrgente ? 10 : 0)
        gravedad = "Critico"
        tipo = "Urgente"
      } else {
        score = 50 + (esCasoUrgente ? 10 : 0) - diasDiferencia
        gravedad = "Preventivo"
        tipo = "Próximo"
      }

      return {
        id: `req-${r.id}`,
        abogado: r.caso.abogado.nombre || "S/A",
        mensaje: r.description,
        subtitulo: `Caso: ${r.caso.titulo} (${r.caso.priority})`,
        tiempo: esVencido ? `Venció hace ${Math.abs(diasDiferencia)} días` : `Vence en ${diasDiferencia} días`,
        gravedad,
        tipo,
        score,
        link: `/casos/${r.caso.id}`,
      }
    }),
    ...casosZombies.map((c) => ({
      id: `zombie-${c.id}`,
      abogado: c.abogado.nombre || "S/A",
      mensaje: `Revisar Expediente Abandonado`,
      subtitulo: `Caso: ${c.titulo}`,
      tiempo: "+4 meses inactivo",
      gravedad: "Preventivo",
      tipo: "Abandono",
      score: 20 + (c.priority === "HIGH" ? 5 : 0),
      link: `/casos/${c.id}`,
    })),
  ]

  return listaCombinada.sort((a, b) => b.score - a.score).slice(0, 6)
}

export default async function CargaTrabajoPage() {
  const esAdmin = true

  const [cargaData, riesgosData, alertasData] = await Promise.all([
    getCargaTrabajo(),
    getMatrizRiesgos(undefined, esAdmin),
    getAlertasUnificadas(undefined, esAdmin),
  ])

  return (
    <div className="flex h-screen bg-slate-50">
      <div className="flex flex-col flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-8">
          <div className="mb-6 flex justify-between items-center">
            <Link href="/reportes">
              <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 pl-0 gap-2">
                <ArrowLeft className="w-4 h-4" />
                Volver al Tablero Principal
              </Button>
            </Link>

            <span
              className={`text-xs font-medium px-3 py-1 rounded-full border ${
                esAdmin ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"
              }`}
            >
              {esAdmin ? "Vista Gerencial (Todos los casos)" : "Vista Operativa (Mis casos)"}
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
              {esAdmin ? "Balance y Asignación Global" : "Mi Balance y Prioridades"}
            </h1>
            <p className="text-slate-600 max-w-3xl">
              {esAdmin
                ? "Herramienta gerencial para visualizar la carga de todo el equipo y detectar riesgos globales."
                : "Herramienta operativa para gestionar tus prioridades del día y evitar vencimientos en tus expedientes."}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-6">
              <WorkloadTable data={cargaData} />
              <RiskMatrix data={riesgosData} />
            </div>

            <div className="xl:col-span-1 space-y-6">
              <InactivityAlerts data={alertasData} />

              {esAdmin ? (
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-sm text-purple-800">
                  <strong>Consejo Gerencial:</strong>
                  <p className="mt-1 text-purple-700/80">
                    Revise la carga de los abogados en "Rojo" antes de asignar nuevos clientes esta semana.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                  <strong>Consejo Operativo:</strong>
                  <p className="mt-1 text-blue-700/80">
                    Priorice resolver las alertas críticas (Rojo) hoy mismo para mantener su índice de eficiencia alto.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
