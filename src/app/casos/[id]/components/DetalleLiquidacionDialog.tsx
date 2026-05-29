"use client";

import React from "react";
import { X, FileText, User, Calendar, Briefcase, Truck, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LiquidacionConRelaciones } from "src/lib/actions/liquidacion-actions";
import dynamic from "next/dynamic";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const fmt = (n: number | string | null | undefined) => {
  if (n === null || n === undefined) return "—";
  const num = typeof n === "string" ? Number(n) : n;
  if (isNaN(num)) return "—";
  return `$${num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtFechaHora = (iso: string) =>
  new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const fmtFecha = (iso: string) => {
  // Si viene como YYYY-MM-DD (sin hora), evito ajustes de zona horaria
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  }
  return new Date(iso).toLocaleDateString("es-AR");
};

const BotonGenerarPdfLiquidacion = dynamic(
  () => import("src/lib/pdf/liquidacion/BotonGenerarPdfLiquidacion")
    .then(m => m.BotonGenerarPdfLiquidacion),
  { ssr: false }
);

// ─── FILA RUBRO ───────────────────────────────────────────────────────────────

function Fila({ label, valor, destacado = false, indent = false }: {
  label: string;
  valor: number | string;
  destacado?: boolean;
  indent?: boolean;
}) {
  return (
    <tr className={destacado ? "bg-slate-100 font-semibold" : ""}>
      <td className={`px-4 py-2 text-slate-700 ${indent ? "pl-8 text-xs text-slate-500" : ""}`}>
        {label}
      </td>
      <td className="px-4 py-2 text-right font-mono text-sm">{fmt(valor)}</td>
    </tr>
  );
}

// ─── DETALLE POR TIPO ─────────────────────────────────────────────────────────

function DetalleDespido({ detalle }: { detalle: any }) {
  const p = detalle.parametros ?? {};
  const r = detalle.resultado ?? {};

  return (
    <div className="space-y-5">

      {/* Parámetros usados */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Parámetros del cálculo</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <DatoPar label="Salario bruto" valor={fmt(p.salarioBruto)} />
          <DatoPar label="Fecha de ingreso" valor={p.fechaIngreso ? fmtFecha(p.fechaIngreso) : "—"} />
          <DatoPar label="Fecha de egreso" valor={p.fechaEgreso ? fmtFecha(p.fechaEgreso) : "—"} />
          <DatoPar label="Preaviso" valor={p.sinPreaviso ? "Sin preaviso" : "Con preaviso"} />
          <DatoPar label="Vacaciones no gozadas (días)" valor={p.diasVacNoGozadas ?? 0} />
          <DatoPar label="Sueldos adeudados" valor={p.sueldosAdeudados ?? 0} />
          {p.aplicarDoble && (
            <DatoPar label="Art. 245 bis" valor={`${p.porcentajeAgravamiento}%`} />
          )}
          {p.fechaFalsaIngreso && (
            <DatoPar label="Fecha consignada (art. 9/10)" valor={fmtFecha(p.fechaFalsaIngreso)} />
          )}
        </div>
      </div>

      {/* Desglose del resultado */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">

            <tr className="bg-slate-100">
              <td className="px-4 py-2 text-xs font-bold text-slate-500 uppercase" colSpan={2}>
                Liquidación Final
              </td>
            </tr>
            <Fila label="Proporcional Mes Trabajado" valor={r.proporcionalMes ?? 0} />
            <Fila label="SAC Proporcional" valor={r.sacProporcional ?? 0} />
            <Fila label="Vacaciones Proporcionales" valor={r.vacacionesProporcionales ?? 0} />
            <Fila label="SAC Vacaciones Proporcionales" valor={r.sacVacacionesProp ?? 0} indent />
            {(r.vacacionesNoGozadas ?? 0) > 0 && (
              <>
                <Fila label="Vacaciones no gozadas" valor={r.vacacionesNoGozadas} />
                <Fila label="SAC Vacaciones no gozadas" valor={r.sacVacacionesNoGozadas} indent />
              </>
            )}
            {(r.sueldosAdeudados ?? 0) > 0 && (
              <Fila label="Sueldos Adeudados" valor={r.sueldosAdeudados} />
            )}
            <Fila label="Subtotal Liquidación" valor={r.subtotalLiquidacion ?? 0} destacado />

            <tr className="bg-slate-100">
              <td className="px-4 py-2 text-xs font-bold text-slate-500 uppercase" colSpan={2}>
                Indemnización
              </td>
            </tr>
            <Fila label="Indemnización por Antigüedad (Art. 245)" valor={r.indemnizacionAntiguedad ?? 0} />
            {(r.preaviso ?? 0) > 0 && (
              <Fila label="Sustitutiva de Preaviso" valor={r.preaviso} />
            )}
            {(r.sacPreaviso ?? 0) > 0 && (
              <Fila label="SAC Sustitutiva de Preaviso" valor={r.sacPreaviso} indent />
            )}
            {(r.integracionMes ?? 0) > 0 && (
              <Fila label="Días de Integración (Art. 233)" valor={r.integracionMes} />
            )}
            {(r.sacIntegracion ?? 0) > 0 && (
              <Fila label="SAC Días de Integración" valor={r.sacIntegracion} indent />
            )}
            <Fila label="Subtotal Indemnización" valor={r.subtotalIndemnizacion ?? 0} destacado />
            {(r.dobleIndemnizacion ?? 0) > 0 && (
              <Fila label={`Agravamiento Art. 245 bis (${p.porcentajeAgravamiento}%)`} valor={r.dobleIndemnizacion} />
            )}

            {(r.totalMultas ?? 0) > 0 && (
              <>
                <tr className="bg-red-50">
                  <td className="px-4 py-2 text-xs font-bold text-red-600 uppercase" colSpan={2}>
                    Multas
                  </td>
                </tr>
                {(r.multa24013_art8  ?? 0) > 0 && <Fila label="Art. 8 Ley 24013" valor={r.multa24013_art8} />}
                {(r.multa24013_art9  ?? 0) > 0 && <Fila label="Art. 9 Ley 24013" valor={r.multa24013_art9} />}
                {(r.multa24013_art10 ?? 0) > 0 && <Fila label="Art. 10 Ley 24013" valor={r.multa24013_art10} />}
                {(r.multa24013_art15 ?? 0) > 0 && <Fila label="Art. 15 Ley 24013" valor={r.multa24013_art15} />}
                {(r.multa25323_art45 ?? 0) > 0 && <Fila label="Art. 45 (80 LCT) Ley 25323" valor={r.multa25323_art45} />}
                {(r.multa25323_art1  ?? 0) > 0 && <Fila label="Art. 1 Ley 25323" valor={r.multa25323_art1} />}
                {(r.multa25323_art2  ?? 0) > 0 && <Fila label="Art. 2 Ley 25323" valor={r.multa25323_art2} />}
                <Fila label="Total Multas" valor={r.totalMultas} destacado />
              </>
            )}

            <tr className="bg-slate-900 text-white border-t-2 border-slate-700">
              <td className="px-4 py-3 font-bold text-base">TOTAL</td>
              <td className="px-4 py-3 text-right font-bold text-base font-mono">{fmt(r.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetalleLRT({ detalle }: { detalle: any }) {
  const p = detalle.parametros ?? {};
  const r = detalle.resultado ?? {};

  return (
    <div className="space-y-5">

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Parámetros del cálculo</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
          <DatoPar label="IBM" valor={fmt(p.ibm)} />
          <DatoPar label="Edad" valor={`${p.edad} años`} />
          <DatoPar
            label="% Incapacidad"
            valor={p.murio ? "No aplica (muerte)" : `${p.porcentajeIncapacidad}%`}
          />
          <DatoPar label="Tipo de accidente" valor={p.tipoAccidente === "ocasion" ? "En ocasión" : "In itinere"} />
          {p.murio && <DatoPar label="Fallecimiento" valor="Sí" />}
          {p.montoArt11 > 0 && <DatoPar label="Art. 11 (manual)" valor={fmt(p.montoArt11)} />}
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="px-4 py-3 font-medium text-slate-700">{r.descripcionArticulo}</td>
              <td className="px-4 py-3 text-right font-mono">{fmt(r.indemnizacionBase)}</td>
            </tr>
            {(r.adicional26773 ?? 0) > 0 && (
              <tr className="text-amber-700 bg-amber-50/50">
                <td className="px-4 py-3 font-medium">Adicional 20% — Art. 3° Ley 26773</td>
                <td className="px-4 py-3 text-right font-mono">{fmt(r.adicional26773)}</td>
              </tr>
            )}
            {(r.art11 ?? 0) > 0 && (
              <tr className="text-slate-700 bg-slate-50/50">
                <td className="px-4 py-3 font-medium">Art. 11 — Prestación de pago único</td>
                <td className="px-4 py-3 text-right font-mono">{fmt(r.art11)}</td>
              </tr>
            )}
            <tr className="bg-slate-900 text-white border-t-2 border-slate-700">
              <td className="px-4 py-3 font-bold text-base">TOTAL LRT ESTIMADO</td>
              <td className="px-4 py-3 text-right font-bold text-base font-mono">{fmt(r.totalFinal)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DetalleCapitalizacion({ detalle }: { detalle: any }) {
  const p = detalle.parametros ?? {};
  const rs = detalle.resultados ?? {};
  const comp = detalle.comparativa ?? {};

  const filas = [
    { key: "vuotto",  label: "Vuotto",  color: "text-blue-700"   },
    { key: "mendez",  label: "Méndez",  color: "text-green-700"  },
    { key: "vergara", label: "Vergara", color: "text-purple-700" },
  ] as const;

  return (
    <div className="space-y-5">

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Parámetros del cálculo</h4>
        <div className="grid grid-cols-3 gap-x-4 gap-y-1.5 text-sm">
          <DatoPar label="Remuneración" valor={fmt(p.remuneracion)} />
          <DatoPar label="Edad" valor={`${p.edad} años`} />
          <DatoPar label="% Incapacidad" valor={`${p.incapacidad}%`} />
        </div>
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 font-medium text-xs uppercase">
            <tr>
              <th className="px-4 py-2 text-left">Fórmula</th>
              <th className="px-4 py-2 text-right">a</th>
              <th className="px-4 py-2 text-right">n</th>
              <th className="px-4 py-2 text-right">i</th>
              <th className="px-4 py-2 text-right">Capital</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filas.map(({ key, label, color }) => {
              const r = rs[key];
              if (!r) return null;
              const esMayor = comp.formulaMayor === key.toUpperCase();
              return (
                <tr key={key} className={esMayor ? "bg-emerald-50/60 font-semibold" : ""}>
                  <td className={`px-4 py-2 font-bold ${color}`}>
                    {label}
                    {esMayor && (
                      <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">
                        Mayor
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{fmt(r.a)}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{r.n}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{(r.i * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2 text-right font-mono font-bold">{fmt(r.capital)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-slate-900 text-white rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-300 uppercase font-bold">Capital Mayor (a reclamar)</p>
          <p className="text-[11px] text-slate-400">Según fórmula {comp.formulaMayor}</p>
        </div>
        <p className="text-xl font-bold font-mono">{fmt(comp.mayorCapital)}</p>
      </div>
    </div>
  );
}

// ─── HELPERS UI ───────────────────────────────────────────────────────────────

function DatoPar({ label, valor }: { label: string; valor: React.ReactNode }) {
  return (
    <>
      <span className="text-slate-500 text-xs uppercase">{label}</span>
      <span className="text-slate-800 font-medium text-sm text-right">{valor}</span>
    </>
  );
}

const TIPO_LABEL = {
  DESPIDO: { label: "Despido (LCT)", icon: Briefcase },
  LRT: { label: "Accidente LRT", icon: Truck },
  CAPITALIZACION: { label: "Capitalización", icon: Scale },
} as const;

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

interface DetalleLiquidacionDialogProps {
  liquidacion: LiquidacionConRelaciones;
  onClose: () => void;
}

export default function DetalleLiquidacionDialog({
  liquidacion,
  onClose,
}: DetalleLiquidacionDialogProps) {
  const meta = TIPO_LABEL[liquidacion.tipo];
  const Icon = meta.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-slate-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-800 truncate">
                {liquidacion.descripcion || `Cálculo de ${meta.label}`}
              </h2>
              <p className="text-xs text-slate-500">{meta.label}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Metadata */}
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-200 grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <User size={12} />
            <span>{liquidacion.creadoPor.nombre} {liquidacion.creadoPor.apellido}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600">
            <Calendar size={12} />
            <span>{fmtFechaHora(liquidacion.createdAt)}</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-5 overflow-y-auto">
          {liquidacion.tipo === "DESPIDO"        && <DetalleDespido detalle={liquidacion.detalle} />}
          {liquidacion.tipo === "LRT"            && <DetalleLRT detalle={liquidacion.detalle} />}
          {liquidacion.tipo === "CAPITALIZACION" && <DetalleCapitalizacion detalle={liquidacion.detalle} />}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center gap-2">
        <p className="text-[11px] text-slate-400 italic">
          Valores estimativos. Cálculo guardado de forma inmutable.
        </p>
        <div className="flex gap-2">
          <BotonGenerarPdfLiquidacion
            tipo={liquidacion.tipo}
            detalle={liquidacion.detalle}
            meta={{
              liquidacionId: liquidacion.id,
              createdAt:     liquidacion.createdAt,
              creadoPor:     liquidacion.creadoPor,
              caso:          liquidacion.caso
                ? { numero: liquidacion.caso.numero, titulo: liquidacion.caso.titulo }
                : undefined,
            }}
            label="Descargar PDF"
          />
          <Button variant="outline" onClick={onClose} className="text-slate-600 border-slate-300">
            Cerrar
          </Button>
        </div>
      </div>
      </div>
    </div>
  );
}