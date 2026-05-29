import React from "react";
import { Document, Page, Text } from "@react-pdf/renderer";
import { styles, fmtFecha, fmtMonto } from "./styles";
import { PdfHeader } from "./components/PdfHeader";
import { PdfFooter } from "./components/PdfFooter";
import { PdfSection } from "./components/PdfSection";
import { PdfFila, PdfFilaTotal } from "./components/PdfFila";
import { PdfDato } from "./components/PdfDato";
import type { PdfLiquidacionMeta } from "./types";

interface PdfDespidoProps {
  detalle: any;
  meta?:   PdfLiquidacionMeta;
}

export function PdfDespido({ detalle, meta }: PdfDespidoProps) {
  const p = detalle?.parametros ?? {};
  const r = detalle?.resultado  ?? {};
  const mesesPreaviso = (r.antiguedadAnios ?? 0) > 5 ? 2 : 1;
  const hayMultas     = (r.totalMultas ?? 0) > 0;
  const anios         = r.antiguedadAnios ?? 0;

  return (
    <Document
      title={`Cálculo Despido${meta?.liquidacionId ? ` - ${meta.liquidacionId.slice(0, 8)}` : ""}`}
      author="Sistema LegalTech"
    >
      <Page size="A4" style={styles.page}>
        <PdfHeader meta={meta} />

        <Text style={styles.title}>Cálculo de Indemnización por Despido</Text>

        {/* ── INGRESO DE DATOS ─────────────────────────────────────────────── */}
        <PdfSection titulo="Ingreso de Datos" />
        <PdfDato label="Fecha de ingreso"          valor={fmtFecha(p.fechaIngreso)} />
        <PdfDato label="Fecha de egreso"           valor={fmtFecha(p.fechaEgreso)} />
        <PdfDato label="Preaviso"                  valor={p.sinPreaviso ? "Sin Preaviso" : "Con Preaviso"} />
        <PdfDato label="Mejor salario bruto"       valor={fmtMonto(p.salarioBruto)} />
        <PdfDato label="Antigüedad computada"      valor={`${anios} ${anios === 1 ? "año" : "años"}`} />
        <PdfDato label="Vacaciones por antigüedad" valor={`${r.diasVacAntiguedad ?? 0} días`} />
        {(p.diasVacNoGozadas ?? 0) > 0 && (
          <PdfDato label="Vacaciones no gozadas" valor={`${p.diasVacNoGozadas} días`} />
        )}
        {(p.sueldosAdeudados ?? 0) > 0 && (
          <PdfDato label="Sueldos adeudados" valor={`${p.sueldosAdeudados}`} />
        )}
        {p.aplicarDoble && (
          <PdfDato label="Agravamiento Art. 245 bis" valor={`${p.porcentajeAgravamiento}%`} />
        )}
        {p.fechaFalsaIngreso && (
          <PdfDato label="Fecha consignada por empleador" valor={fmtFecha(p.fechaFalsaIngreso)} />
        )}

        {/* ── LIQUIDACIÓN FINAL ────────────────────────────────────────────── */}
        <PdfSection titulo="Liquidación Final" />
        <PdfFila label="Proporcional mes trabajado"     monto={r.proporcionalMes ?? 0} />
        <PdfFila label="SAC proporcional"               monto={r.sacProporcional ?? 0} />
        <PdfFila label="Vacaciones proporcionales"      monto={r.vacacionesProporcionales ?? 0} />
        <PdfFila label="SAC vacaciones proporcionales"  monto={r.sacVacacionesProp ?? 0} indent />
        {(r.vacacionesNoGozadas ?? 0) > 0 && (
          <PdfFila label="Vacaciones no gozadas" monto={r.vacacionesNoGozadas} />
        )}
        {(r.sacVacacionesNoGozadas ?? 0) > 0 && (
          <PdfFila label="SAC vacaciones no gozadas" monto={r.sacVacacionesNoGozadas} indent />
        )}
        {(r.sueldosAdeudados ?? 0) > 0 && (
          <PdfFila label="Sueldos adeudados" monto={r.sueldosAdeudados} />
        )}
        <PdfFila label="Subtotal Liquidación" monto={r.subtotalLiquidacion ?? 0} subtotal />

        {/* ── INDEMNIZACIÓN ────────────────────────────────────────────────── */}
        <PdfSection titulo="Indemnización" />
        <PdfFila label="Indemnización por antigüedad (Art. 245 LCT)" monto={r.indemnizacionAntiguedad ?? 0} />
        {(r.preaviso ?? 0) > 0 && (
          <PdfFila
            label={`Sustitutiva de preaviso (${mesesPreaviso} ${mesesPreaviso === 1 ? "mes" : "meses"})`}
            monto={r.preaviso}
          />
        )}
        {(r.sacPreaviso ?? 0) > 0 && (
          <PdfFila label="SAC sustitutiva de preaviso" monto={r.sacPreaviso} indent />
        )}
        {(r.integracionMes ?? 0) > 0 && (
          <PdfFila label="Días de integración (Art. 233 LCT)" monto={r.integracionMes} />
        )}
        {(r.sacIntegracion ?? 0) > 0 && (
          <PdfFila label="SAC días de integración" monto={r.sacIntegracion} indent />
        )}
        <PdfFila label="Subtotal Indemnización" monto={r.subtotalIndemnizacion ?? 0} subtotal />
        {(r.dobleIndemnizacion ?? 0) > 0 && (
          <PdfFila
            label={`Agravamiento Art. 245 bis (${p.porcentajeAgravamiento}%)`}
            monto={r.dobleIndemnizacion}
          />
        )}

        {/* ── MULTAS (opcional) ────────────────────────────────────────────── */}
        {hayMultas && (
          <>
            <PdfSection titulo="Multas" variante="multas" />
            {(r.multa24013_art8  ?? 0) > 0 && <PdfFila label="Art. 8 — Ley 24.013 (relación no registrada)"         monto={r.multa24013_art8} />}
            {(r.multa24013_art9  ?? 0) > 0 && <PdfFila label="Art. 9 — Ley 24.013 (fecha de ingreso falsa)"         monto={r.multa24013_art9} />}
            {(r.multa24013_art10 ?? 0) > 0 && <PdfFila label="Art. 10 — Ley 24.013 (salario menor al real)"         monto={r.multa24013_art10} />}
            {(r.multa24013_art15 ?? 0) > 0 && <PdfFila label="Art. 15 — Ley 24.013 (despido tras intimación)"       monto={r.multa24013_art15} />}
            {(r.multa25323_art45 ?? 0) > 0 && <PdfFila label="Art. 45 (Art. 80 LCT) — Ley 25.323"                   monto={r.multa25323_art45} />}
            {(r.multa25323_art1  ?? 0) > 0 && <PdfFila label="Art. 1 — Ley 25.323 (empleo no registrado al despido)" monto={r.multa25323_art1} />}
            {(r.multa25323_art2  ?? 0) > 0 && <PdfFila label="Art. 2 — Ley 25.323 (falta de pago tras intimación)"  monto={r.multa25323_art2} />}
            <PdfFila label="Total Multas" monto={r.totalMultas} subtotal />
          </>
        )}

        {/* ── TOTAL FINAL ──────────────────────────────────────────────────── */}
        <PdfFilaTotal
          label={hayMultas ? "Total con Multas" : "Total"}
          monto={r.total ?? 0}
        />

        <Text style={styles.disclaimer}>
          Valores estimativos. No incluyen intereses ni actualización por índices.
          Sujetos a criterio judicial.
        </Text>

        <PdfFooter meta={meta} />
      </Page>
    </Document>
  );
}