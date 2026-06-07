// app/layout.tsx
// @ts-ignore: CSS module type declarations for side-effect import
import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { ConfirmacionProvider } from "@/components/confirmacion/ConfirmacionProvider"
import AuthProvider from '@/auth/components/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Gestión Legal',
  description: 'Sistema de gestión para estudios jurídicos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          <ConfirmacionProvider>
            {children}
          </ConfirmacionProvider>
        </AuthProvider>
      </body>
    </html>
  )
}