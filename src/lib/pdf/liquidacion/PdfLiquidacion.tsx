import React from "react";
import type { TipoLiquidacion } from "@prisma/client";
import { PdfDespido }        from "./PdfDespido";
import { PdfLrt }            from "./PdfLrt";
import { PdfCapitalizacion } from "./PdfCapitalizacion";
import type { PdfLiquidacionMeta } from "./types";

interface PdfLiquidacionProps {
  tipo:    TipoLiquidacion;
  detalle: any;
  meta?:   PdfLiquidacionMeta;
}

/**
 * Switch por tipo. Devuelve el Document correspondiente al tipo de cálculo.
 * Es el único componente que conoce la correspondencia tipo → PDF.
 */
export function PdfLiquidacion({ tipo, detalle, meta }: PdfLiquidacionProps) {
  switch (tipo) {
    case "DESPIDO":        return <PdfDespido        detalle={detalle} meta={meta} />;
    case "LRT":            return <PdfLrt            detalle={detalle} meta={meta} />;
    case "CAPITALIZACION": return <PdfCapitalizacion detalle={detalle} meta={meta} />;
  }
}