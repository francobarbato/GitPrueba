'use server'

import { PDFDocument } from 'pdf-lib'
import fs from 'fs/promises'
import path from 'path'
import prisma from "src/lib/db/prisma"

export interface DatosCartaDocumento {
  casoId: string
  remitenteNombre: string
  remitenteDni: string
  remitenteDomicilio: string
  remitenteLocalidad: string
  remitenteProvincia: string
  destinatarioNombre: string
  destinatarioDomicilio: string
  destinatarioLocalidad: string
  destinatarioProvincia: string
  cuerpoTexto: string
}

// 1. Action para traer la info de la base de datos
export async function obtenerDatosCasoParaCarta(casoId: string) {
  try {
    const caso = await prisma.caso.findUnique({
      where: { id: casoId },
      include: {
        cliente: true,
        contraparte: true,
      },
    })
    if (!caso) return { success: false, error: 'No se encontró el expediente.' }
    return { success: true, caso }
  } catch (error) {
    return { success: false, error: 'Error al conectar con la base de datos.' }
  }
}

// 2. Action para estampar los datos en el PDF de la Carta Documento
export async function generarCartaPdfAction(datos: DatosCartaDocumento) {
  try {
const rutaPdf = path.join(process.cwd(), 'public', 'modelos-correo', 'carta-documento.pdf')
const pdfBytesOriginales = await fs.readFile(rutaPdf)
    
    const pdfDoc = await PDFDocument.load(pdfBytesOriginales)
    const form = pdfDoc.getForm()
    const safeUpper = (txt?: string) => (txt || '').toUpperCase()

    // Inyección de datos en los campos del PDF oficial de Carta Documento
    form.getTextField('remitente_nombre')?.setText(safeUpper(datos.remitenteNombre))
    form.getTextField('remitente_dni')?.setText(safeUpper(datos.remitenteDni))
    form.getTextField('remitente_domicilio')?.setText(safeUpper(datos.remitenteDomicilio))
    form.getTextField('remitente_localidad')?.setText(safeUpper(datos.remitenteLocalidad))
    form.getTextField('remitente_provincia')?.setText(safeUpper(datos.remitenteProvincia))

    form.getTextField('destinatario_nombre')?.setText(safeUpper(datos.destinatarioNombre))
    form.getTextField('destinatario_domicilio')?.setText(safeUpper(datos.destinatarioDomicilio))
    form.getTextField('destinatario_localidad')?.setText(safeUpper(datos.destinatarioLocalidad))
    form.getTextField('destinatario_provincia')?.setText(safeUpper(datos.destinatarioProvincia))

    // Texto de la intimación
    form.getTextField('cuerpo_texto')?.setText(datos.cuerpoTexto)

    const pdfBytesModificados = await pdfDoc.save()
    const pdfBase64 = Buffer.from(pdfBytesModificados).toString('base64')

    return { success: true, pdfBase64 }
  } catch (error: any) {
    console.error(error)
    return { success: false, error: error.message || 'Error al procesar la Carta Documento' }
  }
}