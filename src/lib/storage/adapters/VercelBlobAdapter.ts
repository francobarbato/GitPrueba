// src/lib/storage/adapters/VercelBlobAdapter.ts
// Para producción con Vercel

// import { put, del } from '@vercel/blob'
// import { StorageProvider, UploadResult } from '../StorageProvider'

// export class VercelBlobAdapter implements StorageProvider {
//   async upload(
//     file: Buffer,
//     key: string,
//     mimeType: string
//   ): Promise<UploadResult> {
//     const blob = await put(key, file, {
//       access: 'public',
//       contentType: mimeType
//     })

//     return {
//       storageKey: blob.pathname,
//       url: blob.url,
//       tamanio: file.length
//     }
//   }

//   async delete(key: string): Promise<void> {
//     await del(key)
//   }

//   async getUrl(key: string): Promise<string> {
//     // En Vercel Blob la URL está guardada en DB
//     return key
//   }
// }

export {}