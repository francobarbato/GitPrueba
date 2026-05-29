import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

interface PdfSectionProps {
  titulo:    string;
  variante?: "default" | "multas";
}

/**
 * Header de sección (INGRESO DE DATOS / LIQUIDACIÓN FINAL / etc.)
 * Se usa antes de las filas que pertenecen a esa sección.
 */
export function PdfSection({ titulo, variante = "default" }: PdfSectionProps) {
  const headerStyle = [
    styles.sectionHeader,
    ...(variante === "multas" ? [styles.sectionHeaderMultas] : []),
  ];

  return (
    <Text style={headerStyle} wrap={false}>
      {titulo}
    </Text>
  );
}