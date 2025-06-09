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

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma