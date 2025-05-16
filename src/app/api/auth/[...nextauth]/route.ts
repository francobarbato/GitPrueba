// app/api/auth/[...nextauth]/route.ts
import { authOptions } from "@/auth";
import NextAuth from "next-auth";

// Crear el handler de NextAuth
const handler = NextAuth(authOptions);

// Exportar el handler como GET y POST
export { handler as GET, handler as POST };