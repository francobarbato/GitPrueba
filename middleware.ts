// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rutas públicas — antes de cualquier chequeo de token
  const publicRoutes = ['/auth/signin', '/auth/signup', '/auth/error', '/api/auth', '/web']
  if (publicRoutes.some(r => pathname.startsWith(r))) return NextResponse.next()

  let token = null
  try {
    token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  } catch (e) {
    const signInUrl = new URL('/auth/signin', request.url)
    const response = NextResponse.redirect(signInUrl)
    response.cookies.delete('next-auth.session-token')
    response.cookies.delete('__Secure-next-auth.session-token')
    return response
  }

  if (!token) {
    const signInUrl = new URL('/auth/signin', request.url)
    signInUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(signInUrl)
  }

  const userRol = (token.rol as string)?.toUpperCase() || ''
  const debeResetearPassword = token.debeResetearPassword as boolean

  // LOG TEMPORAL — borrar después de confirmar que funciona
  console.log("MW:", pathname, "| rol:", token.rol, "| userRol:", userRol, "| debe resetear:", debeResetearPassword)

  // ================================================================
  // ROL CLIENTE — solo puede acceder a /portal y apis propias
  // ================================================================
  if (userRol === 'CLIENTE') {
    const rutasPermitidas = ['/portal', '/api/usuario', '/api/auth']
    if (!rutasPermitidas.some(r => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL('/portal', request.url))
    }

    if (debeResetearPassword) {
      if (pathname !== '/portal/perfil' && !pathname.startsWith('/api/usuario'))
        return NextResponse.redirect(new URL('/portal/perfil', request.url))
    }

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
    const rutasRestringidas = ['/portal', '/casos', '/clientes', '/reportes', '/gestion-tareas', '/tareas']
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)',
  ],
}