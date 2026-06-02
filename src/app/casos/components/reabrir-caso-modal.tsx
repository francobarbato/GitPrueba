'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  RotateCcw, 
  AlertTriangle,
  Loader2,
  ShieldAlert
} from 'lucide-react'

interface ReabrirCasoModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (motivo: string) => Promise<void>
  caso: {
    id: string
    numero: string
    titulo: string
    motivoCierre?: string | null
    fechaCierre?: string | null
    estadoAntesCierre?: string | null
  }
}

export function ReabrirCasoModal({ isOpen, onClose, onConfirm, caso }: ReabrirCasoModalProps) {
  const [motivoReapertura, setMotivoReapertura] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!motivoReapertura.trim()) {
      setError('Debe indicar el motivo de la reapertura')
      return
    }

    if (motivoReapertura.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await onConfirm(motivoReapertura.trim())
      setMotivoReapertura('')
    } catch (err: any) {
      setError(err.message || 'Error al reabrir el caso')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setError('')
      setMotivoReapertura('')
      onClose()
    }
  }

  // Formatear fecha de cierre
  const fechaCierreFormateada = caso.fechaCierre 
    ? new Date(caso.fechaCierre).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : 'No especificada'

  // Mapeo de motivos a texto legible
  const motivosTexto: Record<string, string> = {
    'FAVORABLE': 'Sentencia Favorable',
    'DESFAVORABLE': 'Sentencia Desfavorable',
    'ACUERDO': 'Acuerdo Extrajudicial',
    'DESISTIMIENTO': 'Desistimiento / Abandono',
    'ARCHIVO': 'Archivo Administrativo',
    'TRASPASADO_A_OTRO_ESTUDIO':  'Traspasado a Otro Estudio',
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-700">
            <RotateCcw className="h-5 w-5" />
            Reabrir Caso
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{caso.numero}</span> - {caso.titulo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Badge de Admin */}
          <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg text-purple-700 text-sm">
            <ShieldAlert className="h-4 w-4" />
            <span className="font-medium">Acción exclusiva de Administrador</span>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Info del cierre anterior */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <h4 className="font-semibold text-slate-700 text-sm">Información del Cierre</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-slate-500">Motivo:</span>
                <p className="font-medium">
                  {caso.motivoCierre ? motivosTexto[caso.motivoCierre] || caso.motivoCierre : 'No especificado'}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Fecha de cierre:</span>
                <p className="font-medium">{fechaCierreFormateada}</p>
              </div>
            </div>
            {caso.estadoAntesCierre && (
              <div>
                <span className="text-slate-500 text-sm">Estado anterior al cierre:</span>
                <p className="font-medium text-sm">{caso.estadoAntesCierre}</p>
              </div>
            )}
          </div>

          {/* Motivo de reapertura */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Motivo de la Reapertura <span className="text-red-500">*</span>
            </Label>
            <Textarea
              placeholder="Ej: Se recibió nueva documentación que requiere reabrir el expediente para continuar con la apelación..."
              value={motivoReapertura}
              onChange={(e) => setMotivoReapertura(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-slate-500">
              Este motivo quedará registrado en la auditoría del caso.
            </p>
          </div>

          {/* Advertencia */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">El caso volverá a estar activo</p>
                <p className="text-xs mt-1">
                  Se restaurará al estado "{caso.estadoAntesCierre || 'Inicio / Demanda'}" 
                  y aparecerá nuevamente en los listados de expedientes activos.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !motivoReapertura.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Reabriendo...
              </>
            ) : (
              <>
                <RotateCcw className="h-4 w-4 mr-2" />
                Confirmar Reapertura
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}