'use server'

import { PDFDocument, StandardFonts, PDFFont } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import prisma from "src/lib/db/prisma"
import { getUserSessionServer } from "src/auth/actions/auth-actions"

// ═══════════════════════════════════════════════════════════════════════════
// ACTION DE TELEGRAMAS — versión final
// ═══════════════════════════════════════════════════════════════════════════
//   • CUIT del destinatario: se escribe sin guiones, al imprimir se formatea
//     como XX-XXXXXXXX-X (si tiene 11 dígitos).
//   • Fecha: automática (la del día). El formulario ya no la pide.
//   • Límites: Renuncia/Ausencia 30 palabras, Otro 1568, ARCA 1187 caracteres.
//   • Seguridad: sesión + ownership. Aplanado final.
// ═══════════════════════════════════════════════════════════════════════════

export interface DatosTelegrama {
  casoId: string
  tipoTelegrama: 'renuncia' | 'hasta-30' | 'mas-30' | 'arca' | 'comunicacion-renuncia' | 'ausencia' | 'comunicacion-ausencia-23789' | 'otro' | 'otro-tipo-comunicacion-laboral' | 'comunicacion-ARCA-articulo-11'
  remitenteNombre: string
  remitenteDni: string
  remitenteDomicilio: string
  remitenteLocalidad: string
  remitenteProvincia: string
  remitenteTelefono?: string
  remitenteCp?: string
  destinatarioNombre: string
  destinatarioCuit?: string
  destinatarioDomicilio: string
  destinatarioLocalidad: string
  destinatarioProvincia: string
  destinatarioActividad?: string
  destinatarioCp?: string
  cuerpoTexto: string
}

const TAMANO_FUENTE = 10
const MARGEN_ANCHO = 0.95

type LimiteCuerpo = { unidad: 'palabras' | 'caracteres'; max: number }
type RenglonConfig = { nombre: string; ancho: number }
type CuerpoConfig =
  | { tipo: 'renglones'; renglones: RenglonConfig[]; limite: LimiteCuerpo }
  | { tipo: 'multilinea'; campo: string; limite: LimiteCuerpo }

interface MapeoCampos {
  remitenteNombre?: string
  remitenteDni?: string
  remitenteDomicilio?: string
  remitenteLocalidad?: string
  remitenteProvincia?: string
  remitenteTelefono?: string
  remitenteCp?: string
  destinatarioNombre?: string
  destinatarioCuit?: string
  destinatarioDomicilio?: string
  destinatarioLocalidad?: string
  destinatarioProvincia?: string
  destinatarioActividad?: string
  destinatarioCp?: string
  fecha?: string
  cuerpo: CuerpoConfig
}

const MAPEOS: Record<string, MapeoCampos> = {
  'comunicacion-renuncia.pdf': {
    remitenteNombre: 'Apellido y Nombre REMITENTE',
    remitenteDni: 'N° DNI REMITENTE',
    remitenteDomicilio: 'Domicilio real REMITENTE',
    remitenteLocalidad: 'Localidad REMITENTE',
    remitenteProvincia: 'Provincia REMITENTE',
    remitenteTelefono: 'Teléfono',
    remitenteCp: 'CP REMITENTE',
    destinatarioNombre: 'Apellido y Nombre o Razón Social',
    destinatarioCuit: 'N° CUIT',
    destinatarioDomicilio: 'Domicilio Laboral',
    destinatarioLocalidad: 'Localidad',
    destinatarioProvincia: 'Provincia',
    destinatarioActividad: 'Ramo o actividad principal',
    destinatarioCp: 'CP',
    fecha: 'Fecha',
    cuerpo: {
      tipo: 'renglones',
      limite: { unidad: 'palabras', max: 30 },
      renglones: [
        { nombre: 'Texto cuerpo 1', ancho: 267 },
        { nombre: 'Texto cuerpo 2', ancho: 532 },
        { nombre: 'Texto cuerpo 3', ancho: 262 },
      ],
    },
  },
  'comunicacion-ausencia-23789.pdf': {
    remitenteNombre: 'Apellido y nombre REMITENTE',
    remitenteDni: 'DNI',
    remitenteDomicilio: 'Domicilio real',
    remitenteLocalidad: 'Localidad REMITENTE',
    remitenteProvincia: 'Provincia REMITENTE',
    remitenteTelefono: 'Teléfono',
    remitenteCp: 'CP REMITENTE',
    destinatarioNombre: 'Apellido y nombre o razón social',
    destinatarioCuit: 'N° CUIT',
    destinatarioDomicilio: 'Domicilio laboral',
    destinatarioLocalidad: 'Localidad',
    destinatarioProvincia: 'Provincia',
    destinatarioActividad: 'Ramo o actividad principal',
    destinatarioCp: 'CP',
    fecha: 'Fecha',
    cuerpo: { tipo: 'multilinea', campo: 'Campo de texto', limite: { unidad: 'palabras', max: 30 } },
  },
  'otro-tipo-comunicacion-laboral.pdf': {
    remitenteNombre: 'Apellido y nombre REMITENTE',
    remitenteDni: 'N° DNI REMITENTE',
    remitenteDomicilio: 'Domicilio real',
    remitenteLocalidad: 'Localidad REMITENTE',
    remitenteProvincia: 'Provincia REMITENTE',
    remitenteCp: 'CP REMITENTE',
    destinatarioNombre: 'Apellido y nombre o razón social',
    destinatarioDomicilio: 'Domicilio laboral',
    destinatarioLocalidad: 'Localidad',
    destinatarioProvincia: 'Provincia',
    destinatarioActividad: 'Ramo o actividad principal',
    destinatarioCp: 'CP',
    fecha: 'Fecha',
    cuerpo: { tipo: 'multilinea', campo: 'Campo de texto', limite: { unidad: 'caracteres', max: 1568 } },
  },
  'comunicacion-ARCA-articulo-11.pdf': {
    remitenteNombre: 'Apellido y nombre',
    remitenteDni: 'DNI N',
    remitenteDomicilio: 'Domicilio real',
    remitenteLocalidad: 'Localidd',
    remitenteProvincia: 'Provincia',
    remitenteCp: 'Código Postal',
    fecha: 'Fecha',
    cuerpo: { tipo: 'multilinea', campo: 'Texto8', limite: { unidad: 'caracteres', max: 1187 } },
  },
}

function resolverArchivo(tipo: DatosTelegrama['tipoTelegrama']): string {
  switch (tipo) {
    case 'renuncia':
    case 'comunicacion-renuncia':
      return 'comunicacion-renuncia.pdf'
    case 'ausencia':
    case 'hasta-30':
    case 'comunicacion-ausencia-23789':
      return 'comunicacion-ausencia-23789.pdf'
    case 'otro':
    case 'mas-30':
    case 'otro-tipo-comunicacion-laboral':
      return 'otro-tipo-comunicacion-laboral.pdf'
    case 'arca':
    case 'comunicacion-ARCA-articulo-11':
      return 'comunicacion-ARCA-articulo-11.pdf'
    default:
      return 'comunicacion-renuncia.pdf'
  }
}

function contarPalabras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length
}

function formatearCuit(valor?: string): string {
  if (!valor) return ''
  const soloDigitos = valor.replace(/\D/g, '')
  if (soloDigitos.length === 11) {
    return `${soloDigitos.slice(0, 2)}-${soloDigitos.slice(2, 10)}-${soloDigitos.slice(10)}`
  }
  return valor
}

function validarLimiteCuerpo(texto: string, limite: LimiteCuerpo): string | null {
  if (limite.unidad === 'palabras') {
    const p = contarPalabras(texto)
    if (p > limite.max) {
      return `Este formulario admite hasta ${limite.max} palabras (escribiste ${p}). Recortá ${p - limite.max} palabra(s).`
    }
  } else {
    const c = texto.length
    if (c > limite.max) {
      return `El texto supera el espacio del formulario (máximo ${limite.max} caracteres, escribiste ${c}). Recortá ${c - limite.max} caracteres.`
    }
  }
  return null
}

async function usuarioPuedeAccederCaso(
  casoId: string,
  userId: string,
  rol?: string | null
): Promise<boolean> {
  const rolUpper = rol?.toUpperCase()
 
  // ADMIN no accede a datos legales (es solo técnico).
  if (rolUpper === "ADMIN") return false
 
  const caso = await prisma.caso.findUnique({
    where: { id: casoId },
    select: { abogadoId: true }
  })
  if (!caso) return false
 
  // ASISTENTE tiene acceso general a cualquier expediente del estudio.
  if (rolUpper === "ASISTENTE") return true
 
  // ABOGADO solo accede a sus propios expedientes.
  return caso.abogadoId === userId
}

export async function generarTelegramaPdfAction(datos: DatosTelegrama) {
  try {
    const user = await getUserSessionServer()
    if (!user?.id) return { success: false, error: "No autorizado" }

    const puedeAcceder = await usuarioPuedeAccederCaso(datos.casoId, user.id, user.rol)
    if (!puedeAcceder) return { success: false, error: "No tenés permiso para generar documentos de este expediente" }

    const nombreArchivoPdf = resolverArchivo(datos.tipoTelegrama)
    const mapeo = MAPEOS[nombreArchivoPdf]
    if (!mapeo) return { success: false, error: "No hay mapeo de campos para este tipo de telegrama" }

    if (datos.cuerpoTexto?.trim()) {
      const errorLimite = validarLimiteCuerpo(datos.cuerpoTexto, mapeo.cuerpo.limite)
      if (errorLimite) return { success: false, error: errorLimite }
    }

    const urlsModelos: Record<string, string> = {
      'comunicacion-ARCA-articulo-11.pdf': 'https://cyfouzxlqfgip4ew.public.blob.vercel-storage.com/comunicacion-ARCA-articulo-11.pdf',
      'comunicacion-ausencia-23789.pdf': 'https://cyfouzxlqfgip4ew.public.blob.vercel-storage.com/comunicacion-ausencia-23789.pdf',
      'comunicacion-renuncia.pdf': 'https://cyfouzxlqfgip4ew.public.blob.vercel-storage.com/comunicacion-renuncia.pdf',
      'otro-tipo-comunicacion-laboral.pdf': 'https://cyfouzxlqfgip4ew.public.blob.vercel-storage.com/otro-tipo-comunicacion-laboral.pdf'
    };

    const urlPdf = urlsModelos[nombreArchivoPdf];
    if (!urlPdf) throw new Error("No se encontró el modelo de PDF en la nube");

    const response = await fetch(urlPdf);
    const pdfBytesOriginales = await response.arrayBuffer();

    const pdfDoc = await PDFDocument.load(pdfBytesOriginales);
    const form = pdfDoc.getForm()
    const fuente = await pdfDoc.embedFont(StandardFonts.Helvetica)

    const safeUpper = (txt?: string) => (txt || '').toUpperCase()

    const rellenar = (nombreCampoEnPdf: string | undefined, valor?: string) => {
      if (!nombreCampoEnPdf) return
      if (valor === undefined || valor === null || valor === '') return
      try {
        const campo = form.getTextField(nombreCampoEnPdf)
        if (campo) campo.setText(safeUpper(valor))
      } catch { /* el PDF no tiene ese campo */ }
    }

    // ── Remitente ──
    rellenar(mapeo.remitenteNombre, datos.remitenteNombre)
    rellenar(mapeo.remitenteDni, datos.remitenteDni)
    rellenar(mapeo.remitenteDomicilio, datos.remitenteDomicilio)
    rellenar(mapeo.remitenteLocalidad, datos.remitenteLocalidad)
    rellenar(mapeo.remitenteProvincia, datos.remitenteProvincia)
    rellenar(mapeo.remitenteTelefono, datos.remitenteTelefono)
    rellenar(mapeo.remitenteCp, datos.remitenteCp)

    // ── Destinatario (CUIT formateado con guiones) ──
    rellenar(mapeo.destinatarioNombre, datos.destinatarioNombre)
    rellenar(mapeo.destinatarioCuit, formatearCuit(datos.destinatarioCuit))
    rellenar(mapeo.destinatarioDomicilio, datos.destinatarioDomicilio)
    rellenar(mapeo.destinatarioLocalidad, datos.destinatarioLocalidad)
    rellenar(mapeo.destinatarioProvincia, datos.destinatarioProvincia)
    rellenar(mapeo.destinatarioActividad, datos.destinatarioActividad)
    rellenar(mapeo.destinatarioCp, datos.destinatarioCp)

    // ── Fecha automática (la del día) ──
    rellenar(mapeo.fecha, new Date().toLocaleDateString('es-AR'))

    // ═══════════════════════════════════════════════════════════════════════
    // CUERPO
    // ═══════════════════════════════════════════════════════════════════════
    if (datos.cuerpoTexto?.trim()) {
      if (mapeo.cuerpo.tipo === 'multilinea') {
        try {
          const campoPdf = form.getTextField(mapeo.cuerpo.campo)
          if (campoPdf) {
            campoPdf.enableMultiline()
            campoPdf.setText(safeUpper(datos.cuerpoTexto))
          }
        } catch { /* no existe */ }
      } else {
        const renglonesCfg = mapeo.cuerpo.renglones
        const pals = safeUpper(datos.cuerpoTexto).split(/\s+/).filter(Boolean)
        const textosPorRenglon: string[] = []
        let idxRenglon = 0
        let lineaActual = ''
        let sobrante = ''

        for (let i = 0; i < pals.length; i++) {
          const palabra = pals[i]
          const anchoMax = renglonesCfg[idxRenglon].ancho * MARGEN_ANCHO
          const tentativa = lineaActual ? `${lineaActual} ${palabra}` : palabra
          const ancho = fuente.widthOfTextAtSize(tentativa, TAMANO_FUENTE)
          if (ancho > anchoMax && lineaActual) {
            textosPorRenglon.push(lineaActual)
            lineaActual = palabra
            idxRenglon++
            if (idxRenglon >= renglonesCfg.length) {
              sobrante = [lineaActual, ...pals.slice(i + 1)].join(' ')
              lineaActual = ''
              break
            }
          } else {
            lineaActual = tentativa
          }
        }
        if (lineaActual && idxRenglon < renglonesCfg.length) textosPorRenglon.push(lineaActual)

        if (sobrante.trim().length > 0) {
          return {
            success: false,
            error: `El texto no entra en los renglones del formulario. Recortá aprox. ${sobrante.length} caracteres.`,
          }
        }

        renglonesCfg.forEach((r, idx) => rellenar(r.nombre, textosPorRenglon[idx] || ''))
      }
    }

    form.flatten()

    const pdfBytesModificados = await pdfDoc.save()
    const pdfBase64 = Buffer.from(pdfBytesModificados).toString('base64')

    return { success: true, pdfBase64 }

  } catch (error: any) {
    console.error('Error al generar el PDF del telegrama:', error)
    return { success: false, error: error.message || 'Error interno al procesar el PDF' }
  }
}

export async function obtenerDatosCasoParaTelegrama(casoId: string) {
  try {
    const user = await getUserSessionServer()
    if (!user?.id) return { success: false, error: "No autorizado" }

    const puedeAcceder = await usuarioPuedeAccederCaso(casoId, user.id, user.rol)
    if (!puedeAcceder) return { success: false, error: "No tenés permiso para acceder a este expediente" }

    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: { cliente: true, contraparte: true },
    })
    if (!caso) return { success: false, error: 'No se encontró el expediente en el sistema.' }

    return { success: true, caso }
  } catch (error: any) {
    console.error('Error crítico en base de datos:', error)
    return { success: false, error: `Error de base de datos: ${error.message || 'Error interno'}` }
  }
}