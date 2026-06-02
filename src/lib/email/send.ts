import {
  emailIsConfigured,
  mailgunClient,
  MAILGUN_DOMAIN,
  EMAIL_FROM,
} from "./client";
import { activationEmailTemplate }    from "./templates/activation";
import { passwordResetEmailTemplate } from "./templates/password-reset";

interface SendResult {
  ok: boolean;
  error?: string;
}

/**
 * Envía un email genérico. Si Resend no está configurado (dev sin API key),
 * loguea el contenido en consola y devuelve ok. NO bloquea el flujo —
 * el código que llama puede asumir que el "envío" siempre funciona en dev.
 */
async function sendEmail(args: {
  to:      string;
  subject: string;
  html:    string;
}): Promise<SendResult> {
  if (!emailIsConfigured || !mailgunClient) {
    console.log("─".repeat(60));
    console.log("[email:dev-mock] Mailgun no configurado, mostrando email:");
    console.log("To:     ", args.to);
    console.log("Subject:", args.subject);
    console.log("─".repeat(60));
    console.log(args.html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    console.log("─".repeat(60));
    return { ok: true };
  }

  try {
    await mailgunClient.messages.create(MAILGUN_DOMAIN, {
      from:    EMAIL_FROM,
      to:      [args.to],
      subject: args.subject,
      html:    args.html,
    });
    return { ok: true };
  } catch (err: any) {
    console.error("[email:error]", err);
    return {
      ok:    false,
      error: err?.message ?? "Error desconocido al enviar email",
    };
  }
}

// ── Activación de cuenta (cuando el ADMIN crea un usuario nuevo) ──────────

export async function sendActivationEmail(args: {
  to:       string;
  nombre:   string;
  apellido: string;
  token:    string;
  appUrl:   string;
}): Promise<SendResult> {
  const link = `${args.appUrl}/auth/activate-account/${args.token}`;
  return sendEmail({
    to:      args.to,
    subject: "Activá tu cuenta en el Sistema LegalTech",
    html:    activationEmailTemplate({
      nombre:   args.nombre,
      apellido: args.apellido,
      link,
    }),
  });
}

// ── Reset de contraseña (olvido o disparado por el ADMIN) ─────────────────

export async function sendPasswordResetEmail(args: {
  to:       string;
  nombre:   string;
  apellido: string;
  token:    string;
  appUrl:   string;
}): Promise<SendResult> {
  const link = `${args.appUrl}/auth/reset-password/${args.token}`;
  return sendEmail({
    to:      args.to,
    subject: "Recuperá tu contraseña — Sistema LegalTech",
    html:    passwordResetEmailTemplate({
      nombre:   args.nombre,
      apellido: args.apellido,
      link,
    }),
  });
}