import { emailLayout, emailButton } from "./_layout";

interface PasswordResetArgs {
  nombre:   string;
  apellido: string;
  link:     string;
}

export function passwordResetEmailTemplate({ nombre, apellido, link }: PasswordResetArgs): string {
  const content = `
    <h2 style="margin:0 0 16px 0;color:#1e3a5f;font-size:20px;">
      Recuperación de contraseña
    </h2>
    <p style="margin:0 0 16px 0;color:#1a1a1a;font-size:14px;line-height:1.6;">
      Hola ${nombre} ${apellido}, recibimos una solicitud para restablecer la contraseña
      de tu cuenta. Para elegir una nueva, hacé clic en el siguiente botón:
    </p>

    ${emailButton("Cambiar mi contraseña", link)}

    <p style="margin:24px 0 8px 0;color:#64748b;font-size:12px;">
      Si el botón no funciona, copiá y pegá este enlace en tu navegador:
    </p>
    <p style="margin:0 0 24px 0;color:#1e3a5f;font-size:12px;word-break:break-all;">
      ${link}
    </p>

    <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">

    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
      Este enlace expira en <strong>1 hora</strong> por motivos de seguridad.
      Si no fuiste vos quien solicitó este cambio, podés ignorar este email —
      tu contraseña actual sigue siendo válida.
    </p>
  `;

  return emailLayout({
    preheader: `Solicitud de recuperación de contraseña recibida.`,
    content,
  });
}