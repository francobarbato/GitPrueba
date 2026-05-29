import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles, fmtMonto } from "../styles";

interface PdfFilaProps {
  label:     string;
  monto:     number;
  indent?:   boolean;    // sub-rubro (SAC, etc.) — texto más chico, sangría
  subtotal?: boolean;    // fila de subtotal — fondo gris, negrita
}

export function PdfFila({ label, monto, indent, subtotal }: PdfFilaProps) {
  const rowStyle = [styles.row, ...(subtotal ? [styles.rowSubtotal] : [])];
  const labelStyle = subtotal
    ? styles.cellLabelBold
    : indent
    ? styles.cellLabelIndent
    : styles.cellLabel;
  const montoStyle = subtotal ? styles.cellMontoBold : styles.cellMonto;

  return (
    <View style={rowStyle} wrap={false}>
      <Text style={labelStyle}>{label}</Text>
      <Text style={montoStyle}>{fmtMonto(monto)}</Text>
    </View>
  );
}

/**
 * Fila TOTAL final (fondo negro, texto blanco).
 * Se usa una sola vez al cierre del documento.
 */
export function PdfFilaTotal({ label, monto }: { label: string; monto: number }) {
  return (
    <View style={[styles.row, styles.rowTotal]} wrap={false}>
      <Text style={styles.cellLabelTotal}>{label}</Text>
      <Text style={styles.cellMontoTotal}>{fmtMonto(monto)}</Text>
    </View>
  );
}