// auth.ts
import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcryptjs from "bcryptjs";
import { getServerSession } from "next-auth/next";
import {prisma} from "./lib/db/prisma";

// Definir la configuración de NextAuth
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Buscar el usuario por email
          const user = await prisma.usuario.findUnique({
            where: { email: credentials.email },
          });

          // Si no existe el usuario o la contraseña no coincide
          if (!user || !(await bcryptjs.compare(credentials.password, user.password))) {
            return null;
          }

          // Devolver el usuario autenticado
          return {
            id: user.id.toString(),
            email: user.email,
            name: `${user.nombre} ${user.apellido}`,
            role: user.rol,
          };
        } catch (error) {
          console.error("Error en autenticación:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.AUTH_SECRET,
};

// Exportar NextAuth con la configuración
export default NextAuth(authOptions);

// Función auxiliar para obtener la sesión en el servidor
export async function auth() {
  return await getServerSession(authOptions);
}

// En Next-Auth v4, no hay handlers, signIn, signOut exportados directamente
// Vamos a importarlos de next-auth/react para exportarlos
import { signIn, signOut } from "next-auth/react";
export { signIn, signOut };

// Para handlers, necesitamos crear una solución alternativa
// En Next-Auth v4, los handlers están integrados en el objeto devuelto por NextAuth
// Pero no se pueden exportar directamente
// Podemos crear un objeto handlers vacío para evitar errores de importación
export const handlers = {};