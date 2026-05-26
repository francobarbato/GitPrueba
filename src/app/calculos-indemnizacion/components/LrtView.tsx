"use client";

import React, { useState } from 'react';
import { Info, Truck, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// ─── TIPOS ────────────────────────────────────────────────────────────────────

interface CalculatorViewProps {
  setCalculoResult: (result: any | null) => void;
  handleClear: () => void;
}

interface ResultadoLRT {
  articulo:            string;   // "14.2a" | "14.2b" | "15"
  descripcionArticulo: string;
  indemnizacionBase:   number;
  adicional26773:      number;
  totalFinal:          number;
  coeficienteEdad:     number;
}

// ─── LÓGICA DE CÁLCULO ────────────────────────────────────────────────────────

/**
 * Ley 24557 + Decreto 1694/09 + Ley 26773
 *
 * Fórmula general:
 * C = IBM × 53 × (% incapacidad / 100) × (65 / edad)
 *
 * Artículo que aplica según % incapacidad:
 * ≤ 50%          → Art. 14 inc. 2b (IPP leve/moderada)
 * > 50% y < 66%  → Art. 14 inc. 2a (IPP grave)
 * ≥ 66%          → Art. 15         (Incapacidad Total — sin factor %)
 *
 * Ley 26773 Art. 3: adicional del 20% sobre el total
 * Aplica siempre ("en ocasión" o "in itinere")
 */
function calcularLRT(
  ibm: number,
  edad: number,
  incapacidad: number,
  aplicarAdicional26773: boolean,
): ResultadoLRT {
  const coeficienteEdad = 65 / edad;

  let indemnizacionBase: number;
  let articulo: string;
  let descripcionArticulo: string;

  if (incapacidad >= 66) {
    // Art. 15 — Incapacidad Permanente Total (IPT)
    // Sin factor de % porque es total
    indemnizacionBase    = ibm * 53 * coeficienteEdad;
    articulo             = '15';
    descripcionArticulo  = 'Art. 15 Ley 24557 — Incapacidad Permanente Total (≥ 66%)';
  } else if (incapacidad > 50) {
    // Art. 14 inc. 2a — IPP grave (> 50% y < 66%)
    indemnizacionBase    = ibm * 53 * (incapacidad / 100) * coeficienteEdad;
    articulo             = '14.2a';
    descripcionArticulo  = 'Art. 14° inc. 2a Ley 24557 — Incapacidad Permanente Parcial grave (> 50%)';
  } else {
    // Art. 14 inc. 2b — IPP leve/moderada (≤ 50%)
    indemnizacionBase    = ibm * 53 * (incapacidad / 100) * coeficienteEdad;
    articulo             = '14.2b';
    descripcionArticulo  = 'Art. 14° inc. 2b Ley 24557 — Incapacidad Permanente Parcial (≤ 50%)';
  }

  const adicional26773 = aplicarAdicional26773 ? indemnizacionBase * 0.20 : 0;
  const totalFinal     = indemnizacionBase + adicional26773;

  return { articulo, descripcionArticulo, indemnizacionBase, adicional26773, totalFinal, coeficienteEdad };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;

function TooltipIcon({ text }: { text: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative inline-block">
      <Info
        size={13}
        className="text-slate-400 cursor-help hover:text-slate-600 transition-colors"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
      />
      {visible && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed pointer-events-none">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  );
}

// Badge que indica qué artículo aplica
function ArticuloBadge({ articulo }: { articulo: string }) {
  const map: Record<string, { label: string; color: string }> = {
    '14.2b': { label: 'Art. 14 inc. 2b — IPP ≤ 50%',        color: 'bg-blue-100 text-blue-700 border-blue-200'   },
    '14.2a': { label: 'Art. 14 inc. 2a — IPP > 50% y < 66%', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    '15':    { label: 'Art. 15 — Incapacidad Total ≥ 66%',    color: 'bg-red-100 text-red-700 border-red-200'       },
  };
  const { label, color } = map[articulo] ?? { label: articulo, color: 'bg-slate-100 text-slate-600 border-slate-200' };
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full border ${color}`}>
      {label}
    </span>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────

export default function LrtView({ setCalculoResult, handleClear }: CalculatorViewProps) {
  const [formData, setFormData] = useState({
    ibm:                  '' as number | '',
    edad:                 '' as number | '',
    porcentajeIncapacidad: '' as number | '',
    tipoAccidente:        'ocasion' as 'ocasion' | 'itinere',
    aplicarAdicional26773: true,
  });

  const [resultado, setResultado] = useState<ResultadoLRT | null>(null);
  const [errores, setErrores]     = useState<Record<string, string>>({});
  const [infoOpen, setInfoOpen]   = useState(false);

  // ── Validación ───────────────────────────────────────────────────────────
  const validar = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.ibm || Number(formData.ibm) <= 0)
      errs.ibm = 'Ingrese un IBM válido.';
    if (!formData.edad || Number(formData.edad) <= 0 || Number(formData.edad) >= 65)
      errs.edad = 'La edad debe estar entre 1 y 64 años.';
    if (!formData.porcentajeIncapacidad || Number(formData.porcentajeIncapacidad) <= 0 || Number(formData.porcentajeIncapacidad) > 100)
      errs.incapacidad = 'El porcentaje debe estar entre 1 y 100.';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Calcular ─────────────────────────────────────────────────────────────
  const handleCalculate = () => {
    if (!validar()) return;

    const res = calcularLRT(
      Number(formData.ibm),
      Number(formData.edad),
      Number(formData.porcentajeIncapacidad),
      formData.aplicarAdicional26773,
    );

    setResultado(res);
    setCalculoResult({
      indemnizacionBase: res.indemnizacionBase,
      multas:            res.adicional26773,
      intereses:         0,
      total:             res.totalFinal,
    });
  };

  // ── Limpiar ──────────────────────────────────────────────────────────────
  const handleClearLocal = () => {
    setFormData({
      ibm: '', edad: '', porcentajeIncapacidad: '',
      tipoAccidente: 'ocasion', aplicarAdicional26773: true,
    });
    setResultado(null);
    setErrores({});
    handleClear();
  };

  const setField = (field: keyof typeof formData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const FieldError = ({ campo }: { campo: string }) =>
    errores[campo] ? <p className="text-xs text-red-500 mt-1">{errores[campo]}</p> : null;

  // Preview del artículo en tiempo real
  const inc = Number(formData.porcentajeIncapacidad);
  const articuloPreview = inc > 0
    ? inc >= 66 ? '15' : inc > 50 ? '14.2a' : '14.2b'
    : null;

  return (
    <div className="space-y-6">

      {/* ── INGRESO DE DATOS ─────────────────────────────────────────────────── */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck size={18} className="text-slate-600" /> Ingreso de Datos — Accidente LRT
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">

          {/* Info colapsable */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setInfoOpen(!infoOpen)}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-blue-50 text-blue-700 text-xs font-medium"
            >
              <span>ℹ️ ¿Cómo se calcula? — Ley 24557 + Dec. 1694/09 + Ley 26773</span>
              {infoOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {infoOpen && (
              <div className="px-4 py-3 text-xs text-slate-600 space-y-1 bg-blue-50/40">
                <p><strong>Fórmula:</strong> C = IBM × 53 × (% inc. / 100) × (65 / edad)</p>
                <p><strong>Art. 14 inc. 2b</strong> — IPP ≤ 50%: aplica la fórmula completa.</p>
                <p><strong>Art. 14 inc. 2a</strong> — IPP entre 50% y 66%: misma fórmula, mayor base.</p>
                <p><strong>Art. 15</strong> — IPT ≥ 66%: C = IBM × 53 × (65 / edad), sin factor %.</p>
                <p><strong>Ley 26773 Art. 3</strong> — adicional del 20% sobre el total indemnizatorio.</p>
                <p className="text-slate-400 italic pt-1">Valores estimativos. No incluyen intereses ni actualización por índices.</p>
              </div>
            )}
          </div>

          {/* Campos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                Ingreso Base Mensual — IBM ($)
                <TooltipIcon text="El IBM es el promedio mensual de todos los salarios del último año, incluidas horas extras y bonificaciones." />
              </label>
              <Input
                type="number" min={0}
                value={formData.ibm}
                onChange={(e) => setField('ibm', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ej: 350000"
                className={errores.ibm ? 'border-red-400' : ''}
              />
              <FieldError campo="ibm" />
            </div>

            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                Tipo de Accidente
                <TooltipIcon text="'En ocasión': ocurrido durante la jornada o en el lugar de trabajo. 'In itinere': ocurrido en el trayecto al/desde el trabajo." />
              </label>
              <select
                className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white"
                value={formData.tipoAccidente}
                onChange={(e) => setField('tipoAccidente', e.target.value)}
              >
                <option value="ocasion">En Ocasión del Trabajo</option>
                <option value="itinere">In Itinere (trayecto)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                Edad al momento del accidente
                <TooltipIcon text="Se usa para calcular el coeficiente de edad: 65 / edad. A menor edad, mayor indemnización." />
              </label>
              <Input
                type="number" min={1} max={64}
                value={formData.edad}
                onChange={(e) => setField('edad', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ej: 35"
                className={errores.edad ? 'border-red-400' : ''}
              />
              <FieldError campo="edad" />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                Porcentaje de Incapacidad (%)
                <TooltipIcon text="Determina el artículo que aplica: ≤50% → Art. 14.2b, entre 50-66% → Art. 14.2a, ≥66% → Art. 15 (total)." />
              </label>
              <Input
                type="number" min={1} max={100}
                value={formData.porcentajeIncapacidad}
                onChange={(e) => setField('porcentajeIncapacidad', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ej: 15"
                className={errores.incapacidad ? 'border-red-400' : ''}
              />
              <FieldError campo="incapacidad" />
              {/* Preview de artículo en tiempo real */}
              {articuloPreview && (
                <div className="pt-1">
                  <ArticuloBadge articulo={articuloPreview} />
                </div>
              )}
            </div>
          </div>

          {/* Adicional Ley 26773 */}
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors
              ${formData.aplicarAdicional26773 ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
            onClick={() => setField('aplicarAdicional26773', !formData.aplicarAdicional26773)}
          >
            <input
              type="checkbox"
              checked={formData.aplicarAdicional26773}
              onChange={(e) => setField('aplicarAdicional26773', e.target.checked)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 rounded text-amber-500 border-slate-300 focus:ring-amber-400"
            />
            <div>
              <p className="text-sm font-medium text-slate-700">
                Aplicar adicional 20% — Art. 3° Ley 26773
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Compensación adicional por daño extra-patrimonial. Aplica tanto en accidentes en ocasión como in itinere.
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <Button onClick={handleCalculate} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
              Calcular Indemnización
            </Button>
            <Button onClick={handleClearLocal} variant="outline" className="text-slate-600 border-slate-300" size="icon">
              <RotateCcw size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── RESULTADOS ───────────────────────────────────────────────────────── */}
      {resultado && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
            <CardTitle className="text-base text-slate-700 flex items-center justify-between flex-wrap gap-2">
              <span>Desglose LRT</span>
              <ArticuloBadge articulo={resultado.articulo} />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 font-medium">
                <tr>
                  <th className="px-4 py-3 text-left">Rubro</th>
                  <th className="px-4 py-3 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">

                {/* Detalle de la fórmula */}
                <tr className="bg-slate-50/40">
                  <td className="px-4 py-2 text-xs text-slate-400 italic" colSpan={2}>
                    {resultado.articulo === '15'
                      ? `IBM × 53 × (65 / edad) = ${fmt(Number(formData.ibm))} × 53 × ${resultado.coeficienteEdad.toFixed(4)}`
                      : `IBM × 53 × (${formData.porcentajeIncapacidad}% / 100) × (65 / edad) = ${fmt(Number(formData.ibm))} × 53 × ${(Number(formData.porcentajeIncapacidad) / 100).toFixed(2)} × ${resultado.coeficienteEdad.toFixed(4)}`
                    }
                  </td>
                </tr>

                <tr>
                  <td className="px-4 py-3 font-medium text-slate-700">{resultado.descripcionArticulo}</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(resultado.indemnizacionBase)}</td>
                </tr>

                {resultado.adicional26773 > 0 && (
                  <tr className="text-amber-700 bg-amber-50/50">
                    <td className="px-4 py-3 font-medium">Adicional 20% — Art. 3° Ley 26773</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(resultado.adicional26773)}</td>
                  </tr>
                )}

                <tr className="bg-slate-900 text-white border-t-2 border-slate-700">
                  <td className="px-4 py-4 font-bold text-lg">TOTAL LRT ESTIMADO</td>
                  <td className="px-4 py-4 text-right font-bold text-lg font-mono">{fmt(resultado.totalFinal)}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[11px] text-slate-400 px-4 py-3 italic">
              * Valores estimativos. No incluyen intereses ni actualización por RIPTE. Sujetos a criterio judicial.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}