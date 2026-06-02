// src/app/api/auth/[...nextauth]/route.ts

import prisma from "src/lib/db/prisma";
import NextAuth, { NextAuthOptions } from "next-auth";
import { Adapter } from "next-auth/adapters";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { signInEmailPassword } from "@/auth/actions/auth-actions";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email:    { label: "Correo electrónico", type: "email",    placeholder: "usuario@estudio.com" },
        password: { label: "Contraseña",         type: "password", placeholder: "**********" },
      },
        async authorize(credentials) {
          if (!credentials?.email || !credentials.password) return null;

          const user = await signInEmailPassword(credentials.email, credentials.password);

          if (!user) {
            // signInEmailPassword devolvió null. Antes de cerrar con "CredentialsSignin"
            // genérico, chequeamos si el email existe pero la cuenta está desactivada.
            // Esto nos permite mostrarle al user un mensaje útil ("cuenta suspendida")
            // en vez de "credenciales incorrectas" que sería engañoso.
            const usuarioPorEmail = await prisma.user.findUnique({
              where:  { email: credentials.email.toLowerCase() },
              select: { isActive: true, password: true },
            });

            // Solo lanzamos UserInactive si el user existe, está desactivado, y tiene
            // password seteada (excluye el caso de invitaciones no activadas todavía,
            // que también tienen isActive=false pero password=null).
            if (usuarioPorEmail && !usuarioPorEmail.isActive && usuarioPorEmail.password) {
              throw new Error("UserInactive");
            }

            return null; // credenciales realmente inválidas
          }

          return {
            id:    String(user.id),
            name:  user.name,
            email: user.email,
            rol:   user.rol ?? "no-rol",
          };
        },
    }),
  ],

  session: { strategy: "jwt" },

  pages: {
    signIn: "/auth/signin",
    error:  "/auth/error",
  },

  callbacks: {
    async jwt({ token }): Promise<any> {
      const dbUser = await prisma.user.findUnique({
        where:  { email: token.email ?? "" },
        select: {
          id: true, rol: true, nombre: true, apellido: true,
          isActive: true, debeResetearPassword: true, ultimoAcceso: true,
        },
      });

      if (dbUser?.isActive === false) {
        throw new Error("UserInactive");
      }

      if (dbUser) {
        token.id                   = String(dbUser.id);
        token.rol                  = String(dbUser.rol);
        token.nombre               = dbUser.nombre;
        token.apellido             = dbUser.apellido;
        token.isActive             = dbUser.isActive;
        token.debeResetearPassword = dbUser.debeResetearPassword;
        token.ultimoAcceso         = dbUser.ultimoAcceso;
      } else {
        token.rol                  = "no-rol";
        token.id                   = "no-id";
        token.isActive             = false;
        token.debeResetearPassword = false;
      }

      return token;
    },

    async session({ session, token }): Promise<any> {
      if (session.user) {
        session.user.id                   = token.id                   as string;
        session.user.rol                  = token.rol                  as string;
        session.user.nombre               = token.nombre               as string;
        session.user.apellido             = token.apellido             as string;
        session.user.isActive             = token.isActive             as boolean;
        session.user.debeResetearPassword = token.debeResetearPassword as boolean;
        session.user.ultimoAcceso         = token.ultimoAcceso         as Date;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };