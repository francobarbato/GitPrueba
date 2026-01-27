// middleware.ts (en la raíz del proyecto)

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })

  const { pathname } = request.nextUrl

  // ===== RUTAS PÚBLICAS =====
  const publicPaths = [
    "/api/auth",
    "/auth/signin",
    "/auth/error",
  ]

  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // ===== SIN AUTENTICACIÓN → Redirigir a login =====
  if (!token && !isPublicPath) {
    const url = new URL("/auth/signin", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // ===== SI HAY SESIÓN =====
  if (token) {
    const userRole = (token.rol as string)?.toUpperCase()
    const debeResetearPassword = token.debeResetearPassword as boolean

    // ===== USUARIO INACTIVO =====
    if (token.isActive === false) {
      if (!pathname.startsWith("/api/auth") && !pathname.startsWith("/auth/")) {
        return NextResponse.redirect(new URL("/auth/signin?error=UserInactive", request.url))
      }
    }

    // ===== DEBE RESETEAR CONTRASEÑA =====
    const rutasPermitidasParaReset = [
      "/perfil",
      "/api/auth",
      "/auth/",
      "/api/usuario/perfil",
      "/api/usuario/cambiar-password",
      "/_next",
      "/favicon",
    ]

    const esRutaPermitida = rutasPermitidasParaReset.some(ruta => pathname.startsWith(ruta))

    if (debeResetearPassword && !esRutaPermitida) {
      return NextResponse.redirect(new URL("/perfil?resetPassword=true", request.url))
    }

    // ===== SI ESTÁ EN LOGIN Y YA TIENE SESIÓN VÁLIDA =====
    if (pathname.startsWith("/auth/signin") && !debeResetearPassword) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    // ===== RUTAS SOLO PARA ADMIN =====
    const rutasAdmin = [
      "/admin",
      "/configuracion",
      "/reportes/productividad",
    ]

    if (rutasAdmin.some(ruta => pathname.startsWith(ruta))) {
      if (userRole !== "ADMIN") {
        console.log(`❌ Acceso denegado a ${pathname} - Rol: ${userRole}`)
        return NextResponse.redirect(new URL("/", request.url))
      }
    }

    // ===== RUTAS PARA ADMIN Y ABOGADO (No Asistente) =====
    // Ejemplo: Edición de casos - El Asistente no puede editar
    const rutasAdminAbogado = [
      // Por ahora no bloqueamos editar caso aquí, lo controlamos en la UI
      // "/casos/*/editar", // Esto requeriría regex
    ]

    // ===== RUTAS PROTEGIDAS GENERALES (Admin, Abogado, Asistente) =====
    const rutasProtegidas = [
      "/casos",
      "/clientes",
      "/reportes",
      "/gestion-tareas",
      "/plantilla-documentos",
      "/calculos-indemnizacion",
      "/expediente",
    ]

    if (rutasProtegidas.some(ruta => pathname.startsWith(ruta))) {
      const rolesPermitidos = ["ADMIN", "ABOGADO", "ASISTENTE"]
      if (!rolesPermitidos.includes(userRole)) {
        return NextResponse.redirect(new URL("/auth/signin", request.url))
      }
    }

    // ===== RUTAS RESTRINGIDAS PARA ASISTENTE =====
    // El Asistente NO puede acceder a ciertas rutas
    const rutasNoAsistente = [
      "/reportes/productividad",  // Reportes financieros
      "/calculos-indemnizacion",  // Cálculos (decisiones legales)
    ]

    if (rutasNoAsistente.some(ruta => pathname.startsWith(ruta))) {
      if (userRole === "ASISTENTE") {
        console.log(`❌ Asistente no puede acceder a ${pathname}`)
        return NextResponse.redirect(new URL("/", request.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}