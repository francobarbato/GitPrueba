'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  ArrowLeft, Edit, Star, Flame, XCircle, RotateCcw,
  CheckCircle2, Handshake, Ban, Archive
} from 'lucide-react'
import { CerrarCasoModal, CierreData } from '../../components/cerrar-caso-modal'
import { ReabrirCasoModal } from '../../components/reabrir-caso-modal'
import { cerrarCasoAction, reabrirCasoAction } from '../../cierre-actions'
import { useRouter } from 'next/navigation'

interface CasoHeaderProps {
  caso: {
    id: string
    numero: string
    titulo: string
    estado: string
    priority: string
    isFavorite: boolean
    montoDisputa?: number | null
    estaCerrado?: boolean
    motivoCierre?: string | null
    fechaCierre?: string | null
    observacionCierre?: string | null
    estadoAntesCierre?: string | null
    abogadoId: string          // ← agregado para verificar quién puede reabrir
  }
  userRol: string
  userId: string               // ← agregado para comparar con abogadoId
  puedeEditar: boolean
}

const MOTIVOS_CONFIG: Record<string, { icon: any; color: string; bgColor: string; label: string }> = {
  'FAVORABLE': { icon: CheckCircle2, color: 'text-green-700', bgColor: 'bg-green-100', label: 'Sentencia Favorable' },
  'DESFAVORABLE': { icon: XCircle, color: 'text-red-700', bgColor: 'bg-red-100', label: 'Sentencia Desfavorable' },
  'ACUERDO': { icon: Handshake, color: 'text-blue-700', bgColor: 'bg-blue-100', label: 'Acuerdo Extrajudicial' },
  'DESISTIMIENTO': { icon: Ban, color: 'text-orange-700', bgColor: 'bg-orange-100', label: 'Desistimiento' },
  'ARCHIVO': { icon: Archive, color: 'text-slate-700', bgColor: 'bg-slate-100', label: 'Archivado' },
}

export function CasoHeader({ caso, userRol, userId, puedeEditar }: CasoHeaderProps) {
  const router = useRouter()
  const [showCerrarModal, setShowCerrarModal] = useState(false)
  const [showReabrirModal, setShowReabrirModal] = useState(false)

  const isAbogado = userRol === 'ABOGADO'
  const esAbogadoTitular = caso.abogadoId === userId
  const casoCerrado = caso.estaCerrado === true

  // Solo el abogado titular puede cerrar y reabrir — admin no participa
  const puedeCerrar = isAbogado && esAbogadoTitular && !casoCerrado
  const puedeReabrir = isAbogado && esAbogadoTitular && casoCerrado

  const motivoConfig = caso.motivoCierre ? MOTIVOS_CONFIG[caso.motivoCierre] : null

  const handleCerrarCaso = async (data: CierreData) => {
    await cerrarCasoAction(caso.id, data)
    setShowCerrarModal(false)
    router.refresh()
  }

  const handleReabrirCaso = async (motivo: string) => {
    await reabrirCasoAction(caso.id, motivo)
    setShowReabrirModal(false)
    router.refresh()
  }

  return (
    <>
      {/* Banner de caso cerrado */}
      {casoCerrado && (
        <div className={`mb-4 p-4 rounded-lg border-2 ${motivoConfig?.bgColor || 'bg-red-100'} ${motivoConfig?.color || 'text-red-800'} border-current`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              {motivoConfig ? (
                <motivoConfig.icon className="h-6 w-6" />
              ) : (
                <XCircle className="h-6 w-6" />
              )}
              <div>
                <p className="font-bold text-lg">
                  CASO CERRADO — {motivoConfig?.label || caso.motivoCierre}
                </p>
                {caso.fechaCierre && (
                  <p className="text-sm opacity-80">
                    Cerrado el {new Date(caso.fechaCierre).toLocaleDateString('es-AR', {
                      day: '2-digit', month: 'long', year: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>

            {puedeReabrir && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReabrirModal(true)}
                className="bg-white hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reabrir Caso
              </Button>
            )}
          </div>

          {caso.observacionCierre && (
            <div className="mt-3 pt-3 border-t border-current/20">
              <p className="text-sm">
                <strong>Observaciones:</strong> {caso.observacionCierre}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Header principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-800">{caso.numero}</h1>
              {caso.isFavorite && <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />}
              {caso.priority === 'HIGH' && (
                <Badge variant="destructive" className="gap-1">
                  <Flame className="h-3 w-3" /> Urgente
                </Badge>
              )}
              {casoCerrado && (
                <Badge variant="secondary" className={`${motivoConfig?.bgColor} ${motivoConfig?.color}`}>
                  Cerrado
                </Badge>
              )}
            </div>
            <p className="text-slate-600 mt-1">{caso.titulo}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {puedeEditar && !casoCerrado && (
            <Link href={`/casos/${caso.id}/editar`}>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Editar Caso
              </Button>
            </Link>
          )}
          {puedeCerrar && (
            <Button
              variant="destructive"
              onClick={() => setShowCerrarModal(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Cerrar Caso
            </Button>
          )}
        </div>
      </div>

      <CerrarCasoModal
        isOpen={showCerrarModal}
        onClose={() => setShowCerrarModal(false)}
        onConfirm={handleCerrarCaso}
        caso={{ id: caso.id, numero: caso.numero, titulo: caso.titulo, montoDisputa: caso.montoDisputa }}
      />

      <ReabrirCasoModal
        isOpen={showReabrirModal}
        onClose={() => setShowReabrirModal(false)}
        onConfirm={handleReabrirCaso}
        caso={{
          id: caso.id, numero: caso.numero, titulo: caso.titulo,
          motivoCierre: caso.motivoCierre, fechaCierre: caso.fechaCierre,
          estadoAntesCierre: caso.estadoAntesCierre
        }}
      />
    </>
  )
}