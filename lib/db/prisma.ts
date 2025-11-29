// lib/db/prisma.ts
// import { PrismaClient } from "@prisma/client";

// declare global {
//   var prisma: PrismaClient | undefined;
// }

// const prismaGlobal = global as typeof globalThis & {
//   prisma?: PrismaClient;
// };

// export const prisma = prismaGlobal.prisma || new PrismaClient();

// if (process.env.NODE_ENV !== "production") prismaGlobal.prisma = prisma;

// export default prisma;
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

//  objeto de configuración al constructor de PrismaClient
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    // La solución a la advertencia de Prisma 7:
    // Le decimos dónde encontrar la URL de conexión.
    datasourceUrl: process.env.DATABASE_URL, 
})

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma



