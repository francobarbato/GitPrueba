import type { TipoLiquidacion } from "@prisma/client";

/**
 * Metadatos opcionales del cálculo. Si vienen, se muestran en header/footer.
 * Cuando el PDF se genera desde la calculadora sin guardar, no viene nada.
 * Cuando se genera desde un cálculo guardado en el expediente, vienen todos.
 */
export interface PdfLiquidacionMeta {
  liquidacionId?: string;
  createdAt?:     Date | string;
  creadoPor?:     { nombre: string | null; apellido: string | null };
  caso?:          { numero: string; titulo: string };
}

export interface PdfLiquidacionProps {
  tipo:    TipoLiquidacion;
  detalle: any;
  meta?:   PdfLiquidacionMeta;
}