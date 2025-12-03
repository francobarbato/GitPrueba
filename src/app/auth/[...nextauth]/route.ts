// import NextAuth from "next-auth"
// import CredentialsProvider from "next-auth/providers/credentials"
// import { compare } from "bcryptjs"
// import { NextResponse } from "next/server"
// import { prisma } from "@/lib/db/prisma" // ajustá si usás otro ORM o conexión
// import { authOptions } from "@/auth"


// const handler = NextAuth(authOptions)

// export { handler as GET, handler as POST }

// const handler = NextAuth({
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Contraseña", type: "password" },
//       },
//       async authorize(credentials) {
//         if (!credentials?.email || !credentials.password) {
//           throw new Error("Faltan credenciales")
//         }

//         // Buscar usuario en la BD
//         const user = await prisma.usuario.findUnique({
//           where: { email: credentials.email },
//         })

//         if (!user) {
//           throw new Error("Usuario no encontrado")
//         }

//         // Comparar contraseña encriptada
//         const isValid = await compare(credentials.password, user.password)
//         if (!isValid) {
//           throw new Error("Contraseña incorrecta")
//         }

//         return {
//           id: user.id.toString(),
//           name: user.nombre,
//           email: user.email,
//           role: user.rol,
//         }
//       },
//     }),
//   ],

//   pages: {
//     signIn: "/auth/login",
//     error: "/auth/error",
//   },

//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id
//         token.role = user.role
//       }
//       return token
//     },
//     async session({ session, token }) {
//       if (token) {
//         session.user.id = token.id
//         session.user.role = token.role
//       }
//       return session
//     },
//   },

//   session: {
//     strategy: "jwt",
//   },
// })

// export { handler as GET, handler as POST }
