'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  XCircle, 
  CheckCircle2, 
  Handshake, 
  Ban, 
  Archive,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

// Motivos de cierre con iconos y colores
const MOTIVOS_CIERRE = [
  { 
    value: 'FAVORABLE', 
    label: 'Sentencia Favorable (Ganado)', 
    icon: CheckCircle2, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  { 
    value: 'DESFAVORABLE', 
    label: 'Sentencia Desfavorable (Perdido)', 
    icon: XCircle, 
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  { 
    value: 'ACUERDO', 
    label: 'Acuerdo Extrajudicial (Conciliación)', 
    icon: Handshake, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  { 
    value: 'DESISTIMIENTO', 
    label: 'Desistimiento / Abandono', 
    icon: Ban, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  { 
    value: 'ARCHIVO', 
    label: 'Incompetencia / Archivo Administrativo', 
    icon: Archive, 
    color: 'text-slate-600',
    bgColor: 'bg-slate-50',
    borderColor: 'border-slate-200'
  },
]

interface CerrarCasoModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (data: CierreData) => Promise<void>
  caso: {
    id: string
    numero: string
    titulo: string
    montoDisputa?: number | null
  }
}

export interface CierreData {
  motivoCierre: string
  montoFinal: number | null
  fechaCierre: string
  observacionCierre: string
}

export function CerrarCasoModal({ isOpen, onClose, onConfirm, caso }: CerrarCasoModalProps) {
  const [motivoCierre, setMotivoCierre] = useState('')
  const [montoFinal, setMontoFinal] = useState('')
  const [fechaCierre, setFechaCierre] = useState(new Date().toISOString().split('T')[0])
  const [observacionCierre, setObservacionCierre] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const motivoSeleccionado = MOTIVOS_CIERRE.find(m => m.value === motivoCierre)

  const handleSubmit = async () => {
    // Validación
    if (!motivoCierre) {
      setError('Debe seleccionar un motivo de cierre')
      return
    }

    if (!fechaCierre) {
      setError('Debe indicar la fecha de cierre')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await onConfirm({
        motivoCierre,
        montoFinal: montoFinal ? parseFloat(montoFinal) : null,
        fechaCierre,
        observacionCierre
      })
      
      // Limpiar formulario
      setMotivoCierre('')
      setMontoFinal('')
      setFechaCierre(new Date().toISOString().split('T')[0])
      setObservacionCierre('')
      
    } catch (err: any) {
      setError(err.message || 'Error al cerrar el caso')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setError('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            Cerrar / Archivar Caso
          </DialogTitle>
          <DialogDescription>
            <span className="font-semibold">{caso.numero}</span> - {caso.titulo}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* MOTIVO DE CIERRE */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Motivo del Cierre <span className="text-red-500">*</span>
            </Label>
            <Select value={motivoCierre} onValueChange={setMotivoCierre}>
              <SelectTrigger className={motivoSeleccionado ? `${motivoSeleccionado.bgColor} ${motivoSeleccionado.borderColor}` : ''}>
                <SelectValue placeholder="Seleccionar motivo..." />
              </SelectTrigger>
              <SelectContent>
                {MOTIVOS_CIERRE.map((motivo) => {
                  const Icon = motivo.icon
                  return (
                    <SelectItem key={motivo.value} value={motivo.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${motivo.color}`} />
                        <span>{motivo.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Indicador visual del motivo seleccionado */}
          {motivoSeleccionado && (
            <div className={`p-3 rounded-lg ${motivoSeleccionado.bgColor} ${motivoSeleccionado.borderColor} border`}>
              <div className="flex items-center gap-2">
                <motivoSeleccionado.icon className={`h-5 w-5 ${motivoSeleccionado.color}`} />
                <span className={`font-medium ${motivoSeleccionado.color}`}>
                  {motivoSeleccionado.label}
                </span>
              </div>
            </div>
          )}

          {/* MONTO FINAL */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Monto final del expediente
              <span className="text-slate-400 font-normal ml-1">(opcional)</span>
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={montoFinal}
                onChange={(e) => setMontoFinal(e.target.value)}
                className="pl-7"
              />
            </div>
            {caso.montoDisputa && (
              <p className="text-xs text-slate-500">
                Monto en disputa original: ${Number(caso.montoDisputa).toLocaleString('es-AR')}
              </p>
            )}
          </div>

          {/* FECHA DE CIERRE */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Fecha Efectiva de Cierre <span className="text-red-500">*</span>
            </Label>
            <Input
              type="date"
              value={fechaCierre}
              onChange={(e) => setFechaCierre(e.target.value)}
            />
          </div>

          {/* OBSERVACIONES */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">
              Observaciones del Cierre
              <span className="text-slate-400 font-normal ml-1">(opcional)</span>
            </Label>
            <Textarea
              placeholder="Ej: El cliente aceptó la oferta de la aseguradora por $500.000..."
              value={observacionCierre}
              onChange={(e) => setObservacionCierre(e.target.value)}
              rows={3}
            />
          </div>

          {/* ADVERTENCIA */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Esta acción marcará el caso como cerrado</p>
                <p className="text-xs mt-1">
                  El caso dejará de aparecer en los listados activos. 
                  Solo un Administrador podrá reabrirlo si fuera necesario.
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
            disabled={isSubmitting || !motivoCierre}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cerrando...
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Confirmar Cierre
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}