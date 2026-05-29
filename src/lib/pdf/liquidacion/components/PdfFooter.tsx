import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { BRANDING } from "../branding";
import { styles, fmtFechaHora } from "../styles";
import type { PdfLiquidacionMeta } from "../types";

interface PdfFooterProps {
  meta?: PdfLiquidacionMeta;
}

/**
 * Footer fijo al pie de cada página.
 * "fixed" lo repite automáticamente en cada página del documento.
 */
export function PdfFooter({ meta }: PdfFooterProps) {
        const generadoPor = meta?.creadoPor
        ? [meta.creadoPor.nombre, meta.creadoPor.apellido].filter(Boolean).join(" ") || null
        : null;

  const createdAt = meta?.createdAt ? fmtFechaHora(meta.createdAt) : null;

  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerLeft}>
        {generadoPor
          ? `Cálculo guardado por ${generadoPor}${createdAt ? ` el ${createdAt}` : ""}`
          : "Cálculo no persistido"}
      </Text>

      <Text style={styles.footerCenter}>{BRANDING.sistemaNombre}</Text>

      <Text
        style={styles.footerRight}
        render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
      />
    </View>
  );
}