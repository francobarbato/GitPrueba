import React from "react";
import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { styles, COLORS, fmtMonto, fmtNumero } from "./styles";
import { PdfHeader } from "./components/PdfHeader";
import { PdfFooter } from "./components/PdfFooter";
import { PdfSection } from "./components/PdfSection";
import { PdfFila, PdfFilaTotal } from "./components/PdfFila";
import { PdfDato } from "./components/PdfDato";
import type { PdfLiquidacionMeta } from "./types";

interface PdfCapitalizacionProps {
  detalle: any;
  meta?:   PdfLiquidacionMeta;
}

// Sub-encabezado para cada fórmula (Vuotto, Méndez, Vergara)
// Una variante más liviana que el sectionHeader principal.
const localStyles = StyleSheet.create({
  subSeccion: {
    fontFamily:        "Times-Bold",
    fontSize:          10.5,
    marginTop:         12,
    marginBottom:      4,
    paddingBottom:     3,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderDark,
    textTransform:     "uppercase",
    letterSpacing:     0.5,
  },
  mayorBadge: {
    fontFamily: "Times-Italic",
    fontSize:   9,
    color:      COLORS.textMuted,
  },
});

export function PdfCapitalizacion({ detalle, meta }: PdfCapitalizacionProps) {
  const p    = detalle?.parametros  ?? {};
  const rs   = detalle?.resultados  ?? {};
  const comp = detalle?.comparativa ?? {};

  const formulas = [
    {
      key:     "vuotto",
      label:   "Cálculo según Vuotto",
      formula: "a = sal × 13 × (% / 100)   |   n = 65 − edad   |   i = 6%",
      data:    rs.vuotto,
    },
    {
      key:     "mendez",
      label:   "Cálculo según Méndez",
      formula: "a = sal × (60 / edad) × 13 × (% / 100)   |   n = 75 − edad   |   i = 4%",
      data:    rs.mendez,
    },
    {
      key:     "vergara",
      label:   "Cálculo según Vergara",
      formula: "a = sal × (70 / edad) × 13 × (% / 100)   |   n = 77 − edad   |   i = 4%",
      data:    rs.vergara,
    },
  ];

  return (
    <Document
      title={`Cálculo Capitalización${meta?.liquidacionId ? ` - ${meta.liquidacionId.slice(0, 8)}` : ""}`}
      author="Sistema LegalTech"
    >
      <Page size="A4" style={styles.page}>
        <PdfHeader meta={meta} />

        <Text style={styles.title}>
          Cálculo de Indemnización por Accidente — Capitalización
        </Text>

        {/* ── INGRESO DE DATOS ─────────────────────────────────────────────── */}
        <PdfSection titulo="Ingreso de Datos" />
        <PdfDato label="Remuneración mensual"      valor={fmtMonto(p.remuneracion)} />
        <PdfDato label="Edad al momento del daño"  valor={`${p.edad ?? 0} años`} />
        <PdfDato label="Porcentaje de incapacidad" valor={`${p.incapacidad ?? 0}%`} />

        {/* ── TRES FÓRMULAS ────────────────────────────────────────────────── */}
        {formulas.map(({ key, label, formula, data }) => {
          if (!data) return null;
          const esMayor = comp.formulaMayor === key.toUpperCase();
          return (
            <View key={key} wrap={false}>
              <Text style={localStyles.subSeccion}>
                {label}
                {esMayor && <Text style={localStyles.mayorBadge}>  · capital mayor</Text>}
              </Text>
              <Text style={styles.notaFormula}>{formula}</Text>
              <PdfDato label="Vⁿ (factor de descuento)" valor={fmtNumero(data.vn, 6)} />
              <PdfFila label="a (renta anual)"          monto={data.a} />
              <PdfDato label="n (años hasta jubilación)" valor={`${data.n}`} />
              <PdfDato label="i (tasa)"                  valor={`${(data.i * 100).toFixed(0)}%`} />
              <PdfFila label="C (capital)"               monto={data.capital} subtotal />
            </View>
          );
        })}

        {/* ── TOTAL ────────────────────────────────────────────────────────── */}
        <View style={{ marginTop: 12 }}>
          <PdfFilaTotal
            label={`Capital mayor (fórmula ${comp.formulaMayor ?? "—"})`}
            monto={comp.mayorCapital ?? 0}
          />
        </View>

        <Text style={styles.disclaimer}>
          Valores estimativos. Las fórmulas de Vuotto, Méndez y Vergara son
          metodologías jurisprudenciales para cuantificar el daño físico. El capital
          efectivamente reconocido dependerá del criterio del tribunal.
        </Text>

        <PdfFooter meta={meta} />
      </Page>
    </Document>
  );
}