'use client'

// app/reportes/actividad-documental/components/KPIsDocumental.tsx

import { Card, CardContent } from "@/components/ui/card"
import { FileText, HardDrive, Users, FolderOpen } from "lucide-react"

export type KPIsDocumental = {
  totalDocumentos: number
  totalMB: number
  abogadosActivos: number
  promedioPorExpediente: number
  expedientesConDocs: number
}

function formatMB(mb: number): string {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`
  return `${mb.toFixed(1)} MB`
}

export function KPIsDocumental({ data }: { data: KPIsDocumental }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">

      {/* Total documentos */}
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Documentos del período</p>
              <p className="text-2xl font-bold text-slate-900">{data.totalDocumentos}</p>
              <p className="text-[10px] text-slate-400">Total subidos al estudio</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volumen gestionado */}
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <HardDrive className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Volumen gestionado</p>
              <p className="text-2xl font-bold text-slate-900">{formatMB(data.totalMB)}</p>
              <p className="text-[10px] text-slate-400">Tamaño total de archivos</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abogados activos */}
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 rounded-lg">
              <Users className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Abogados con actividad</p>
              <p className="text-2xl font-bold text-slate-900">{data.abogadosActivos}</p>
              <p className="text-[10px] text-slate-400">Subieron al menos 1 documento</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promedio por expediente */}
      <Card className="bg-white border border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Promedio por expediente</p>
              <p className="text-2xl font-bold text-slate-900">{data.promedioPorExpediente.toFixed(1)}</p>
              <p className="text-[10px] text-slate-400">{data.expedientesConDocs} expedientes con documentos</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}