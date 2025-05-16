// lib/db/prisma.ts
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaGlobal = global as typeof globalThis & {
  prisma?: PrismaClient;
};

export const prisma = prismaGlobal.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") prismaGlobal.prisma = prisma;

export default prisma;