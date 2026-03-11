'use client'

import Link from "next/link"
import { FileQuestion, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        
        <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-2xl mb-6">
          <FileQuestion className="w-10 h-10 text-slate-400" />
        </div>

        <h1 className="text-6xl font-bold text-slate-200 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-slate-700 mb-3">
          Página no encontrada
        </h2>
        <p className="text-slate-500 text-sm mb-8">
          La ruta que intentás acceder no existe en el sistema.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition font-medium text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

      </div>
    </div>
  )
}