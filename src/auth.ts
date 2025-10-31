// auth.ts
import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/db/prisma"
import { compare } from "bcryptjs"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "tu@email.com" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email y contraseña requeridos")
        }

        // Buscar usuario en la base
        const user = await prisma.usuario.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error("Usuario no encontrado")
        }
        if (!user.password) {
            throw new Error("El usuario no tiene contraseña registrada")
        }

        // Validar contraseña
        const isValid = await compare(credentials.password, user.password)
        if (!isValid) {
          throw new Error("Contraseña incorrecta")
        }

        return {
          id: String(user.id),
          name: `${user.nombre} ${user.apellido}`,
          email: user.email,
          role: user.rol,
        }
      },
    }),
  ],

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
