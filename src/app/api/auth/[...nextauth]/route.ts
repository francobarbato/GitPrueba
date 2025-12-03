import prisma from "../../../../lib/db/prisma";
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
      name:"Credentials",
          credentials: {
      email: { label: "correo electronico", type: "email", placeholder: "usuario@gmail.com" },
      password: { label: "contraseña", type: "password", placeholder:"**********" }
    },
      // esto no es recomendable para produccion, creacion del usuario tiene q ser en un formulario de creacion de usuario
      // crea en bd un log in con correos q no existen y se guardan en bd... queremos q ya todo este creado de antes...
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

  callbacks: {
    async signIn() {
      return true;
    },

    async jwt({ token, user }): Promise<any> {
      // Solo consultar DB una vez (primer inicio de sesión)
      if (!token.rol) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email ?? "" },
        });

        // VALIDACIÓN CORRECTA DE USUARIO INACTIVO
        if (dbUser?.isActive === false) {
          throw Error("Usuario no está activo");
        }

        if (dbUser) {
          token.rol = dbUser.rol; // string
          token.id = String(dbUser.id); // asegurar string
        } else {
          token.rol = "no-rol";
          token.id = "no-id";
        }
      }

      return token;
    },

    async session({ session, token }): Promise<any> {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as string;
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
