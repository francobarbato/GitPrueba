import React from "react";
import { View, Text } from "@react-pdf/renderer";
import { BRANDING } from "../branding";
import { styles, fmtFechaHora } from "../styles";
import type { PdfLiquidacionMeta } from "../types";

interface PdfHeaderProps {
  meta?: PdfLiquidacionMeta;
}

export function PdfHeader({ meta }: PdfHeaderProps) {
  return (
    <View>
      {/* Banda superior: estudio (izq) + metadata (der) */}
      <View style={styles.headerWrap}>
        <View style={styles.headerLeft}>
          <Text style={styles.estudioNombre}>{BRANDING.estudioNombre}</Text>
          <Text style={styles.estudioSub}>{BRANDING.estudioSubtitulo}</Text>
          <Text style={styles.estudioSub}>{BRANDING.estudioDireccion}</Text>
        </View>

        <View style={styles.headerRight}>
          {meta?.liquidacionId && (
            <>
              <Text style={styles.metaLabel}>Cálculo Nº</Text>
              <Text style={styles.metaValue}>
                {meta.liquidacionId.slice(0, 8).toUpperCase()}
              </Text>
            </>
          )}
          <Text style={styles.metaLabel}>Fecha de generación</Text>
          <Text style={styles.metaValue}>{fmtFechaHora(new Date())}</Text>
        </View>
      </View>

      {/* Box de expediente — solo si está vinculado */}
      {meta?.caso && (
        <View style={styles.expedienteBox}>
          <View style={styles.expedienteRow}>
            <Text style={styles.expedienteLabel}>Expediente</Text>
            <Text style={styles.expedienteNumero}>{meta.caso.numero}</Text>
          </View>
          <Text style={styles.expedienteCaratula}>{meta.caso.titulo}</Text>
        </View>
      )}
    </View>
  );
}