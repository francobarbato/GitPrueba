import React from "react";
import { Document, Page, Text } from "@react-pdf/renderer";
import { styles, fmtMonto } from "./styles";
import { PdfHeader } from "./components/PdfHeader";
import { PdfFooter } from "./components/PdfFooter";
import { PdfSection } from "./components/PdfSection";
import { PdfFila, PdfFilaTotal } from "./components/PdfFila";
import { PdfDato } from "./components/PdfDato";
import type { PdfLiquidacionMeta } from "./types";

interface PdfLrtProps {
  detalle: any;
  meta?:   PdfLiquidacionMeta;
}

export function PdfLrt({ detalle, meta }: PdfLrtProps) {
  const p   = detalle?.parametros ?? {};
  const r   = detalle?.resultado  ?? {};
  const ibm = p.ibm ?? 0;

  // Fórmula textual aplicada (varía si es Art. 15 o 18 — sin factor %)
  const sinFactor = r.articulo === "15" || r.articulo === "18";
  const formula = sinFactor
    ? `C = IBM × 53 × (65 / edad) = ${fmtMonto(ibm)} × 53 × ${(r.coeficienteEdad ?? 0).toFixed(4)}`
    : `C = IBM × 53 × (% inc. / 100) × (65 / edad) = ${fmtMonto(ibm)} × 53 × ${((p.porcentajeIncapacidad ?? 0) / 100).toFixed(2)} × ${(r.coeficienteEdad ?? 0).toFixed(4)}`;

  return (
    <Document
      title={`Cálculo LRT${meta?.liquidacionId ? ` - ${meta.liquidacionId.slice(0, 8)}` : ""}`}
      author="Sistema LegalTech"
    >
      <Page size="A4" style={styles.page}>
        <PdfHeader meta={meta} />

        <Text style={styles.title}>
          Cálculo de Indemnización por Accidente — LRT
        </Text>

        {/* ── INGRESO DE DATOS ─────────────────────────────────────────────── */}
        <PdfSection titulo="Ingreso de Datos" />
        <PdfDato label="Ingreso Base Mensual (IBM)"     valor={fmtMonto(ibm)} />
        <PdfDato label="Edad al momento del accidente"  valor={`${p.edad ?? 0} años`} />
        <PdfDato
          label="Tipo de accidente"
          valor={p.tipoAccidente === "ocasion" ? "En ocasión del trabajo" : "In itinere"}
        />
        <PdfDato label="Fallecimiento" valor={p.murio ? "Sí" : "No"} />
        {!p.murio && (
          <PdfDato label="Porcentaje de incapacidad" valor={`${p.porcentajeIncapacidad ?? 0}%`} />
        )}
        {(p.montoArt11 ?? 0) > 0 && (
          <PdfDato label="Art. 11 — Pago único (manual)" valor={fmtMonto(p.montoArt11)} />
        )}

        {/* ── INDEMNIZACIÓN ────────────────────────────────────────────────── */}
        <PdfSection titulo="Indemnización" />

        <Text style={styles.notaFormula}>Fórmula aplicada: {formula}</Text>

        <PdfFila
          label={r.descripcionArticulo ?? "Indemnización base"}
          monto={r.indemnizacionBase ?? 0}
        />
        {(r.adicional26773 ?? 0) > 0 && (
          <PdfFila label="Adicional 20% — Art. 3° Ley 26.773" monto={r.adicional26773} />
        )}
        {(r.art11 ?? 0) > 0 && (
          <PdfFila label="Art. 11 — Prestación de pago único" monto={r.art11} />
        )}

        <PdfFilaTotal label="Total LRT" monto={r.totalFinal ?? 0} />

        <Text style={styles.disclaimer}>
          Valores estimativos. No incluyen intereses ni actualización por RIPTE.
          El Art. 11 (prestación de pago único) se carga manualmente según la resolución
          vigente de la SRT. Sujetos a criterio judicial.
        </Text>

        <PdfFooter meta={meta} />
      </Page>
    </Document>
  );
}