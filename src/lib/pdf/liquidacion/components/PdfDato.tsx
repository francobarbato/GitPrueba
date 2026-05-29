import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

interface PdfDatoProps {
  label: string;
  valor: string;
}

/**
 * Fila para INGRESO DE DATOS: label + valor de texto (no monto).
 * Visualmente igual a PdfFila pero el valor es libre (fechas, "Sin Preaviso", "26 años").
 */
export function PdfDato({ label, valor }: PdfDatoProps) {
  return (
    <View style={styles.row} wrap={false}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={styles.cellMonto}>{valor}</Text>
    </View>
  );
}