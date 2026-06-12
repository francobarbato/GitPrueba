// src/lib/email/templates/alerta-vencimiento.ts

interface AlertaVencimientoTemplateProps {
  nombre: string
  apellido: string
  tituloEvento: string
  diasHabilesRestantes: number
  fechaVencimientoFormateada: string
  numeroExpediente: string | null
  tituloExpediente: string | null
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "FATAL"
  link: string
}

const PRIORIDAD_LABEL: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  FATAL: "Fatal — Plazo improrrogable",
}

export function alertaVencimientoTemplate(props: AlertaVencimientoTemplateProps): string {
  const { nombre, apellido, tituloEvento, diasHabilesRestantes, fechaVencimientoFormateada,
          numeroExpediente, tituloExpediente, prioridad, link } = props

  const esVencido = diasHabilesRestantes <= 0
  const tituloHeader = esVencido
    ? "Tenés un evento vencido"
    : `Tu evento vence en ${diasHabilesRestantes} día${diasHabilesRestantes === 1 ? "" : "s"} hábil${diasHabilesRestantes === 1 ? "" : "es"}`

  const colorHeader = esVencido
    ? "#dc2626" // red-600
    : diasHabilesRestantes <= 5
      ? "#ea580c"  // orange-600
      : diasHabilesRestantes <= 10
        ? "#d97706"  // amber-600
        : "#2563eb"  // blue-600

  const esFatal = prioridad === "FATAL"

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vencimiento próximo</title>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:${colorHeader};padding:24px 32px;">
              <div style="font-size:14px;color:rgba(255,255,255,0.85);font-weight:500;letter-spacing:0.5px;text-transform:uppercase;margin-bottom:4px;">
                ${esVencido ? "Plazo vencido" : "Próximo vencimiento"}
              </div>
              <h1 style="margin:0;font-size:24px;color:#ffffff;font-weight:700;line-height:1.3;">
                ${tituloHeader}
              </h1>
            </td>
          </tr>

          <!-- Saludo -->
          <tr>
            <td style="padding:32px 32px 0 32px;">
              <p style="margin:0 0 16px 0;font-size:16px;color:#334155;line-height:1.5;">
                Hola <strong>${nombre}${apellido ? " " + apellido : ""}</strong>,
              </p>
              <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.6;">
                ${esVencido
                  ? "Tenés un evento que ya pasó su fecha de vencimiento y aún sigue abierto. Es importante que lo revises lo antes posible."
                  : `Tenés un evento próximo a vencer y queremos asegurarnos de que esté en tu radar.`}
              </p>
            </td>
          </tr>

          <!-- Card del evento -->
          <tr>
            <td style="padding:0 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <tr>
                  <td style="padding:20px;">

                    ${esFatal ? `
                    <div style="display:inline-block;background-color:#dc2626;color:#ffffff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:12px;letter-spacing:0.5px;">
                      ⚠ PRIORIDAD FATAL
                    </div>
                    ` : prioridad === "ALTA" ? `
                    <div style="display:inline-block;background-color:#fef3c7;color:#92400e;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;margin-bottom:12px;letter-spacing:0.5px;">
                      PRIORIDAD ALTA
                    </div>
                    ` : ""}

                    <h2 style="margin:0 0 16px 0;font-size:18px;color:#0f172a;font-weight:600;line-height:1.4;">
                      ${escapeHtml(tituloEvento)}
                    </h2>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;width:140px;vertical-align:top;">
                          Vencimiento
                        </td>
                        <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:500;">
                          ${fechaVencimientoFormateada}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;width:140px;vertical-align:top;">
                          ${esVencido ? "Días hábiles vencidos" : "Días hábiles restantes"}
                        </td>
                        <td style="padding:6px 0;font-size:14px;color:#0f172a;font-weight:500;">
                          ${esVencido ? Math.abs(diasHabilesRestantes) : diasHabilesRestantes} día${Math.abs(diasHabilesRestantes) === 1 ? "" : "s"}
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;width:140px;vertical-align:top;">
                          Prioridad
                        </td>
                        <td style="padding:6px 0;font-size:14px;color:#0f172a;">
                          ${PRIORIDAD_LABEL[prioridad] ?? prioridad}
                        </td>
                      </tr>
                      ${numeroExpediente ? `
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#64748b;width:140px;vertical-align:top;">
                          Expediente
                        </td>
                        <td style="padding:6px 0;font-size:14px;color:#0f172a;">
                          <span style="font-family:monospace;color:#2563eb;font-weight:600;">${escapeHtml(numeroExpediente)}</span>
                          ${tituloExpediente ? `<br><span style="font-size:13px;color:#64748b;">${escapeHtml(tituloExpediente)}</span>` : ""}
                        </td>
                      </tr>
                      ` : ""}
                    </table>

                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:24px 32px 32px 32px;" align="center">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:6px;background-color:${colorHeader};">
                    <a href="${link}"
                       style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">
                      Ver evento en el sistema
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-size:12px;color:#94a3b8;">
                O copiá este link:<br>
                <a href="${link}" style="color:#64748b;word-break:break-all;">${link}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;text-align:center;">
                Este es un mensaje automático del Sistema de Gestión Legal de <strong style="color:#475569;">Azar y Asociados</strong>.<br>
                Los días hábiles excluyen sábados, domingos y feriados nacionales.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}