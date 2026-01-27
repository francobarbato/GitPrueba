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
    async jwt({ token, user }): Promise<any> {
      // Siempre consultar la BD para tener datos actualizados del usuario
      const dbUser = await prisma.user.findUnique({
        where: { email: token.email ?? "" },
        select: {
          id: true,
          rol: true,
          isActive: true,
          debeResetearPassword: true,
        }
      });

      if (dbUser?.isActive === false) {
        throw new Error("Usuario no está activo");
      }

      if (dbUser) {
        token.id = String(dbUser.id);
        token.rol = dbUser.rol;
        token.isActive = dbUser.isActive;
        token.debeResetearPassword = dbUser.debeResetearPassword;
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
        session.user.isActive = token.isActive as boolean;
        session.user.debeResetearPassword = token.debeResetearPassword as boolean;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };