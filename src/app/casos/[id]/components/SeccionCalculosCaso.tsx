"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator, Briefcase, Truck, Scale, Eye, Trash2,
  ChevronDown, ChevronRight,
} from "lucide-react";
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
    plural: "Despidos",
    icon: Briefcase,
    color: "bg-rose-100 text-rose-700 border-rose-200",
    accent: "rose",
  },
  LRT: {
    label: "Accidente LRT",
    plural: "Accidentes LRT",
    icon: Truck,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    accent: "amber",
  },
  CAPITALIZACION: {
    label: "Capitalización",
    plural: "Capitalización",
    icon: Scale,
    color: "bg-indigo-100 text-indigo-700 border-indigo-200",
    accent: "indigo",
  },
} as const;

// El orden de los grupos siempre es el mismo para que la UI sea predecible
const ORDEN_TIPOS = ["DESPIDO", "LRT", "CAPITALIZACION"] as const;

// Umbral: si hay más cálculos en total, los grupos arrancan colapsados
const UMBRAL_COLAPSO_INICIAL = 5;

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

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

  // ── Agrupar cálculos por tipo ─────────────────────────────────────────────
  const grupos = useMemo(() => {
    const map = new Map<string, LiquidacionConRelaciones[]>();
    for (const l of liquidaciones) {
      const arr = map.get(l.tipo) ?? [];
      arr.push(l);
      map.set(l.tipo, arr);
    }
    // Solo devuelvo los tipos que tienen al menos 1 cálculo, en el orden estándar
    return ORDEN_TIPOS
      .filter((t) => map.has(t))
      .map((t) => ({
        tipo: t,
        items: map.get(t)!,
        subtotal: map.get(t)!.reduce((acc, l) => acc + Number(l.montoTotal), 0),
      }));
  }, [liquidaciones]);

  // Estado de colapso por tipo. Arranca cerrado si hay muchos cálculos.
  const colapsoInicial = liquidaciones.length > UMBRAL_COLAPSO_INICIAL;
  const [colapsados, setColapsados] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const t of ORDEN_TIPOS) init[t] = colapsoInicial;
    return init;
  });

  const toggle = (tipo: string) =>
    setColapsados((prev) => ({ ...prev, [tipo]: !prev[tipo] }));

  const expandirTodos = () =>
    setColapsados(Object.fromEntries(ORDEN_TIPOS.map((t) => [t, false])));
  const colapsarTodos = () =>
    setColapsados(Object.fromEntries(ORDEN_TIPOS.map((t) => [t, true])));

  // ── Acciones ──────────────────────────────────────────────────────────────
  const handleEliminar = async (id: string) => {
    if (!confirm("¿Eliminar este cálculo? Quedará registrado en la auditoría.")) return;
    setError(null);
    setEliminando(id);
    const res = await eliminarLiquidacionAction(id);
    setEliminando(null);
    if (res.error) { setError(res.error); return; }
    router.refresh();
  };

  // ── Total acumulado del expediente ────────────────────────────────────────
  const totalAcumulado = liquidaciones.reduce((acc, l) => acc + Number(l.montoTotal), 0);

  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">

      {/* Header general de la sección */}
      <div className="bg-slate-50 border-b border-slate-200 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Calculator className="w-5 h-5 text-slate-600 shrink-0" />
          <h3 className="font-bold text-slate-800">Cálculos de Indemnización</h3>
          <span className="text-xs text-slate-500">
            ({liquidaciones.length} {liquidaciones.length === 1 ? "cálculo" : "cálculos"})
          </span>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Atajos para colapsar/expandir todos (solo si hay 2+ grupos) */}
          {grupos.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={expandirTodos}
                className="text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline"
              >
                Expandir todo
              </button>
              <span className="text-slate-300">·</span>
              <button
                onClick={colapsarTodos}
                className="text-slate-500 hover:text-slate-800 underline-offset-2 hover:underline"
              >
                Colapsar todo
              </button>
            </div>
          )}

          {liquidaciones.length > 0 && (
            <div className="text-xs text-slate-500">
              Capital acumulado:{" "}
              <span className="font-bold font-mono text-slate-800">{fmt(totalAcumulado)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error global de la sección */}
      {error && (
        <div className="px-5 py-2 bg-red-50 border-b border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Contenido: estado vacío o grupos */}
      {liquidaciones.length === 0 ? (
        <div className="px-5 py-10 text-center text-slate-400">
          <Calculator className="w-10 h-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium text-slate-500">No hay cálculos vinculados a este expediente.</p>
          <p className="text-xs mt-1">
            Generá un cálculo en la calculadora y guardalo asociado a este expediente para verlo acá.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-200">
          {grupos.map(({ tipo, items, subtotal }) => {
            const meta = TIPO_META[tipo];
            const GroupIcon = meta.icon;
            const isOpen = !colapsados[tipo];

            return (
              <div key={tipo}>
                {/* Header del grupo (clickeable) */}
                <button
                  onClick={() => toggle(tipo)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-slate-50/70 transition-colors text-left"
                >
                  {/* Chevron */}
                  <span className="text-slate-400 shrink-0">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </span>

                  {/* Ícono del tipo */}
                  <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${meta.color}`}>
                    <GroupIcon size={16} />
                  </div>

                  {/* Nombre del grupo + contador */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800">
                      {items.length === 1 ? meta.label : meta.plural}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {items.length} {items.length === 1 ? "cálculo" : "cálculos"} ·{" "}
                      {(subtotal / totalAcumulado * 100).toFixed(1)}% del capital del expediente
                    </p>
                  </div>

                  {/* Subtotal del grupo */}
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-slate-900 font-mono">{fmt(subtotal)}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">subtotal</p>
                  </div>
                </button>

                {/* Items del grupo (visibles si está expandido) */}
                {isOpen && (
                  <ul className="bg-slate-50/30 divide-y divide-slate-100 border-t border-slate-100">
                    {items.map((liq) => {
                      const isEliminandoEste = eliminando === liq.id;
                      return (
                        <li key={liq.id} className="px-5 py-2.5 pl-16 hover:bg-white transition-colors">
                          <div className="flex items-center gap-3 flex-wrap">

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">
                                {liq.descripcion || (
                                  <span className="text-slate-500 italic">Sin descripción</span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {fmtFecha(liq.createdAt)} · {liq.creadoPor.nombre} {liq.creadoPor.apellido}
                              </p>
                            </div>

                            {/* Monto */}
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-slate-900 font-mono">{fmt(liq.montoTotal)}</p>
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
              </div>
            );
          })}
        </div>
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