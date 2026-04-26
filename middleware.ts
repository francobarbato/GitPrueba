// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas

  const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error', '/api/auth', '/web']
  if (publicRoutes.some(r => pathname.startsWith(r))) return NextResponse.next()

  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })

  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  const userRol = (token.rol as string)?.toUpperCase() || ''
  const debeResetearPassword = token.debeResetearPassword as boolean

  // ================================================================
  // ROL CLIENTE — solo puede acceder a /portal y /perfil
  // ================================================================
  if (userRol === 'CLIENTE') {
    if (debeResetearPassword) {
      if (pathname !== '/portal/perfil' && !pathname.startsWith('/api/usuario'))
        return NextResponse.redirect(new URL('/portal/perfil', request.url))
      return NextResponse.next()
    }
    const rutasPermitidas = ['/portal', '/api/usuario']
    if (!rutasPermitidas.some(r => pathname.startsWith(r)))
      return NextResponse.redirect(new URL('/portal', request.url))
    return NextResponse.next()
  }

  // ================================================================
  // TODOS LOS ROLES — forzar reset de contraseña
  // ================================================================
  if (debeResetearPassword && pathname !== '/perfil' && !pathname.startsWith('/api/usuario'))
    return NextResponse.redirect(new URL('/perfil', request.url))

  // ================================================================
  // ROL ADMIN — solo gestión de usuarios, sin acceso a datos jurídicos
  // ================================================================
  if (userRol === 'ADMIN') {
    const rutasRestringidas = [
      '/portal', '/casos', '/clientes', '/reportes',
      '/gestion-tareas', '/tareas',
    ]
    if (rutasRestringidas.some(r => pathname.startsWith(r)))
      return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // ================================================================
  // ROL ABOGADO — sin acceso a admin ni portal
  // ================================================================
  if (userRol === 'ABOGADO') {
    const rutasRestringidas = ['/admin', '/configuracion', '/portal']
    if (rutasRestringidas.some(r => pathname.startsWith(r)))
      return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  // ================================================================
  // ROL ASISTENTE — sin acceso a reportes estratégicos ni admin
  // ================================================================
  if (userRol === 'ASISTENTE') {
    const rutasRestringidas = [
      '/configuracion', '/admin', '/portal',
      '/calculos-indemnizacion',
      '/reportes/cartera-fuero',
      '/reportes/analisis-resultados',
    ]
    if (rutasRestringidas.some(r => pathname.startsWith(r)))
      return NextResponse.redirect(new URL('/', request.url))
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}