import { StyleSheet } from "@react-pdf/renderer";

// Times-Roman / Times-Bold / Courier son fonts standard del PDF, no requieren register().
// Sobrio jurídico: paleta blanco/negro/grises, bordes finos, sin acentos cromáticos.

export const COLORS = {
  black:        "#000000",
  textPrimary:  "#1a1a1a",
  textMuted:    "#555555",
  textSubtle:   "#888888",
  border:       "#bfbfbf",
  borderDark:   "#7a7a7a",
  bgSection:    "#ececec",
  bgSubtotal:   "#dedede",
  bgMultas:     "#f4f4f4",
} as const;

export const styles = StyleSheet.create({

  // ── Página ────────────────────────────────────────────────────────────────
  page: {
    paddingTop:        40,
    paddingHorizontal: 40,
    paddingBottom:     60,
    fontFamily:        "Times-Roman",
    fontSize:          10,
    color:             COLORS.textPrimary,
    lineHeight:        1.3,
  },

  // ── Header ────────────────────────────────────────────────────────────────
  headerWrap: {
    flexDirection:     "row",
    justifyContent:    "space-between",
    alignItems:        "flex-start",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.black,
    paddingBottom:     8,
  },
  headerLeft:  { flex: 1.4 },
  headerRight: { alignItems: "flex-end", flex: 1 },
  estudioNombre: {
    fontFamily:    "Times-Bold",
    fontSize:      13,
    letterSpacing: 0.5,
  },
  estudioSub: {
    fontSize:      8,
    color:         COLORS.textMuted,
    marginTop:     2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaLabel: {
    fontSize:      7.5,
    color:         COLORS.textSubtle,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaValue: {
    fontFamily:   "Times-Bold",
    fontSize:     9,
    marginBottom: 3,
  },

  // ── Box de expediente vinculado ───────────────────────────────────────────
  expedienteBox: {
    marginTop:        10,
    paddingVertical:   5,
    paddingHorizontal: 8,
    borderWidth:       0.5,
    borderColor:       COLORS.borderDark,
    backgroundColor:   COLORS.bgSection,
  },
  expedienteRow: {
    flexDirection:  "row",
    justifyContent: "space-between",
    alignItems:     "center",
  },
  expedienteLabel: {
    fontSize:      8,
    color:         COLORS.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  expedienteNumero: {
    fontFamily: "Times-Bold",
    fontSize:   10.5,
  },
  expedienteCaratula: {
    fontSize:  9,
    marginTop: 2,
  },

  // ── Título del documento ──────────────────────────────────────────────────
  title: {
    fontFamily:        "Times-Bold",
    fontSize:          13,
    textAlign:         "center",
    textTransform:     "uppercase",
    letterSpacing:     1,
    marginTop:         18,
    marginBottom:      14,
    paddingBottom:     6,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.black,
  },

  // ── Header de sección ─────────────────────────────────────────────────────
  sectionHeader: {
    backgroundColor:   COLORS.bgSection,
    paddingVertical:   4,
    paddingHorizontal: 8,
    fontFamily:        "Times-Bold",
    fontSize:          9.5,
    textTransform:     "uppercase",
    letterSpacing:     0.5,
    borderTopWidth:    0.5,
    borderTopColor:    COLORS.borderDark,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.borderDark,
    marginTop:         10,
  },
  sectionHeaderMultas: {
    backgroundColor: COLORS.bgMultas,
  },

  // ── Fila de tabla ─────────────────────────────────────────────────────────
  row: {
    flexDirection:     "row",
    paddingVertical:   3.5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.3,
    borderBottomColor: COLORS.border,
  },
  rowSubtotal: {
    backgroundColor: COLORS.bgSubtotal,
    borderTopWidth:  0.5,
    borderTopColor:  COLORS.borderDark,
  },
  rowTotal: {
    backgroundColor:  COLORS.black,
    paddingVertical:  7,
    borderTopWidth:   1,
    borderTopColor:   COLORS.black,
    borderBottomWidth: 0,
  },

  // Celdas dentro de la fila
  cellLabel: {
    flex:     1,
    fontSize: 10,
  },
  cellLabelBold: {
    flex:       1,
    fontSize:   10.5,
    fontFamily: "Times-Bold",
  },
  cellLabelIndent: {
    flex:        1,
    paddingLeft: 16,
    fontSize:    9,
    color:       COLORS.textMuted,
  },
  cellLabelTotal: {
    flex:          1,
    fontSize:      11,
    fontFamily:    "Times-Bold",
    color:         "#ffffff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cellMonto: {
    width:      140,
    textAlign:  "right",
    fontFamily: "Courier",
    fontSize:   9.5,
  },
  cellMontoBold: {
    width:      140,
    textAlign:  "right",
    fontFamily: "Courier-Bold",
    fontSize:   10,
  },
  cellMontoTotal: {
    width:      140,
    textAlign:  "right",
    fontFamily: "Courier-Bold",
    fontSize:   11,
    color:      "#ffffff",
  },

  // ── Disclaimer y notas ────────────────────────────────────────────────────
  disclaimer: {
    fontSize:          8,
    color:             COLORS.textMuted,
    textAlign:         "center",
    marginTop:         14,
    paddingHorizontal: 20,
  },
  notaFormula: {
    fontSize:          8,
    color:             COLORS.textSubtle,
    paddingHorizontal: 8,
    paddingVertical:   4,
    backgroundColor:   "#fafafa",
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position:          "absolute",
    bottom:            25,
    left:              40,
    right:             40,
    borderTopWidth:    0.5,
    borderTopColor:    COLORS.border,
    paddingTop:        6,
    flexDirection:     "row",
    justifyContent:    "space-between",
    fontSize:          7.5,
    color:             COLORS.textSubtle,
  },
  footerLeft:   { flex: 2 },
  footerCenter: { flex: 2, textAlign: "center" },
  footerRight:  { flex: 1, textAlign: "right" },
});

// ── Helpers de formato ──────────────────────────────────────────────────────

export const fmtMonto = (n: number | string | null | undefined): string => {
  if (n === null || n === undefined) return "—";
  const num = typeof n === "string" ? Number(n) : n;
  if (isNaN(num)) return "—";
  return `$ ${num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fmtFecha = (d: Date | string | undefined | null): string => {
  if (!d) return "—";
  if (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, dia] = d.split("-");
    return `${dia}/${m}/${y}`;
  }
  return new Date(d).toLocaleDateString("es-AR");
};

export const fmtFechaHora = (d: Date | string): string =>
  new Date(d).toLocaleString("es-AR", {
    day:    "2-digit",
    month:  "2-digit",
    year:   "numeric",
    hour:   "2-digit",
    minute: "2-digit",
  });

export const fmtNumero = (n: number, decimales = 4): string =>
  n.toLocaleString("es-AR", { maximumFractionDigits: decimales });