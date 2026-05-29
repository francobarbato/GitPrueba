"use client";

import React from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Printer, Loader2 } from "lucide-react";
import type { TipoLiquidacion } from "@prisma/client";
import { PdfLiquidacion } from "./PdfLiquidacion";
import type { PdfLiquidacionMeta } from "./types";

interface BotonGenerarPdfLiquidacionProps {
  tipo:    TipoLiquidacion;
  detalle: any;
  meta?:   PdfLiquidacionMeta;
  label?:     string;
  variant?:   "primary" | "outline";
  fullWidth?: boolean;
}

// Nombre del archivo descargado. Si está guardado usa el ID; si no, la fecha.
function buildFileName(tipo: TipoLiquidacion, meta?: PdfLiquidacionMeta): string {
  const tipoSlug = {
    DESPIDO: "despido",
    LRT: "lrt",
    CAPITALIZACION: "capitalizacion",
  }[tipo];
  const sufijo = meta?.liquidacionId
    ? meta.liquidacionId.slice(0, 8)
    : new Date().toISOString().slice(0, 10);
  return `calculo-${tipoSlug}-${sufijo}.pdf`;
}

/**
 * Cliente component que envuelve <PDFDownloadLink>.
 * IMPORTANTE: este archivo se importa SIEMPRE con `next/dynamic({ ssr: false })`
 * desde sus consumidores, para que @react-pdf/renderer no rompa el SSR
 * y para no inflar el bundle inicial.
 */
export function BotonGenerarPdfLiquidacion({
  tipo,
  detalle,
  meta,
  label     = "Generar PDF",
  variant   = "primary",
  fullWidth = false,
}: BotonGenerarPdfLiquidacionProps) {

  const fileName = buildFileName(tipo, meta);

  const baseClass    = "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium px-4 py-2 transition-colors";
  const variantClass = variant === "primary"
    ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
    : "border border-slate-300 text-slate-700 hover:bg-slate-50";
  const widthClass   = fullWidth ? "w-full" : "";

  return (
    <PDFDownloadLink
      document={<PdfLiquidacion tipo={tipo} detalle={detalle} meta={meta} />}
      fileName={fileName}
      className={`${baseClass} ${variantClass} ${widthClass}`}
    >
      {({ loading, error }) => {
        if (error)   return (<><Printer size={16} /> Error generando PDF</>);
        if (loading) return (<><Loader2 size={16} className="animate-spin" /> Preparando PDF…</>);
        return (<><Printer size={16} /> {label}</>);
      }}
    </PDFDownloadLink>
  );
}