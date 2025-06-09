// app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import  {auth}  from '../../auth';  // Mantén esta importación si auth.ts está en un nivel superior
import type { Metadata } from 'next';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sistema de Gestión Legal',
  description: 'Sistema de gestión para estudios jurídicos',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Intenta obtener la sesión y maneja posibles errores
  let session = null;
  try {
    session = await auth();
    console.log("Sesión obtenida:", session ? "Autenticado" : "No autenticado");
  } catch (error) {
    console.error("Error al obtener la sesión:", error);
  }
  
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* Puedes usar session aquí si lo necesitas */}
        {children}
      </body>
    </html>
  );
}