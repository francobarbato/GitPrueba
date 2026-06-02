import { BRANDING } from "src/lib/branding";

interface LayoutArgs {
  preheader: string;       // texto preview que aparece en la bandeja antes de abrir
  content:   string;       // HTML del cuerpo del email
}

/**
 * Layout base sobrio jurídico. Tipografía sans-serif, paleta neutra,
 * tablas inline para compatibilidad con clientes de email.
 */
export function emailLayout({ preheader, content }: LayoutArgs): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${BRANDING.estudioNombre}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1a1a;">

<!-- Preheader oculto (texto preview en bandeja) -->
<div style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
  ${preheader}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;padding:40px 20px;">
  <tr>
    <td align="center">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e4e4e7;max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1e3a5f;padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:16px;font-weight:bold;letter-spacing:0.5px;">
              ${BRANDING.estudioNombre}
            </p>
            <p style="margin:4px 0 0 0;color:#cbd5e1;font-size:11px;letter-spacing:0.5px;text-transform:uppercase;">
              ${BRANDING.estudioSubtitulo}
            </p>
          </td>
        </tr>

        <!-- Contenido -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;border-top:1px solid #e4e4e7;padding:20px 32px;">
            <p style="margin:0;color:#64748b;font-size:11px;text-align:center;line-height:1.5;">
              Este es un mensaje automático del ${BRANDING.sistemaNombre}.<br>
              ${BRANDING.estudioDireccion}
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}

/**
 * Botón CTA reutilizable (HTML inline para email).
 */
export function emailButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
  <tr>
    <td style="background:#1e3a5f;border-radius:4px;">
      <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}