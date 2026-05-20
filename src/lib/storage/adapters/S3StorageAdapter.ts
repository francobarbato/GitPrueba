// // src/lib/storage/adapters/S3StorageAdapter.ts
// // Para AWS S3 o Cloudflare R2

// import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
// import { GetObjectCommand } from '@aws-sdk/client-s3'
// import { StorageProvider, UploadResult } from '../StorageProvider'

// export class S3StorageAdapter implements StorageProvider {
//   private client: S3Client
//   private bucket: string

//   constructor() {
//     this.client = new S3Client({
//       region: process.env.AWS_REGION || 'us-east-1',
//       credentials: {
//         accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
//         secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
//       }
//     })
//     this.bucket = process.env.AWS_BUCKET_NAME!
//   }

//   async upload(
//     file: Buffer,
//     key: string,
//     mimeType: string
//   ): Promise<UploadResult> {
//     await this.client.send(new PutObjectCommand({
//       Bucket: this.bucket,
//       Key: key,
//       Body: file,
//       ContentType: mimeType
//     }))

//     return {
//       storageKey: key,
//       url: `https://${this.bucket}.s3.amazonaws.com/${key}`,
//       tamanio: file.length
//     }
//   }

//   async delete(key: string): Promise<void> {
//     await this.client.send(new DeleteObjectCommand({
//       Bucket: this.bucket,
//       Key: key
//     }))
//   }

//   async getUrl(key: string): Promise<string> {
//     // URL firmada válida por 1 hora
//     const command = new GetObjectCommand({
//       Bucket: this.bucket,
//       Key: key
//     })
//     return await getSignedUrl(this.client, command, { expiresIn: 3600 })
//   }
// }
export {}