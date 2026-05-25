// src/app/api/auth/[...nextauth]/route.ts

import prisma from "src/lib/db/prisma";
import NextAuth, { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from 'next-auth/providers/credentials';
import { signInEmailPassword } from "@/auth/actions/auth-actions";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),

    GithubProvider({
      clientId: process.env.GITHUB_ID ?? "",
      clientSecret: process.env.GITHUB_SECRET ?? "",
    }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Correo electrónico", type: "email", placeholder: "usuario@gmail.com" },
        password: { label: "Contraseña", type: "password", placeholder: "**********" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await signInEmailPassword(credentials.email, credentials.password);

        if (!user) return null;

        return {
          id: String(user.id),
          name: user.name,
          email: user.email,
          rol: user.rol ?? "no-rol",
        };
      },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  callbacks: {

    // ===== NUEVO: Bloquear OAuth para usuarios no registrados =====
    // Sin esto, cualquier cuenta de Google/GitHub crea un usuario automáticamente
    // vía PrismaAdapter, saltándose el control de acceso del estudio.
    async signIn({ user, account }) {
      // El flujo de Credentials no pasa por acá — ya tiene su propia validación en authorize()
      if (account?.provider === 'credentials') {
        return true
      }

      // Para Google y GitHub: verificar que el email ya existe en la BD y está activo
      if (account?.provider === 'google' || account?.provider === 'github') {
        const usuarioExistente = await prisma.user.findUnique({
          where: { email: user.email ?? '' },
          select: { isActive: true }
        })

        // Si no existe o está inactivo → acceso denegado → redirige a /auth/error
        if (!usuarioExistente || !usuarioExistente.isActive) {
          console.log(`❌ OAuth bloqueado para: ${user.email} (no registrado o inactivo)`)
          return false
        }

        console.log(`✅ OAuth permitido para: ${user.email}`)
        return true
      }

      // Cualquier otro provider no configurado → denegar por defecto
      return false
    },
    // =============================================================

    async jwt({ token, user }): Promise<any> {
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email ?? "" },
        select: {
          id: true,
          rol: true,
          nombre: true,
          apellido: true,
          isActive: true,
          debeResetearPassword: true,
          ultimoAcceso: true,
        }
      });

      if (dbUser?.isActive === false) {
        throw new Error("Usuario no está activo");
      }

      if (dbUser) {
        token.id = String(dbUser.id);
        token.rol = String(dbUser.rol);
        token.nombre = dbUser.nombre;
        token.apellido = dbUser.apellido;
        token.isActive = dbUser.isActive;
        token.debeResetearPassword = dbUser.debeResetearPassword;
        token.ultimoAcceso = dbUser.ultimoAcceso;
      } else {
        token.rol = "no-rol";
        token.id = "no-id";
        token.isActive = false;
        token.debeResetearPassword = false;
      }

      return token;
    },

    async session({ session, token }): Promise<any> {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
        session.user.nombre = token.nombre as string;
        session.user.apellido = token.apellido as string;
        session.user.isActive = token.isActive as boolean;
        session.user.debeResetearPassword = token.debeResetearPassword as boolean;
        session.user.ultimoAcceso = token.ultimoAcceso as Date;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };