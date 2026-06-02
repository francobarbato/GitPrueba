import { emailLayout, emailButton } from "./_layout";

interface ActivationArgs {
  nombre:   string;
  apellido: string;
  link:     string;
}

export function activationEmailTemplate({ nombre, apellido, link }: ActivationArgs): string {
  const content = `
    <h2 style="margin:0 0 16px 0;color:#1e3a5f;font-size:20px;">
      Bienvenido/a, ${nombre} ${apellido}
    </h2>
    <p style="margin:0 0 16px 0;color:#1a1a1a;font-size:14px;line-height:1.6;">
      Se ha creado una cuenta para vos en el sistema de gestión del estudio.
      Para activarla y elegir tu contraseña, hacé clic en el siguiente botón:
    </p>

    ${emailButton("Activar mi cuenta", link)}

    <p style="margin:24px 0 8px 0;color:#64748b;font-size:12px;">
      Si el botón no funciona, copiá y pegá este enlace en tu navegador:
    </p>
    <p style="margin:0 0 24px 0;color:#1e3a5f;font-size:12px;word-break:break-all;">
      ${link}
    </p>

    <hr style="border:none;border-top:1px solid #e4e4e7;margin:24px 0;">

    <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
      Este enlace de activación expira en <strong>48 horas</strong>.
      Si no esperabas este email, podés ignorarlo de manera segura — sin activación
      la cuenta no se habilita.
    </p>
  `;

  return emailLayout({
    preheader: `Activá tu cuenta para acceder al sistema de gestión del estudio.`,
    content,
  });
}