// src/lib/storage/adapters/LocalStorageAdapter.ts
// Para desarrollo: guarda en /public/uploads

import fs from 'fs/promises'
import path from 'path'
import { StorageProvider, UploadResult } from '../StorageProvider'

export class LocalStorageAdapter implements StorageProvider {
  private basePath: string
  private baseUrl: string

  constructor() {
    this.basePath = process.env.STORAGE_LOCAL_PATH || './public/uploads'
    this.baseUrl = '/uploads'
  }

  async upload(
    file: Buffer,
    key: string,
    mimeType: string
  ): Promise<UploadResult> {
    const fullPath = path.join(process.cwd(), this.basePath, key)
    
    // Crear carpetas si no existen
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    
    // Escribir archivo
    await fs.writeFile(fullPath, file)

    return {
      storageKey: key,
      url: `${this.baseUrl}/${key}`,
      tamanio: file.length
    }
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(process.cwd(), this.basePath, key)
    try {
      await fs.unlink(fullPath)
    } catch (error) {
      // Si no existe, no es error crítico
      console.warn(`Archivo no encontrado al eliminar: ${key}`)
    }
  }

  async getUrl(key: string): Promise<string> {
    return `${this.baseUrl}/${key}`
  }
}