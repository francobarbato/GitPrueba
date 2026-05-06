'use server'

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { CasoService } from "@/lib/aplication/services/caso.service"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma" 
import { Priority, TipoCaso } from "@prisma/client"
import { registrarAuditoria } from "../../lib/actions/auditoria"

const casoService = new CasoService()

export type State = {
  error?: string | null
  message?: string | null
}

// ============================================================================
// TIPOS DE CASO VÁLIDOS (Actualizado)
// ============================================================================
const TIPOS_CASO_VALIDOS = [
  "LABORAL", 
  "CIVIL_COMERCIAL",
  "FAMILIA", 
  "PENAL", 
  "SUCESIONES", 
  "CONTENCIOSO_ADMINISTRATIVO", 
  "OTRO",
]

// ============================================================================
// 1. CREAR CASO (CON SOPORTE PARA ASISTENTE)
// ============================================================================
export async function crearCasoAction(prevState: State, formData: FormData): Promise<State> {
  const user = await getUserSessionServer()
  
  if (!user || !user.id) {
    return { error: "No autorizado. Debes iniciar sesión." }
  }

  const userRol = user.rol?.toUpperCase()

  if (userRol === 'ADMIN') {
  return { error: "El administrador no puede crear casos." }
  }
  // 1. Parsear Checklist
  const requirementsRaw = formData.get("requirements") as string
  let requirementsData = []
  try {
    if (requirementsRaw) {
      requirementsData = JSON.parse(requirementsRaw)
    }
  } catch (e) {
    console.error("Error parseando requisitos", e)
  }

  // 2. Validar Tipo de Caso (ENUM)
  const tipoRaw = formData.get("tipo") as string
  if (!tipoRaw || !TIPOS_CASO_VALIDOS.includes(tipoRaw)) {
    return { error: "El tipo de caso no es válido" }
  }

  // 3. ===== DETERMINAR ABOGADO RESPONSABLE =====
  let abogadoId: string
  
  const abogadoIdFromForm = formData.get("abogadoId") as string

  if (userRol === 'ASISTENTE') {
    // El Asistente DEBE seleccionar un abogado
    if (!abogadoIdFromForm) {
      return { error: "Debes seleccionar un abogado responsable para el caso" }
    }
    abogadoId = abogadoIdFromForm
    
    // Verificar que el abogado seleccionado existe y está activo
    const abogadoExiste = await prisma.user.findFirst({
      where: { 
        id: abogadoId, 
        isActive: true,
        rol: { in: ['ABOGADO'] }
      }
    })
    
    if (!abogadoExiste) {
      return { error: "El abogado seleccionado no es válido" }
    }
  } else if (userRol === 'ADMIN') {
    // El Admin puede elegir cualquier abogado o asignarse a sí mismo
    abogadoId = abogadoIdFromForm || user.id
  } else {
    // El Abogado se asigna automáticamente a sí mismo
    abogadoId = user.id
  }

  // 4. Preparar Datos del Caso
  const dataToCreate = {
    numero: formData.get("numero") as string,
    titulo: formData.get("titulo") as string,
    descripcion: (formData.get("descripcion") as string) || "",
    tipo: tipoRaw as TipoCaso,
    estado: (formData.get("estado") as string) || "Inicio / Demanda",
    provincia: formData.get("provincia") as string | null,
    ciudad: formData.get("ciudad") as string | null,
    
    // Campos jurisdiccionales
    juzgado: formData.get("juzgado") as string | null,
    fuero: formData.get("fuero") as string | null,
    
    // Conflicto de interés
    contraparteNombre: formData.get("contraparte_nombre") as string | null,
    contraparteDni: formData.get("contraparte_dni") as string | null,
    
    // Financiero
    montoDisputa: formData.get("monto_disputa") 
      ? parseFloat(formData.get("monto_disputa") as string) 
      : null,
    
    // Ubicación física
    ubicacionFisica: formData.get("ubicacion_fisica") as string | null,
    
    fechaInicio: new Date().toISOString(),
    clienteId: formData.get("clienteId") as string,
    priority: (formData.get("priority") as Priority) || "NORMAL",
    isFavorite: formData.get("isFavorite") === "on",
    requirements: requirementsData,
    
    // ===== ABOGADO RESPONSABLE =====
    abogadoId: abogadoId
  }

  if (!dataToCreate.numero || !dataToCreate.titulo || !dataToCreate.clienteId) {
    return { error: "Faltan campos obligatorios (Número, Título, Cliente)" }
  }

  try {
    // 5. Verificar conflicto de interés
    if (dataToCreate.contraparteDni) {
      const conflicto = await prisma.cliente.findFirst({
        where: { numeroDocumento: dataToCreate.contraparteDni }
      })
      
      if (conflicto) {
        console.warn(`⚠️ CONFLICTO: La contraparte ${dataToCreate.contraparteDni} es cliente activo`)
      }
    }

    // 6. Crear el caso con el abogadoId correcto
    const nuevoCaso = await casoService.createCaso(dataToCreate, abogadoId)
    
    // 7. REGISTRAR ESTADO INICIAL EN BITÁCORA ⭐ NUEVO
    await prisma.bitacora.create({
      data: {
        casoId: nuevoCaso.id,
        usuarioId: user.id,
        accion: "CREATE",
        estadoNuevo: dataToCreate.estado,
        estadoAnterior: null,
        texto: `Caso creado en estado: ${dataToCreate.estado}`,
        detalle: `Tipo: ${dataToCreate.tipo}, Prioridad: ${dataToCreate.priority}`,
        tipo: "sistema"
      }
    })
    
    // 7. AUDITORÍA AUTOMÁTICA
    const creadoPorTexto = userRol === 'ASISTENTE' 
      ? `Caso creado por Asistente y asignado a abogado`
      : `Caso creado: ${dataToCreate.titulo}`

    await registrarAuditoria({
      casoId: nuevoCaso.id,
      usuarioId: user.id,
      accion: "CREATE",
      texto: creadoPorTexto,
      detalle: `Estado inicial: ${dataToCreate.estado}, Prioridad: ${dataToCreate.priority}, Creado por: ${userRol}`,
      estadoNuevo: dataToCreate.estado
    })

    console.log(`✅ Caso creado: ${nuevoCaso.id} - Abogado: ${abogadoId} - Creado por: ${user.id} (${userRol})`)

  } catch (error: any) {
    console.error("Error en crearCasoAction:", error)
    
    // Manejo genérico de unicidad
    if (error.code === 'P2002') {
      const campo = error.meta?.target?.replace('Caso_', '').replace('_key', '') || 'campo'
      return { error: `Ya existe un caso con ese ${campo}. Verificá el número de expediente.` }
    }
    
    return { error: error.message || "Error al crear el caso" }
  }

  revalidatePath("/casos")
  revalidatePath("/reportes/carga-trabajo")
  redirect("/casos")
}

// ============================================================================
// 2. ACTUALIZAR CASO (CON AUDITORÍA DE CAMBIOS)
// ============================================================================
export async function actualizarCasoAction(prevState: State, formData: FormData): Promise<State> {
  const user = await getUserSessionServer()
  
  if (!user || !user.id) {
    return { error: "No autorizado" }
  }

  const userRol = user.rol?.toUpperCase()

  if (userRol === 'ADMIN') {
  return { error: "El administrador no puede crear casos." }
  }

  // Solo ABOGADO y ASISTENTE pueden editar
  if (!['ABOGADO', 'ASISTENTE'].includes(userRol || '')) {
    return { error: "No tienes permiso para editar expedientes." }
  }

  const casoId = formData.get("id") as string
  if (!casoId) return { error: "ID de caso no válido" }

  // El ABOGADO solo puede editar sus propios casos
  if (userRol === 'ABOGADO') {
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      select: { abogadoId: true }
    })
    if (!caso || caso.abogadoId !== user.id) {
      return { error: "No puedes editar un caso que no te pertenece." }
    }
  }

  // 1. Parsear Checklist
  const requirementsRaw = formData.get("requirements") as string
  let requirementsData = []
  try {
    if (requirementsRaw) {
      requirementsData = JSON.parse(requirementsRaw)
    }
  } catch (e) {
    console.error("Error parseando requisitos update", e)
  }

  // 2. Validar Tipo de Caso (incluyendo legacy)
  const tipoRaw = formData.get("tipo") as string
  if (!tipoRaw || !TIPOS_CASO_VALIDOS.includes(tipoRaw)) {
    return { error: "El tipo de caso no es válido" }
  }

  // 3. Validar Prioridad
  const priorityValue = formData.get("priority") as string
  const priorityEnum = (priorityValue && ["HIGH", "NORMAL", "LOW"].includes(priorityValue)) 
                        ? (priorityValue as Priority) 
                        : Priority.NORMAL

  // 4. Lógica de fechas automáticas
  const nuevoEstado = formData.get("estado") as string
  let fechaFin = null
  if (["Terminado", "Archivado"].includes(nuevoEstado)) {
    fechaFin = new Date()
  }

// 5. Obtener caso actual PRIMERO (antes de armar rawData)
const casoActual = await prisma.caso.findUnique({
  where: { id: casoId },
  select: { 
    estado: true, 
    priority: true, 
    clienteId: true,
    titulo: true,
    fuero: true,
    numero: true,
    tipo: true,
    montoDisputa: true,
    juzgado: true,
    provincia: true,
    ciudad: true,
  }
})

if (!casoActual) return { error: "Caso no encontrado" }

// Campos con justificación — solo se actualizan si vienen con motivo

const motivoJuzgado = formData.get("motivo_juzgado") as string | null
const motivoUbicacion = formData.get("motivo_ubicacion") as string | null
const motivoMonto = formData.get("motivo_monto") as string | null

const nuevoJuzgado = formData.get("juzgado") as string | null
const nuevaUbicacion = {
  fuero: formData.get("fuero") as string | null,
  provincia: formData.get("provincia") as string | null,
  ciudad: formData.get("ciudad") as string | null,
}
const nuevoMonto = formData.get("monto_disputa") 
  ? parseFloat(formData.get("monto_disputa") as string) 
  : null

// 6. Preparar datos — inmutables vienen de BD, libres del form
const rawData = {
  // INMUTABLES — de BD
  numero: casoActual.numero,
  tipo: casoActual.tipo,
  cliente: { connect: { id: casoActual.clienteId } },
  // LIBRES — del form
  titulo: formData.get("titulo") as string,
  descripcion: (formData.get("descripcion") as string) || "",
  estado: nuevoEstado,
  fechaFin: fechaFin,
  contraparteNombre: formData.get("contraparte_nombre") as string | null,
  contraparteDni: formData.get("contraparte_dni") as string | null,
  ubicacionFisica: formData.get("ubicacion_fisica") as string | null,
  priority: priorityEnum,
  isFavorite: formData.get("isFavorite") === "on",

  juzgado: motivoJuzgado?.trim() ? nuevoJuzgado : casoActual.juzgado,
  fuero: motivoUbicacion?.trim() ? nuevaUbicacion.fuero : casoActual.fuero,
  provincia: motivoUbicacion?.trim() ? nuevaUbicacion.provincia : casoActual.provincia,
  ciudad: motivoUbicacion?.trim() ? nuevaUbicacion.ciudad : casoActual.ciudad,
  montoDisputa: motivoMonto?.trim() ? nuevoMonto : casoActual.montoDisputa,
}

try {
  const cambioEstado = casoActual.estado !== nuevoEstado

  // Actualizar el caso
  await prisma.caso.update({
    where: { id: casoId },
    data: {
      ...rawData,
      ...(cambioEstado && { fechaUltimoCambioEstado: new Date() }),
      requirements: {
        deleteMany: {},
        create: requirementsData.map((req: any) => ({
          description: req.description,
          dueDate: req.dueDate ? new Date(req.dueDate) : null,
          isCompleted: req.isCompleted || false
        }))
      }
    }
  })

  // AUDITORÍA
  const cambios = []

    // Cambio de estado
if (cambioEstado) {
  await registrarAuditoria({
    casoId: casoId,
    usuarioId: user.id,
    accion: "ESTADO_CHANGE",
    texto: `Cambio de estado: ${casoActual.estado} → ${nuevoEstado}`,
    estadoAnterior: casoActual.estado,
    estadoNuevo: nuevoEstado
  })
}

    // Cambio de prioridad
    if (casoActual.priority !== priorityEnum) {
      cambios.push(`Prioridad: ${casoActual.priority} → ${priorityEnum}`)
      
      await registrarAuditoria({
        casoId: casoId,
        usuarioId: user.id,
        accion: "PRIORIDAD_CHANGE",
        texto: `Cambio de prioridad: ${casoActual.priority} → ${priorityEnum}`,
        detalle: `Nuevo estado: ${nuevoEstado}`
      })
    }

    // Cambio de fuero/ubicación
    if (casoActual.fuero !== rawData.fuero && rawData.fuero) {
      cambios.push(`Ubicación: ${casoActual.fuero || 'Sin definir'} → ${rawData.fuero}`)
    }

      if (motivoJuzgado?.trim() && nuevoJuzgado !== casoActual.juzgado) {
    await registrarAuditoria({
      casoId,
      usuarioId: user.id,
      accion: "JUZGADO_CHANGE",
      texto: `Juzgado modificado: "${casoActual.juzgado || 'Sin especificar'}" → "${nuevoJuzgado}"`,
      detalle: `Motivo: ${motivoJuzgado}`
    })
  }

  if (motivoUbicacion?.trim() && nuevaUbicacion.fuero !== casoActual.fuero) {
    await registrarAuditoria({
      casoId,
      usuarioId: user.id,
      accion: "UBICACION_CHANGE",
      texto: `Ubicación modificada: "${casoActual.fuero || 'Sin especificar'}" → "${nuevaUbicacion.fuero}"`,
      detalle: `Motivo: ${motivoUbicacion}`
    })
  }

  if (motivoMonto?.trim() && nuevoMonto !== Number(casoActual.montoDisputa)) {
    await registrarAuditoria({
      casoId,
      usuarioId: user.id,
      accion: "MONTO_CHANGE",
      texto: `Monto modificado: $${casoActual.montoDisputa || 0} → $${nuevoMonto}`,
      detalle: `Motivo: ${motivoMonto}`
    })
  }

    // Registro general (si hubo cambios)
    if (cambios.length > 0) {
      await registrarAuditoria({
        casoId: casoId,
        usuarioId: user.id,
        accion: "UPDATE",
        texto: `Caso actualizado: ${cambios.join(", ")}`,
        detalle: `Total de cambios: ${cambios.length}`
      })
    }

    } catch (error: any) {
      console.error("Error en crearCasoAction:", error)
      
      // Manejo genérico de unicidad
      if (error.code === 'P2002') {
        const campo = error.meta?.target?.replace('Caso_', '').replace('_key', '') || 'campo'
        return { error: `Ya existe un caso con ese ${campo}. Verificá el número de expediente.` }
      }
      
      return { error: error.message || "Error al crear el caso" }
    }

  revalidatePath("/casos")
  revalidatePath(`/casos/${casoId}`)
  revalidatePath("/reportes/carga-trabajo")
  redirect(`/casos/${casoId}`)
}

// ============================================================================
// 3. ACCIONES DE TAREAS
// ============================================================================


// ============================================================================
// 4. ACCIONES DE BITÁCORA
// ============================================================================
export async function crearBitacoraAction(prevState: State, formData: FormData): Promise<State> {
  const user = await getUserSessionServer()
  if (!user || !user.id) return { error: "No autorizado" }

  const casoId = formData.get("casoId") as string
  const texto = formData.get("texto") as string

  if (!casoId || !texto) return { error: "El texto no puede estar vacío" }

  try {
    await prisma.bitacora.create({
      data: {
        texto,
        tipo: "manual",
        accion: "Nota",
        usuarioId: user.id,
        casoId: casoId,
        detalle: "Nota manual del usuario"
      }
    })
  } catch (error) {
    return { error: "Error al guardar la nota" }
  }

  revalidatePath(`/casos/${casoId}`)
  return { message: "Nota guardada" }
}
