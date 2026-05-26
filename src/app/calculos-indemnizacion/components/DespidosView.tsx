"use client";
 
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
 
// ─── TIPOS ────────────────────────────────────────────────────────────────────
 
interface CalculatorViewProps {
  setCalculoResult: (result: any | null) => void;
  handleClear: () => void;
}
 
interface Multas {
  ley24013_art8:  boolean;
  ley24013_art9:  boolean;
  ley24013_art10: boolean;
  ley24013_art15: boolean;
  ley25323_art1:  boolean;
  ley25323_art2:  boolean;
}
 
interface ResultadoDespido {
  antiguedadAnios:              number;
  indemnizacionAntiguedad:      number;
  sacProporcional:              number;
  vacacionesProporcionales:     number;
  preaviso:                     number;
  integracionMes:               number;
  subtotalRubros:               number;
  multa24013_art8:              number;
  multa24013_art9:              number;
  multa24013_art10:             number;
  multa24013_art15:             number;
  multa25323_art1:              number;
  multa25323_art2:              number;
  totalMultas:                  number;
  total:                        number;
}
 
// ─── LÓGICA DE CÁLCULO ────────────────────────────────────────────────────────
 
/**
 * Calcula años de antigüedad según LCT:
 * las fracciones mayores a 3 meses se redondean al año siguiente.
 */
function calcularAntiguedad(fechaIngreso: Date, fechaEgreso: Date): number {
  let anios = fechaEgreso.getFullYear() - fechaIngreso.getFullYear();
  let meses = fechaEgreso.getMonth() - fechaIngreso.getMonth();
  let dias  = fechaEgreso.getDate()  - fechaIngreso.getDate();
 
  if (dias < 0)  meses--;
  if (meses < 0) { anios--; meses += 12; }
 
  // Fracción > 3 meses → cuenta como año completo
  if (meses > 3 || (meses === 3 && dias > 0)) anios++;
 
  return Math.max(anios, 1); // mínimo 1 año
}
 
/**
 * Días de vacaciones según antigüedad (Art. 150 LCT)
 */
function diasVacaciones(anios: number): number {
  if (anios < 5)  return 14;
  if (anios < 10) return 21;
  if (anios < 20) return 28;
  return 35;
}
 
function calcularDespido(
  salario: number,
  fechaIngresoStr: string,
  fechaEgresoStr: string,
  sinPreaviso: boolean,
  mesesPreaviso: number,
  multas: Multas,
): ResultadoDespido {
  const fi = new Date(fechaIngresoStr + 'T00:00:00');
  const fe = new Date(fechaEgresoStr  + 'T00:00:00');
 
  // ── Antigüedad y Art. 245 ────────────────────────────────────────────────
  const antiguedadAnios         = calcularAntiguedad(fi, fe);
  const indemnizacionBruta      = salario * antiguedadAnios;
  const indemnizacionAntiguedad = Math.max(indemnizacionBruta, salario * 2); // mínimo 2 sueldos
 
  // ── SAC Proporcional ─────────────────────────────────────────────────────
  // Semestres: ene-jun / jul-dic
  const mesEgreso      = fe.getMonth(); // 0-indexed
  const inicioSemestre = mesEgreso < 6 ? new Date(fe.getFullYear(), 0, 1) : new Date(fe.getFullYear(), 6, 1);
  const diasSemestre   = Math.round((fe.getTime() - inicioSemestre.getTime()) / (1000 * 60 * 60 * 24));
  const sacProporcional = (salario / 2) * (diasSemestre / 182);
 
  // ── Vacaciones Proporcionales ─────────────────────────────────────────────
  const inicioAnio       = new Date(fe.getFullYear(), 0, 1);
  const diasAnio         = Math.round((fe.getTime() - inicioAnio.getTime()) / (1000 * 60 * 60 * 24));
  const diasVac          = diasVacaciones(antiguedadAnios);
  const vacProporcionales = (salario / 25) * diasVac * (diasAnio / 365);
 
  // ── Preaviso (Art. 231) ───────────────────────────────────────────────────
  // Solo si el empleador no dio preaviso
  const preaviso = sinPreaviso ? salario * mesesPreaviso : 0;
 
  // ── Integración mes de despido (Art. 233) ─────────────────────────────────
  // Días restantes del mes al momento del despido
  const ultimoDiaMes   = new Date(fe.getFullYear(), fe.getMonth() + 1, 0).getDate();
  const diasRestantes  = ultimoDiaMes - fe.getDate();
  const integracionMes = sinPreaviso ? (salario / 30) * diasRestantes : 0;
 
  // ── Subtotal rubros ───────────────────────────────────────────────────────
  const subtotalRubros =
    indemnizacionAntiguedad + sacProporcional + vacProporcionales + preaviso + integracionMes;
 
  // ── Multas ────────────────────────────────────────────────────────────────
  // Ley 24013 — se aplican sobre la indemnización por antigüedad
  const multa24013_art8  = multas.ley24013_art8  ? indemnizacionAntiguedad * 0.25 : 0;
  const multa24013_art9  = multas.ley24013_art9  ? indemnizacionAntiguedad * 0.25 : 0;
  const multa24013_art10 = multas.ley24013_art10 ? indemnizacionAntiguedad * 0.25 : 0;
  // Art. 15: duplica las indemnizaciones de los arts. anteriores
  const baseArt15        = multa24013_art8 + multa24013_art9 + multa24013_art10;
  const multa24013_art15 = multas.ley24013_art15 ? baseArt15 : 0;
 
  // Ley 25323
  // Art. 1: duplica la indemnización del Art. 245
  const multa25323_art1 = multas.ley25323_art1 ? indemnizacionAntiguedad : 0;
  // Art. 2: duplica preaviso + integración + vacaciones
  const multa25323_art2 = multas.ley25323_art2
    ? (preaviso + integracionMes + vacProporcionales)
    : 0;
 
  const totalMultas =
    multa24013_art8 + multa24013_art9 + multa24013_art10 + multa24013_art15 +
    multa25323_art1 + multa25323_art2;
 
  const total = subtotalRubros + totalMultas;
 
  return {
    antiguedadAnios,
    indemnizacionAntiguedad,
    sacProporcional,
    vacacionesProporcionales: vacProporcionales,
    preaviso,
    integracionMes,
    subtotalRubros,
    multa24013_art8,
    multa24013_art9,
    multa24013_art10,
    multa24013_art15,
    multa25323_art1,
    multa25323_art2,
    totalMultas,
    total,
  };
}
 
// ─── HELPERS UI ───────────────────────────────────────────────────────────────
 
const fmt = (n: number) => `$${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })}`;
 
function CheckRow({
  label, sublabel, checked, onChange, monto,
}: {
  label: string; sublabel?: string; checked: boolean;
  onChange: (v: boolean) => void; monto: number;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer
        ${checked ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 hover:border-slate-300'}`}
      onClick={() => onChange(!checked)}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          onClick={(e) => e.stopPropagation()}
          className="rounded text-red-500 border-slate-300 focus:ring-red-400"
        />
        <div>
          <p className="text-sm font-medium text-slate-700">{label}</p>
          {sublabel && <p className="text-xs text-slate-400">{sublabel}</p>}
        </div>
      </div>
      {checked && monto > 0 && (
        <span className="text-sm font-bold text-red-600 font-mono">{fmt(monto)}</span>
      )}
    </div>
  );
}
 
// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
 
export default function DespidoView({ setCalculoResult, handleClear }: CalculatorViewProps) {
  const [formData, setFormData] = useState({
    salarioBruto: '' as number | '',
    fechaIngreso: '',
    fechaEgreso:  '',
    sinPreaviso:  true,
    mesesPreaviso: 1,
  });
 
  const [multas, setMultas] = useState<Multas>({
    ley24013_art8:  false,
    ley24013_art9:  false,
    ley24013_art10: false,
    ley24013_art15: false,
    ley25323_art1:  false,
    ley25323_art2:  false,
  });
 
  const [resultado, setResultado]   = useState<ResultadoDespido | null>(null);
  const [errores, setErrores]       = useState<Record<string, string>>({});
  const [multasOpen, setMultasOpen] = useState(false);
 
  // ── Validación ───────────────────────────────────────────────────────────
  const validar = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.salarioBruto || Number(formData.salarioBruto) <= 0)
      errs.salario = 'Ingrese un salario válido.';
    if (!formData.fechaIngreso)
      errs.fechaIngreso = 'Ingrese la fecha de ingreso.';
    if (!formData.fechaEgreso)
      errs.fechaEgreso = 'Ingrese la fecha de egreso.';
    if (formData.fechaIngreso && formData.fechaEgreso && formData.fechaIngreso >= formData.fechaEgreso)
      errs.fechaEgreso = 'La fecha de egreso debe ser posterior al ingreso.';
    setErrores(errs);
    return Object.keys(errs).length === 0;
  };
 
  // ── Calcular ─────────────────────────────────────────────────────────────
  const handleCalculate = () => {
    if (!validar()) return;
 
    const res = calcularDespido(
      Number(formData.salarioBruto),
      formData.fechaIngreso,
      formData.fechaEgreso,
      formData.sinPreaviso,
      formData.mesesPreaviso,
      multas,
    );
 
    setResultado(res);
    setCalculoResult({
      indemnizacionBase: res.subtotalRubros,
      multas: res.totalMultas,
      intereses: 0,
      total: res.total,
    });
  };
 
  // ── Limpiar ──────────────────────────────────────────────────────────────
  const handleClearLocal = () => {
    setFormData({ salarioBruto: '', fechaIngreso: '', fechaEgreso: '', sinPreaviso: true, mesesPreaviso: 1 });
    setMultas({ ley24013_art8: false, ley24013_art9: false, ley24013_art10: false, ley24013_art15: false, ley25323_art1: false, ley25323_art2: false });
    setResultado(null);
    setErrores({});
    handleClear();
  };
 
  const setField = (field: keyof typeof formData, value: any) =>
    setFormData(prev => ({ ...prev, [field]: value }));
 
  const FieldError = ({ campo }: { campo: string }) =>
    errores[campo] ? <p className="text-xs text-red-500 mt-1">{errores[campo]}</p> : null;
 
  // Precalcular montos de multas para mostrar en los checkboxes (si hay resultado)
  const montosMultas = resultado ? {
    art8:  resultado.multa24013_art8,
    art9:  resultado.multa24013_art9,
    art10: resultado.multa24013_art10,
    art15: resultado.multa24013_art15,
    a1:    resultado.multa25323_art1,
    a2:    resultado.multa25323_art2,
  } : { art8: 0, art9: 0, art10: 0, art15: 0, a1: 0, a2: 0 };
 
  return (
    <div className="space-y-6">
 
      {/* ── INGRESO DE DATOS ─────────────────────────────────────────────────── */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase size={18} className="text-slate-600" /> Ingreso de Datos (LCT)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
 
          {/* Datos base */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Mejor Salario Bruto ($)</label>
              <Input
                type="number" min={0}
                value={formData.salarioBruto}
                onChange={(e) => setField('salarioBruto', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Ej: 350000"
                className={errores.salario ? 'border-red-400' : ''}
              />
              <FieldError campo="salario" />
            </div>
 
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Preaviso</label>
              <select
                className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white"
                value={formData.sinPreaviso ? `sin_${formData.mesesPreaviso}` : 'con'}
                onChange={(e) => {
                  if (e.target.value === 'con') {
                    setField('sinPreaviso', false);
                  } else {
                    setField('sinPreaviso', true);
                    setField('mesesPreaviso', Number(e.target.value.replace('sin_', '')));
                  }
                }}
              >
                <option value="con">Con Preaviso (ya fue notificado)</option>
                <option value="sin_1">Sin Preaviso — 1 mes (hasta 5 años)</option>
                <option value="sin_2">Sin Preaviso — 2 meses (más de 5 años)</option>
              </select>
            </div>
 
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Fecha de Ingreso</label>
              <Input
                type="date"
                value={formData.fechaIngreso}
                onChange={(e) => setField('fechaIngreso', e.target.value)}
                className={errores.fechaIngreso ? 'border-red-400' : ''}
              />
              <FieldError campo="fechaIngreso" />
            </div>
 
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 uppercase">Fecha de Egreso</label>
              <Input
                type="date"
                value={formData.fechaEgreso}
                onChange={(e) => setField('fechaEgreso', e.target.value)}
                className={errores.fechaEgreso ? 'border-red-400' : ''}
              />
              <FieldError campo="fechaEgreso" />
            </div>
          </div>
 
          <hr className="border-slate-100" />
 
          {/* Multas colapsables */}
          <div>
            <button
              type="button"
              onClick={() => setMultasOpen(!multasOpen)}
              className="w-full flex items-center justify-between text-sm font-bold text-red-600 uppercase pb-2 border-b border-red-100"
            >
              <span>Multas Ley 24013 &amp; 25323 (opcional)</span>
              {multasOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
 
            {multasOpen && (
              <div className="mt-4 space-y-4">
                {/* Ley 24013 */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Ley 24013 — Empleo no registrado</p>
                  <div className="space-y-2">
                    <CheckRow
                      label="Art. 8 — Relación no registrada"
                      sublabel="25% de remuneraciones devengadas sin registrar"
                      checked={multas.ley24013_art8}
                      onChange={(v) => setMultas(m => ({ ...m, ley24013_art8: v }))}
                      monto={montosMultas.art8}
                    />
                    <CheckRow
                      label="Art. 9 — Diferencia salarial"
                      sublabel="25% sobre la diferencia entre lo registrado y lo real"
                      checked={multas.ley24013_art9}
                      onChange={(v) => setMultas(m => ({ ...m, ley24013_art9: v }))}
                      monto={montosMultas.art9}
                    />
                    <CheckRow
                      label="Art. 10 — Alta tardía"
                      sublabel="25% adicional por registración fuera de término"
                      checked={multas.ley24013_art10}
                      onChange={(v) => setMultas(m => ({ ...m, ley24013_art10: v }))}
                      monto={montosMultas.art10}
                    />
                    <CheckRow
                      label="Art. 15 — Duplica arts. anteriores"
                      sublabel="El doble de las indemnizaciones de arts. 8, 9 y 10"
                      checked={multas.ley24013_art15}
                      onChange={(v) => setMultas(m => ({ ...m, ley24013_art15: v }))}
                      monto={montosMultas.art15}
                    />
                  </div>
                </div>
 
                {/* Ley 25323 */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Ley 25323</p>
                  <div className="space-y-2">
                    <CheckRow
                      label="Art. 1 — Duplica indemnización Art. 245"
                      sublabel="Trabajador no registrado o registrado con fecha falsa"
                      checked={multas.ley25323_art1}
                      onChange={(v) => setMultas(m => ({ ...m, ley25323_art1: v }))}
                      monto={montosMultas.a1}
                    />
                    <CheckRow
                      label="Art. 2 — Duplica preaviso, integración y vacaciones"
                      sublabel="Empleador no pagó en tiempo y forma al vencer el plazo"
                      checked={multas.ley25323_art2}
                      onChange={(v) => setMultas(m => ({ ...m, ley25323_art2: v }))}
                      monto={montosMultas.a2}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
 
          {/* Botones */}
          <div className="pt-2 flex gap-2">
            <Button onClick={handleCalculate} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
              Calcular Liquidación
            </Button>
            <Button onClick={handleClearLocal} variant="outline" className="text-slate-600 border-slate-300" size="icon">
              <RotateCcw size={16} />
            </Button>
          </div>
        </CardContent>
      </Card>
 
      {/* ── TABLA DE RESULTADOS ──────────────────────────────────────────────── */}
      {resultado && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
            <CardTitle className="text-base text-slate-700 flex items-center justify-between">
              <span>Desglose de Liquidación</span>
              <span className="text-xs text-slate-400 font-normal">
                Antigüedad: {resultado.antiguedadAnios} {resultado.antiguedadAnios === 1 ? 'año' : 'años'}
              </span>
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
 
                {/* Rubros principales */}
                <tr>
                  <td className="px-4 py-3 text-slate-700 font-medium">Indemnización por Antigüedad (Art. 245 LCT)</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(resultado.indemnizacionAntiguedad)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700 font-medium">SAC Proporcional</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(resultado.sacProporcional)}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-700 font-medium">Vacaciones Proporcionales</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(resultado.vacacionesProporcionales)}</td>
                </tr>
                {resultado.preaviso > 0 && (
                  <tr>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      Preaviso ({formData.mesesPreaviso} {formData.mesesPreaviso === 1 ? 'mes' : 'meses'})
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(resultado.preaviso)}</td>
                  </tr>
                )}
                {resultado.integracionMes > 0 && (
                  <tr>
                    <td className="px-4 py-3 text-slate-700 font-medium">Integración Mes de Despido (Art. 233)</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(resultado.integracionMes)}</td>
                  </tr>
                )}
 
                {/* Subtotal */}
                <tr className="bg-slate-50 font-semibold border-t-2 border-slate-200">
                  <td className="px-4 py-3 text-slate-800">Subtotal Rubros</td>
                  <td className="px-4 py-3 text-right font-mono">{fmt(resultado.subtotalRubros)}</td>
                </tr>
 
                {/* Multas */}
                {resultado.multa24013_art8  > 0 && <tr className="text-red-700 bg-red-50/50"><td className="px-4 py-2.5">Multa Art. 8 Ley 24013</td>  <td className="px-4 py-2.5 text-right font-mono">{fmt(resultado.multa24013_art8)}</td></tr>}
                {resultado.multa24013_art9  > 0 && <tr className="text-red-700 bg-red-50/50"><td className="px-4 py-2.5">Multa Art. 9 Ley 24013</td>  <td className="px-4 py-2.5 text-right font-mono">{fmt(resultado.multa24013_art9)}</td></tr>}
                {resultado.multa24013_art10 > 0 && <tr className="text-red-700 bg-red-50/50"><td className="px-4 py-2.5">Multa Art. 10 Ley 24013</td> <td className="px-4 py-2.5 text-right font-mono">{fmt(resultado.multa24013_art10)}</td></tr>}
                {resultado.multa24013_art15 > 0 && <tr className="text-red-700 bg-red-50/50"><td className="px-4 py-2.5">Multa Art. 15 Ley 24013</td> <td className="px-4 py-2.5 text-right font-mono">{fmt(resultado.multa24013_art15)}</td></tr>}
                {resultado.multa25323_art1  > 0 && <tr className="text-red-700 bg-red-50/50"><td className="px-4 py-2.5">Multa Art. 1 Ley 25323</td>  <td className="px-4 py-2.5 text-right font-mono">{fmt(resultado.multa25323_art1)}</td></tr>}
                {resultado.multa25323_art2  > 0 && <tr className="text-red-700 bg-red-50/50"><td className="px-4 py-2.5">Multa Art. 2 Ley 25323</td>  <td className="px-4 py-2.5 text-right font-mono">{fmt(resultado.multa25323_art2)}</td></tr>}
 
                {resultado.totalMultas > 0 && (
                  <tr className="bg-red-50 font-semibold text-red-700 border-t border-red-200">
                    <td className="px-4 py-3">Total Multas</td>
                    <td className="px-4 py-3 text-right font-mono">{fmt(resultado.totalMultas)}</td>
                  </tr>
                )}
 
                {/* Total final */}
                <tr className="bg-slate-900 text-white border-t-2 border-slate-700">
                  <td className="px-4 py-4 font-bold text-lg">TOTAL ESTIMADO</td>
                  <td className="px-4 py-4 text-right font-bold text-lg font-mono">{fmt(resultado.total)}</td>
                </tr>
              </tbody>
            </table>
            <p className="text-[11px] text-slate-400 px-4 py-3 italic">
              * Valores estimativos. No incluyen intereses. Sujetos a criterio judicial.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
