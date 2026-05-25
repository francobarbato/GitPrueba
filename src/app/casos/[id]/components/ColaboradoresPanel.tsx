// src/app/casos/[id]/components/ColaboradoresPanel.tsx
'use client'

import { useState, useTransition } from "react"
import { Users, Plus, X, UserPlus, Shield } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { agregarColaborador, eliminarColaborador } from "../colaborador.actions"

interface Colaborador {
  id: string
  permiso: string
  createdAt: Date
  usuario: {
    id: string
    nombre: string | null
    apellido: string | null
    email: string
  }
  asignadoPor: {
    nombre: string | null
    apellido: string | null
  }
}

interface AbogadoDisponible {
  id: string
  nombre: string | null
  apellido: string | null
  email: string
}

export function ColaboradoresPanel({
  casoId,
  colaboradores,
  abogadosDisponibles,
  puedeEditar,
  abogadoTitular,
}: {
  casoId: string
  colaboradores: Colaborador[]
  abogadosDisponibles: AbogadoDisponible[]
  puedeEditar: boolean
  abogadoTitular: { nombre: string | null; apellido: string | null } | null
}) {
  const [mostrarSelector, setMostrarSelector] = useState(false)
  const [abogadoSeleccionado, setAbogadoSeleccionado] = useState<string>("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleAgregar = () => {
    if (!abogadoSeleccionado) return
    setError(null)

    startTransition(async () => {
      try {
        await agregarColaborador(casoId, abogadoSeleccionado)
        setAbogadoSeleccionado("")
        setMostrarSelector(false)
      } catch (e: any) {
        setError(e.message || "Error al agregar colaborador")
      }
    })
  }

  const handleEliminar = (abogadoId: string) => {
    setError(null)
    startTransition(async () => {
      try {
        await eliminarColaborador(casoId, abogadoId)
      } catch (e: any) {
        setError(e.message || "Error al eliminar colaborador")
      }
    })
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" />
            <CardTitle className="text-sm font-semibold text-slate-700">
              Equipo del Caso
            </CardTitle>
          </div>
          {puedeEditar && abogadosDisponibles.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1"
              onClick={() => setMostrarSelector(!mostrarSelector)}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Agregar
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">

        {/* Abogado Titular */}
        {abogadoTitular && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 border border-blue-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {abogadoTitular.nombre?.[0] || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {abogadoTitular.nombre} {abogadoTitular.apellido}
                </p>
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-700 border-none text-[10px]">
              Titular
            </Badge>
          </div>
        )}

        {/* Colaboradores */}
        {colaboradores.map(colab => (
          <div
            key={colab.id}
            className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100 group"
          >
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-400 text-white flex items-center justify-center text-xs font-bold">
                {colab.usuario.nombre?.[0] || '?'}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {colab.usuario.nombre} {colab.usuario.apellido}
                </p>
                <p className="text-[10px] text-slate-400">
                  Agregado por {colab.asignadoPor.nombre} {colab.asignadoPor.apellido}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] text-slate-500">
                <Shield className="h-2.5 w-2.5 mr-1" />
                {colab.permiso === 'EDICION' ? 'Edición' : 'Lectura'}
              </Badge>
              {puedeEditar && (
                <button
                  onClick={() => handleEliminar(colab.usuario.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500"
                  title="Quitar colaborador"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Sin colaboradores */}
        {colaboradores.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-2">
            Sin colaboradores asignados
          </p>
        )}

        {/* Selector para agregar */}
        {mostrarSelector && (
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <Select value={abogadoSeleccionado} onValueChange={setAbogadoSeleccionado}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Seleccionar abogado..." />
              </SelectTrigger>
              <SelectContent>
                {abogadosDisponibles.map(ab => (
                  <SelectItem key={ab.id} value={ab.id}>
                    {ab.nombre} {ab.apellido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1 h-8 text-xs"
                onClick={handleAgregar}
                disabled={!abogadoSeleccionado || isPending}
              >
                {isPending ? 'Agregando...' : 'Confirmar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => {
                  setMostrarSelector(false)
                  setAbogadoSeleccionado("")
                  setError(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}