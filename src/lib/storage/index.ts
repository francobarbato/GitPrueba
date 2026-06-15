// src/lib/storage/index.ts
// Un solo import en toda la app

import { StorageProvider } from './StorageProvider'
import { LocalStorageAdapter } from './adapters/LocalStorageAdapter'
import { VercelBlobAdapter } from './adapters/VercelBlobAdapter'
// import { S3StorageAdapter } from './adapters/S3StorageAdapter'

function createStorageProvider(): StorageProvider {
  const provider = process.env.STORAGE_PROVIDER || 'local'

  switch (provider) {
    case 'vercel-blob':
      return new VercelBlobAdapter()
    case 's3':
    case 'r2':
    //   return new S3StorageAdapter()
    case 'local':
    default:
      return new LocalStorageAdapter()
  }
}

// Singleton - una sola instancia en toda la app
export const storage = createStorageProvider()