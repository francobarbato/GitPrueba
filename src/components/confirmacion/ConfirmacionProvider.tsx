'use client'

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { AlertTriangle, Info, CheckCircle2 } from "lucide-react"

// ============================================================================
// TIPOS
// ============================================================================

export type VarianteConfirmacion = 'info' | 'warning' | 'danger' | 'success'

export interface OpcionesConfirmacion {
  titulo: string
  descripcion?: string
  textoConfirmar?: string
  textoCancelar?: string
  variante?: VarianteConfirmacion
}

interface ConfirmacionContextValue {
  confirm: (opciones: OpcionesConfirmacion) => Promise<boolean>
}

interface EstadoInterno {
  open: boolean
  titulo: string
  descripcion: string
  textoConfirmar: string
  textoCancelar: string
  variante: VarianteConfirmacion
}

// ============================================================================
// CONTEXT
// ============================================================================

const ConfirmacionContext = createContext<ConfirmacionContextValue | null>(null)

const ESTADO_INICIAL: EstadoInterno = {
  open: false,
  titulo: '',
  descripcion: '',
  textoConfirmar: 'Confirmar',
  textoCancelar: 'Cancelar',
  variante: 'info',
}

// ============================================================================
// PROVIDER
// ============================================================================

export function ConfirmacionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoInterno>(ESTADO_INICIAL)
  // El resolver se guarda en ref para que los handlers no dependan del state
  // ni se rompa con StrictMode
  const resolverRef = useRef<((value: boolean) => void) | null>(null)

  const confirm = useCallback((opciones: OpcionesConfirmacion): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      // Si había un dialog previo abierto (raro), lo cancelamos
      resolverRef.current?.(false)
      resolverRef.current = resolve

      setEstado({
        open: true,
        titulo: opciones.titulo,
        descripcion: opciones.descripcion ?? '',
        textoConfirmar: opciones.textoConfirmar ?? 'Confirmar',
        textoCancelar: opciones.textoCancelar ?? 'Cancelar',
        variante: opciones.variante ?? 'info',
      })
    })
  }, [])

  const cerrarConValor = (valor: boolean) => {
    resolverRef.current?.(valor)
    resolverRef.current = null
    setEstado((e) => ({ ...e, open: false }))
  }

  const handleConfirmar = () => cerrarConValor(true)
  const handleCancelar = () => cerrarConValor(false)

  // Cuando el usuario cierra el dialog con Escape o clickeando afuera,
  // lo tratamos como cancelación.
  const handleOpenChange = (open: boolean) => {
    if (!open) cerrarConValor(false)
  }

  // Estilos según variante
  const { Icono, colorIcono, colorBoton } = obtenerEstilosVariante(estado.variante)

  return (
    <ConfirmacionContext.Provider value={{ confirm }}>
      {children}
      <AlertDialog open={estado.open} onOpenChange={handleOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Icono className={`h-5 w-5 ${colorIcono}`} />
              {estado.titulo}
            </AlertDialogTitle>
            {estado.descripcion && (
              <AlertDialogDescription className="whitespace-pre-line">
                {estado.descripcion}
              </AlertDialogDescription>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelar}>
              {estado.textoCancelar}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmar}
              className={colorBoton}
            >
              {estado.textoConfirmar}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmacionContext.Provider>
  )
}

// ============================================================================
// HOOK
// ============================================================================

export function useConfirmacion() {
  const ctx = useContext(ConfirmacionContext)
  if (!ctx) {
    throw new Error('useConfirmacion debe usarse dentro de <ConfirmacionProvider>')
  }
  return ctx
}

// ============================================================================
// ESTILOS POR VARIANTE
// ============================================================================

function obtenerEstilosVariante(variante: VarianteConfirmacion) {
  switch (variante) {
    case 'danger':
      return {
        Icono: AlertTriangle,
        colorIcono: 'text-red-600',
        colorBoton: 'bg-red-600 hover:bg-red-700 text-white',
      }
    case 'warning':
      return {
        Icono: AlertTriangle,
        colorIcono: 'text-amber-600',
        colorBoton: 'bg-amber-600 hover:bg-amber-700 text-white',
      }
    case 'success':
      return {
        Icono: CheckCircle2,
        colorIcono: 'text-green-600',
        colorBoton: 'bg-green-600 hover:bg-green-700 text-white',
      }
    case 'info':
    default:
      return {
        Icono: Info,
        colorIcono: 'text-blue-600',
        colorBoton: 'bg-blue-600 hover:bg-blue-700 text-white',
      }
  }
}