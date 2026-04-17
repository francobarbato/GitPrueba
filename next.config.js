/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // se remueve appDir: true porque ya no es necesario en Next.js 14
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // ============================================================
  // SECURITY HEADERS
  // Aplicados a todas las rutas de la aplicación.
  // ============================================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Evita clickjacking — impide que la app se embeba en un iframe
          { key: 'X-Frame-Options', value: 'DENY' },
          // Evita MIME sniffing — el browser respeta el Content-Type declarado
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Controla qué info de referrer se envía al navegar a otros sitios
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Deshabilita APIs de hardware que no se usan en este sistema
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

module.exports = nextConfig