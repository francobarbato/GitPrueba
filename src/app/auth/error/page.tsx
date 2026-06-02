// src/app/auth/error/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const getErrorMessage = () => {
    switch (error) {
      case "CredentialsSignin":
        return "Credenciales inválidas. Por favor, verifique su email y contraseña."
      case "SessionRequired":
        return "Debe iniciar sesión para acceder a esta página."
      case "AccessDenied":
        // Este error llega cuando el signIn callback retorna false (OAuth bloqueado)
        return "Acceso denegado. Su cuenta no está autorizada para ingresar al sistema. Contacte al administrador del estudio."
      default:
        return "Ocurrió un error durante la autenticación. Por favor, intente nuevamente."
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-red-600">Error de Autenticación</h1>
          <p className="mt-2 text-gray-600">{getErrorMessage()}</p>
        </div>

        <div className="mt-6 flex justify-center">
          {/* FIX: era /auth/login — la ruta correcta es /auth/signin */}
          <Link
            href="/auth/signin"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  )
}