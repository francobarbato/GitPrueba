"use client";

import React, { useEffect, useState } from "react";
import { Save, X, Search, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TipoLiquidacion } from "@prisma/client";
import {
  guardarLiquidacionAction,
  getCasosDisponiblesParaLiquidacion,
} from "src/lib/actions/liquidacion-actions";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface CasoOption {
  id: string;
  numero: string;
  titulo: string;
}

interface DialogoGuardarLiquidacionProps {
  open: boolean;
  onClose: () => void;
  tipo: TipoLiquidacion;
  montoTotal: number;
  detalle: any;                           // snapshot del cálculo
  onGuardado?: (liquidacionId: string) => void;
}

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

export default function DialogoGuardarLiquidacion({
  open,
  onClose,
  tipo,
  montoTotal,
  detalle,
  onGuardado,
}: DialogoGuardarLiquidacionProps) {
  const [descripcion, setDescripcion] = useState("");
  const [casoIdSeleccionado, setCasoIdSeleccionado] = useState<string | null>(null);
  const [busquedaCaso, setBusquedaCaso] = useState("");

  const [casos, setCasos] = useState<CasoOption[]>([]);
  const [cargandoCasos, setCargandoCasos] = useState(false);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  // Cargar casos disponibles al abrir el diálogo
  useEffect(() => {
    if (!open) return;
    let cancelado = false;

    setCargandoCasos(true);
    getCasosDisponiblesParaLiquidacion()
      .then(data => { if (!cancelado) setCasos(data); })
      .catch(() => { if (!cancelado) setCasos([]); })
      .finally(() => { if (!cancelado) setCargandoCasos(false); });

    return () => { cancelado = true; };
  }, [open]);

  // Reset al cerrar
  useEffect(() => {
    if (!open) {
      setDescripcion("");
      setCasoIdSeleccionado(null);
      setBusquedaCaso("");
      setError(null);
      setExito(false);
      setGuardando(false);
    }
  }, [open]);

  if (!open) return null;

  // Filtro de casos por la búsqueda
  const casosFiltrados = busquedaCaso.trim()
    ? casos.filter(c =>
        c.numero.toLowerCase().includes(busquedaCaso.toLowerCase()) ||
        c.titulo.toLowerCase().includes(busquedaCaso.toLowerCase())
      )
    : casos;

  const casoSeleccionado = casos.find(c => c.id === casoIdSeleccionado);

  const handleGuardar = async () => {
    setError(null);
    setGuardando(true);

    const res = await guardarLiquidacionAction({
      tipo,
      montoTotal,
      detalle,
      descripcion: descripcion.trim() || undefined,
      casoId: casoIdSeleccionado || undefined,
    });

    setGuardando(false);

    if (res.error) {
      setError(res.error);
      return;
    }

    setExito(true);
    if (res.liquidacionId && onGuardado) onGuardado(res.liquidacionId);

    // Cerrar el diálogo automáticamente después de un momento breve
    setTimeout(() => onClose(), 1200);
  };

  const tipoLabel = {
    DESPIDO: "Despido",
    LRT: "Accidente LRT",
    CAPITALIZACION: "Capitalización",
  }[tipo];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Save size={18} className="text-slate-700" />
            <h2 className="text-lg font-bold text-slate-800">Guardar Cálculo</h2>
          </div>
          <button
            onClick={onClose}
            disabled={guardando}
            className="text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-5 overflow-y-auto">

          {/* Resumen del cálculo a guardar */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Tipo de cálculo</span>
              <span className="font-semibold text-slate-700">{tipoLabel}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Monto total</span>
              <span className="font-bold text-slate-900 font-mono">
                ${montoTotal.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-500 uppercase">
              Descripción (opcional)
            </label>
            <Input
              type="text"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              placeholder='Ej: "Despido López - liquidación inicial"'
              disabled={guardando}
            />
            <p className="text-[11px] text-slate-400">
              Un alias para reconocer el cálculo en listas posteriores.
            </p>
          </div>

          {/* Vincular a expediente */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500 uppercase">
              Vincular a expediente (opcional)
            </label>

            {/* Caso seleccionado */}
            {casoSeleccionado ? (
              <div className="flex items-center justify-between gap-2 p-2.5 border border-indigo-200 bg-indigo-50 rounded-lg">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-indigo-900 truncate">
                    {casoSeleccionado.numero}
                  </p>
                  <p className="text-xs text-indigo-700 truncate">{casoSeleccionado.titulo}</p>
                </div>
                <button
                  onClick={() => { setCasoIdSeleccionado(null); setBusquedaCaso(""); }}
                  disabled={guardando}
                  className="text-indigo-600 hover:text-indigo-800 text-xs underline shrink-0"
                >
                  Cambiar
                </button>
              </div>
            ) : (
              <>
                {/* Buscador */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    value={busquedaCaso}
                    onChange={e => setBusquedaCaso(e.target.value)}
                    placeholder="Buscar por número o carátula..."
                    className="pl-9"
                    disabled={guardando || cargandoCasos}
                  />
                </div>

                {/* Lista de casos */}
                <div className="border border-slate-200 rounded-lg max-h-44 overflow-y-auto bg-white">
                  {cargandoCasos ? (
                    <p className="text-xs text-slate-400 text-center py-4">Cargando expedientes...</p>
                  ) : casosFiltrados.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-4">
                      {busquedaCaso.trim() ? "Sin coincidencias." : "No hay expedientes activos disponibles."}
                    </p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {casosFiltrados.slice(0, 20).map(caso => (
                        <li key={caso.id}>
                          <button
                            type="button"
                            onClick={() => setCasoIdSeleccionado(caso.id)}
                            disabled={guardando}
                            className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors disabled:opacity-50"
                          >
                            <p className="text-sm font-medium text-slate-800 truncate">{caso.numero}</p>
                            <p className="text-xs text-slate-500 truncate">{caso.titulo}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <p className="text-[11px] text-slate-400">
                  Si no vinculás a un expediente, el cálculo queda como personal y no aparece en el reporte de cuantía.
                </p>
              </>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Éxito */}
          {exito && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-700">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <span>Cálculo guardado correctamente.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={guardando}
            className="text-slate-600 border-slate-300"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleGuardar}
            disabled={guardando || exito}
            className="bg-slate-900 hover:bg-slate-800 text-white gap-2"
          >
            <Save size={16} />
            {guardando ? "Guardando..." : exito ? "Guardado" : "Guardar Cálculo"}
          </Button>
        </div>
      </div>
    </div>
  );
}