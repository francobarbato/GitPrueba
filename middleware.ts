// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./auth";

export async function middleware(request: NextRequest) {
  const session = await auth();
  
  // Rutas públicas (no requieren autenticación)
  const publicPaths = [
    "/auth/login",
    "/auth/error",
    "/auth/forgot-password"
  ];
  
  // Verificar si la ruta actual es pública
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // Si no hay sesión y la ruta no es pública, redirigir a login
  if (!session && !isPublicPath) {
    const url = new URL("/auth/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  // Si hay sesión y la ruta es pública, redirigir al dashboard
  if (session && isPublicPath) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  
  // Verificar permisos para rutas específicas
  if (session) {
    const role = session.user.role;
    
    // Rutas de administración solo para administradores
    if (request.nextUrl.pathname.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
    
    // Rutas de abogados solo para abogados y administradores
    if (request.nextUrl.pathname.startsWith("/abogados") && 
        role !== "admin" && role !== "abogado") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas excepto:
     * 1. /api (rutas API)
     * 2. /_next (archivos de Next.js)
     * 3. /fonts (archivos estáticos)
     * 4. /favicon.ico (favicon)
     */
    "/((?!api|_next|fonts|favicon.ico).*)",
  ],
};