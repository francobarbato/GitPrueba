"use client";

import React, { useState } from "react";
import { Calculator, Briefcase, Truck, Scale, Eye, Trash2, FileText, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { LiquidacionConRelaciones } from "src/lib/actions/liquidacion-actions";
import { eliminarLiquidacionAction } from "src/lib/actions/liquidacion-actions";
import DetalleLiquidacionDialog from "./DetalleLiquidacionDialog";
import { useRouter } from "next/navigation";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number | string) => {
  const num = typeof n === "string" ? Number(n) : n;
  return `$${num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtFecha = (iso: string) =>
  new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });

const TIPO_META = {
  DESPIDO: {
    label: "Despido",
    icon: Briefcase,
    color: "bg-rose-100 text-rose-700 border-rose-200",
  },
  LRT: {
    label: "Accidente LRT",
    icon: Truck,
    color: "bg-amber-100 text-amber-700 border-amber-200",
  },
  CAPITALIZACION: {
    label: "Capitalización",
    icon: Scale,
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
} as const;

// ─── COMPONENTE ───────────────────────────────────────────────────────────────

interface SeccionCalculosCasoProps {
  casoId: string;
  liquidaciones: LiquidacionConRelaciones[];
  puedeEliminar: boolean;
}

export default function SeccionCalculosCaso({
  casoId,
  liquidaciones,
  puedeEliminar,
}: SeccionCalculosCasoProps) {
  const router = useRouter();
  const [liquidacionAbierta, setLiquidacionAbierta] = useState<LiquidacionConRelaciones | null>(null);
  const [eliminando, setEliminando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este cálculo? Quedará registrado en la auditoría.")) return;

    setError(null);
    setEliminando(id);
    const res = await eliminarLiquidacionAction(id);
    setEliminando(null);

    if (res.error) {
      setError(res.error);
      return;
    }

    // Refresca el server component para que la lista se actualice
    router.refresh();
  };

  // Total acumulado de los cálculos de este expediente (para el chip resumen)
  const totalAcumulado = liquidaciones.reduce((acc, l) => acc + Number(l.montoTotal), 0);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">

      {/* Header de la sección */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-slate-600" />
          <h3 className="font-bold text-slate-800">Cálculos de Indemnización</h3>
          <span className="text-xs text-slate-500">
            ({liquidaciones.length} {liquidaciones.length === 1 ? "cálculo" : "cálculos"})
          </span>
        </div>
        {liquidaciones.length > 0 && (
          <div className="text-xs text-slate-500">
            Capital acumulado:{" "}
            <span className="font-bold font-mono text-slate-800">{fmt(totalAcumulado)}</span>
          </div>
        )}
      </div>

      {/* Mensaje de error global de la sección */}
      {error && (
        <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Contenido: lista o estado vacío */}
      {liquidaciones.length === 0 ? (
        <div className="px-5 py-10 text-center text-slate-400">
          <Calculator className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No hay cálculos vinculados a este expediente.</p>
          <p className="text-xs mt-1">
            Generá un cálculo en la calculadora y guardalo asociado a este expediente para verlo acá.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">
          {liquidaciones.map((liq) => {
            const meta = TIPO_META[liq.tipo];
            const Icon = meta.icon;
            const isEliminandoEste = eliminando === liq.id;

            return (
              <li key={liq.id} className="px-5 py-3 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center gap-3 flex-wrap">

                  {/* Ícono */}
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${meta.color}`}>
                    <Icon size={16} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-[10px] ${meta.color}`}>
                        {meta.label}
                      </Badge>
                      {liq.descripcion && (
                        <span className="text-sm font-medium text-slate-800 truncate">
                          {liq.descripcion}
                        </span>
                      )}
                      {!liq.descripcion && (
                        <span className="text-sm text-slate-500 italic truncate">
                          Sin descripción
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {fmtFecha(liq.createdAt)} · por{" "}
                      {liq.creadoPor.nombre} {liq.creadoPor.apellido}
                    </p>
                  </div>

                  {/* Monto */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900 font-mono">{fmt(liq.montoTotal)}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">total estimado</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      onClick={() => setLiquidacionAbierta(liq)}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-500 hover:text-slate-800"
                      title="Ver detalle"
                    >
                      <Eye size={15} />
                    </Button>
                    {puedeEliminar && (
                      <Button
                        onClick={() => handleEliminar(liq.id)}
                        disabled={isEliminandoEste}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 disabled:opacity-40"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Footer informativo */}
      {liquidaciones.length > 0 && (
        <div className="px-5 py-2 bg-slate-50/50 border-t border-slate-100 text-[11px] text-slate-400 italic">
          Los cálculos eliminados quedan registrados en la auditoría del expediente y no se borran físicamente.
        </div>
      )}

      {/* Modal de detalle */}
      {liquidacionAbierta && (
        <DetalleLiquidacionDialog
          liquidacion={liquidacionAbierta}
          onClose={() => setLiquidacionAbierta(null)}
        />
      )}
    </div>
  );
}