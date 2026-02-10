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
  "CIVIL_COMERCIAL",  // Nuevo unificado
  "FAMILIA", 
  "PENAL", 
  "SUCESIONES", 
  "CONTENCIOSO_ADMINISTRATIVO",  // Nuevo
  "OTRO",
  "CIVIL",
  "COMERCIAL"
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
        rol: { in: ['ABOGADO', 'ADMIN'] }
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

  // ===== VERIFICAR QUE ASISTENTE NO PUEDA EDITAR =====
  if (userRol === 'ASISTENTE') {
    return { error: "No tienes permiso para editar casos. Contacta al abogado responsable." }
  }

  const casoId = formData.get("id") as string
  if (!casoId) return { error: "ID de caso no válido" }

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

  // 5. Preparar datos actualizados
  const rawData = {
    numero: formData.get("numero") as string,
    titulo: formData.get("titulo") as string,
    descripcion: (formData.get("descripcion") as string) || "",
    tipo: tipoRaw as TipoCaso,
    clienteId: formData.get("clienteId") as string,
    estado: nuevoEstado,
    fechaFin: fechaFin, 
    juzgado: formData.get("juzgado") as string | null,
    fuero: formData.get("fuero") as string | null,
    contraparteNombre: formData.get("contraparte_nombre") as string | null,
    contraparteDni: formData.get("contraparte_dni") as string | null,
    montoDisputa: formData.get("monto_disputa") 
      ? parseFloat(formData.get("monto_disputa") as string) 
      : null,
    ubicacionFisica: formData.get("ubicacion_fisica") as string | null,
    priority: priorityEnum,
    isFavorite: formData.get("isFavorite") === "on",
  }

  try {
    // 6. OBTENER CASO ACTUAL (para comparar cambios)
    const casoActual = await prisma.caso.findUnique({
      where: { id: casoId },
      select: { 
        estado: true, 
        priority: true, 
        clienteId: true,
        titulo: true,
        fuero: true
      }
    })

    if (!casoActual) return { error: "Caso no encontrado" }

    // 7. Actualizar el caso
    await prisma.caso.update({
      where: { id: casoId },
      data: {
        ...rawData,
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

    // 8. AUDITORÍA AUTOMÁTICA (Detectar cambios)
    const cambios = []

    // Cambio de estado
    if (casoActual.estado !== nuevoEstado) {
      cambios.push(`Estado: ${casoActual.estado} → ${nuevoEstado}`)
      
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

    // Cambio de cliente
    if (casoActual.clienteId !== rawData.clienteId) {
      cambios.push("Cliente reasignado")
      
      await registrarAuditoria({
        casoId: casoId,
        usuarioId: user.id,
        accion: "CLIENTE_CHANGE",
        texto: "Cliente del caso fue modificado",
        detalle: `Nuevo cliente ID: ${rawData.clienteId}`
      })
    }

    // Cambio de fuero/ubicación
    if (casoActual.fuero !== rawData.fuero && rawData.fuero) {
      cambios.push(`Ubicación: ${casoActual.fuero || 'Sin definir'} → ${rawData.fuero}`)
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
    console.error("Error actualizando caso:", error)
    return { error: "Error al actualizar el caso" }
  }

  revalidatePath("/casos")
  revalidatePath(`/casos/${casoId}`)
  revalidatePath("/reportes/carga-trabajo")
  redirect(`/casos/${casoId}`)
}

// ============================================================================
// 3. ACCIONES DE TAREAS
// ============================================================================
export async function crearTareaAction(prevState: State, formData: FormData): Promise<State> {
  const user = await getUserSessionServer()
  if (!user || !user.id) return { error: "No autorizado" }

  const casoId = formData.get("casoId") as string
  const titulo = formData.get("titulo") as string
  const fecha = formData.get("fecha") as string
  const prioridad = formData.get("prioridad") as string 
  const fatal = formData.get("fatal") === "on"

  if (!casoId || !titulo) return { error: "Faltan datos obligatorios" }

  try {
    await prisma.tarea.create({
      data: {
        titulo,
        fecha: fecha ? new Date(fecha).toISOString() : null,
        prioridad: prioridad || "Media",
        fatal: fatal,
        completada: false,
        casoId: casoId,
        usuarioId: user.id
      }
    })
    
    await prisma.bitacora.create({
      data: {
        texto: `Nueva tarea agendada: ${titulo}`,
        tipo: "auto",
        accion: "Agenda",
        usuarioId: user.id,
        casoId: casoId,
        detalle: `Prioridad: ${prioridad}`
      }
    })

  } catch (error) {
    console.error("Error creando tarea:", error)
    return { error: "Error al guardar la tarea" }
  }

  revalidatePath(`/casos/${casoId}`)
  revalidatePath("/reportes/carga-trabajo")
  return { message: "Tarea creada" }
}

export async function toggleTareaAction(tareaId: string, completada: boolean, casoId: string) {
  const user = await getUserSessionServer()
  if (!user) return
  
  try {
    await prisma.tarea.update({
      where: { id: tareaId },
      data: { completada: completada }
    })
    revalidatePath(`/casos/${casoId}`)
    revalidatePath("/reportes/carga-trabajo")
  } catch (error) {
    console.error("Error toggle tarea", error)
  }
}

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
