// src/lib/storage/adapters/VercelBlobAdapter.ts
//
// Adapter de Vercel Blob para producción.
//
// Notas de diseño:
//
// 1. access: 'public' es la única opción que soporta Vercel Blob al momento
//    de escribir esto. La privacidad se logra porque las URLs incluyen un
//    componente no adivinable. Para documentos extremadamente sensibles
//    convendría S3 con URLs firmadas, pero para el TFG esto alcanza.
//
// 2. addRandomSuffix: false — nuestras keys ya vienen con timestamp + UUID
//    desde storageKeys.ts, así que no necesitamos que Vercel agregue OTRO
//    sufijo. Si por algún motivo hubiera colisión exacta, simplemente se
//    sobreescribe el archivo (que en la práctica no pasa).
//
// 3. Guardamos blob.url como storageKey además de url. La URL completa de
//    Vercel Blob ya identifica unívocamente el archivo y sirve para borrarlo,
//    así que usamos una sola cadena para los dos campos.

import { put, del } from '@vercel/blob'
import { StorageProvider, UploadResult } from '../StorageProvider'

export class VercelBlobAdapter implements StorageProvider {
  async upload(
    file: Buffer,
    key: string,
    mimeType: string
  ): Promise<UploadResult> {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        'BLOB_READ_WRITE_TOKEN no está configurado. ' +
        'En desarrollo: agregalo a .env.local. ' +
        'En Vercel: agregalo desde Settings → Environment Variables.'
      )
    }

    try {
      const blob = await put(key, file, {
        access: 'public',
        contentType: mimeType,
        addRandomSuffix: false,
      })

      return {
        storageKey: blob.url,
        url: blob.url,
        tamanio: file.length,
      }
    } catch (error: any) {
      console.error('[VercelBlobAdapter] Error al subir archivo:', error)
      throw new Error(
        `No se pudo subir el archivo al almacenamiento: ${error.message || error}`
      )
    }
  }

  async delete(key: string): Promise<void> {
    try {
      // del() acepta la URL completa o un array de URLs
      await del(key)
    } catch (error: any) {
      // Coherente con el LocalAdapter: si no se pudo borrar (ya no existe,
      // error de red, etc.), warneamos pero no rompemos el flujo.
      console.warn(
        `[VercelBlobAdapter] No se pudo eliminar archivo: ${key}`,
        error?.message ?? error
      )
    }
  }

  async getUrl(key: string): Promise<string> {
    // En Vercel Blob, storageKey YA es la URL final accesible al público.
    // No hay reescritura ni firma.
    return key
  }
}