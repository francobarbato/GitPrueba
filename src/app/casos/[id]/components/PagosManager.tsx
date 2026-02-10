"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2
} from "lucide-react"

interface Pago {
  id: string
  concepto: string
  descripcion: string | null
  monto: number
  estado: string
  comprobanteUrl: string | null
  montoPagado: number | null
  fechaPago: string | null
  fechaValidacion: string | null
  createdAt: string
}

interface PagosManagerProps {
  casoId: string
  pagos: Pago[]
}

const CONCEPTOS_PAGO = [
  "Honorarios Profesionales",
  "Tasa de Justicia",
  "Sellados",
  "Gastos de Pericias",
  "Gastos Administrativos",
  "Otros"
]

export function PagosManager({ casoId, pagos: initialPagos }: PagosManagerProps) {
  const [pagos, setPagos] = useState<Pago[]>(initialPagos)
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [concepto, setConcepto] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")

  const handleAgregarPago = async () => {
    if (!concepto || !monto) {
      alert("Complete concepto y monto")
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/casos/${casoId}/pagos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          concepto,
          descripcion: descripcion || null,
          monto: parseFloat(monto)
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setPagos([result.data, ...pagos])
        setConcepto("")
        setDescripcion("")
        setMonto("")
        setShowForm(false)
      } else {
        alert(result.error || "Error al crear pago")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al crear pago")
    } finally {
      setLoading(false)
    }
  }

  const handleValidarPago = async (pagoId: string) => {
    if (!confirm("Confirmar que el pago fue recibido y validado?")) return

    setLoading(true)
    try {
      const response = await fetch(`/api/casos/${casoId}/pagos/${pagoId}/validar`, {
        method: "PUT"
      })

      const result = await response.json()
      
      if (result.success) {
        setPagos(pagos.map(p => p.id === pagoId ? result.data : p))
      } else {
        alert(result.error || "Error al validar pago")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al validar pago")
    } finally {
      setLoading(false)
    }
  }

  const handleEliminarPago = async (pagoId: string) => {
    if (!confirm("Eliminar este cargo?")) return

    setLoading(true)
    try {
      const response = await fetch(`/api/casos/${casoId}/pagos/${pagoId}`, {
        method: "DELETE"
      })

      const result = await response.json()
      
      if (result.success) {
        setPagos(pagos.filter(p => p.id !== pagoId))
      } else {
        alert(result.error || "Error al eliminar pago")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("Error al eliminar pago")
    } finally {
      setLoading(false)
    }
  }

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case "pendiente":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>
      case "pagado":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><AlertCircle className="w-3 h-3 mr-1" />Por Validar</Badge>
      case "validado":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="w-3 h-3 mr-1" />Validado</Badge>
      default:
        return <Badge variant="outline">{estado}</Badge>
    }
  }

  const totalPendiente = pagos.filter(p => p.estado === "pendiente").reduce((sum, p) => sum + p.monto, 0)
  const totalPorValidar = pagos.filter(p => p.estado === "pagado").reduce((sum, p) => sum + p.monto, 0)
  const totalValidado = pagos.filter(p => p.estado === "validado").reduce((sum, p) => sum + p.monto, 0)

  return (
    <div className="space-y-6">
      {/* Resumen de totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-medium">Pendiente</p>
                <p className="text-xl font-bold text-yellow-700">${totalPendiente.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-blue-600 font-medium">Por Validar</p>
                <p className="text-xl font-bold text-blue-700">${totalPorValidar.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-green-600 font-medium">Validado</p>
                <p className="text-xl font-bold text-green-700">${totalValidado.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Boton para agregar nuevo cargo */}
      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="w-full md:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Cargo / Gasto
        </Button>
      )}

      {/* Formulario para nuevo cargo */}
      {showForm && (
        <Card className="border-slate-200">
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-slate-900">Nuevo Cargo</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="concepto">Concepto</Label>
                <select
                  id="concepto"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="">Seleccionar concepto...</option>
                  {CONCEPTOS_PAGO.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="monto">Monto ($)</Label>
                <Input
                  id="monto"
                  type="number"
                  placeholder="0.00"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripcion (opcional)</Label>
              <Input
                id="descripcion"
                placeholder="Detalle adicional del cargo..."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleAgregarPago} disabled={loading}>
                {loading ? "Guardando..." : "Guardar Cargo"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de pagos */}
      <div className="space-y-3">
        {pagos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-500">Sin cargos registrados</p>
              <p className="text-sm text-slate-400">Agrega honorarios, tasas y gastos del caso</p>
            </CardContent>
          </Card>
        ) : (
          pagos.map((pago) => (
            <Card key={pago.id} className="border-slate-200 hover:border-slate-300 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-slate-900">{pago.concepto}</h4>
                      {getEstadoBadge(pago.estado)}
                    </div>
                    {pago.descripcion && (
                      <p className="text-sm text-slate-500 mb-2">{pago.descripcion}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>Creado: {new Date(pago.createdAt).toLocaleDateString()}</span>
                      {pago.fechaPago && (
                        <span>Pagado: {new Date(pago.fechaPago).toLocaleDateString()}</span>
                      )}
                      {pago.comprobanteUrl && (
                        <a href={pago.comprobanteUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                          <FileText className="w-3 h-3" />
                          Ver comprobante
                        </a>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">${pago.monto.toLocaleString()}</p>
                      {pago.montoPagado && pago.montoPagado !== pago.monto && (
                        <p className="text-sm text-slate-500">Pagado: ${pago.montoPagado.toLocaleString()}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      {pago.estado === "pagado" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:bg-green-50 bg-transparent"
                          onClick={() => handleValidarPago(pago.id)}
                          disabled={loading}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      {pago.estado === "pendiente" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:bg-red-50 bg-transparent"
                          onClick={() => handleEliminarPago(pago.id)}
                          disabled={loading}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
