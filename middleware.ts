// middleware.ts (en la raíz del proyecto)
// ACTUALIZADO: Restricciones de reportes para Asistentes

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  console.log('🔴 MIDDLEWARE EJECUTÁNDOSE - Pathname:', request.nextUrl.pathname)
  const { pathname } = request.nextUrl
  
  // Rutas públicas que no requieren autenticación
  const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error', '/api/auth']
  
  // Verificar si es una ruta pública
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))
  
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Obtener el token de sesión
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })

  // Si no hay sesión, redirigir al login
  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  const userRol = (token.rol as string)?.toUpperCase() || ''
  const debeResetearPassword = token.debeResetearPassword as boolean

  // ===== REDIRECCIÓN SEGÚN ROL =====

  // =====================================================
  // ROL CLIENTE: Lógica especial
  // =====================================================
  if (userRol === 'CLIENTE') {
    // Rutas permitidas para CLIENTE
    const rutasCliente = ['/portal', '/perfil', '/api/usuario']
    const rutaPermitida = rutasCliente.some(ruta => pathname.startsWith(ruta))
    
    // Si debe resetear contraseña, solo puede ir a /perfil
    if (debeResetearPassword) {
      if (pathname !== '/perfil' && !pathname.startsWith('/api/usuario')) {
        return NextResponse.redirect(new URL('/perfil', request.url))
      }
      return NextResponse.next()
    }
    
    // Si no debe resetear, verificar que esté en rutas permitidas
    if (!rutaPermitida) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }
    
    return NextResponse.next()
  }

  // =====================================================
  // OTROS ROLES: Si debe resetear contraseña, ir a /perfil
  // =====================================================
  if (debeResetearPassword && pathname !== '/perfil' && !pathname.startsWith('/api/usuario')) {
    return NextResponse.redirect(new URL('/perfil', request.url))
  }

  // =====================================================
  // ROL ASISTENTE: Restringir ciertas rutas
  // =====================================================
  if (userRol === 'ASISTENTE') {
    const rutasRestringidasAsistente = [
      '/configuracion',
      '/admin',
      '/calculos-indemnizacion',
      '/portal',
      // Reportes estratégicos: no accesibles para Asistentes
      '/reportes/cartera-fuero',
      '/reportes/analisis-resultados',
    ]
    
    const rutaRestringida = rutasRestringidasAsistente.some(ruta => pathname.startsWith(ruta))
    
    if (rutaRestringida) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // =====================================================
  // ROL ABOGADO: Restringir rutas de admin
  // =====================================================
  if (userRol === 'ABOGADO') {
    const rutasRestringidasAbogado = [
      '/admin',
      '/configuracion',
      '/portal'
    ]
    
    const rutaRestringida = rutasRestringidasAbogado.some(ruta => pathname.startsWith(ruta))
    
    if (rutaRestringida) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // =====================================================
  // ROL ADMIN: Acceso total (excepto /portal)
  // =====================================================
  if (userRol === 'ADMIN') {
  const rutasRestringidasAdmin = [
    '/portal',
    '/casos',
    '/clientes',
    '/reportes',
  ]
  
  const rutaRestringida = rutasRestringidasAdmin.some(ruta => pathname.startsWith(ruta))
  
  if (rutaRestringida) {
    return NextResponse.redirect(new URL('/', request.url))
  }
}

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}