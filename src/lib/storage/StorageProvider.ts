// src/lib/storage/StorageProvider.ts

export interface UploadResult {
  storageKey: string   // Clave única del archivo en el storage
  url: string          // URL para acceder al archivo
  tamanio: number      // Bytes
}

export interface StorageProvider {
  upload(
    file: Buffer,
    key: string,        // Ej: "casos/abc123/PRUEBA/demanda.pdf"
    mimeType: string
  ): Promise<UploadResult>

  delete(key: string): Promise<void>

  getUrl(key: string): Promise<string>
}