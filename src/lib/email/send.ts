import {
  emailIsConfigured,
  mailgunClient,
  MAILGUN_DOMAIN,
  EMAIL_FROM,
} from "./client";
import { activationEmailTemplate }    from "./templates/activation";
import { passwordResetEmailTemplate } from "./templates/password-reset";
import { alertaVencimientoTemplate } from "./templates/alerta-vencimiento"

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

// ── Alerta de vencimiento (cron diario de mails a 8 AM Argentina) ─────────
export async function sendAlertaVencimientoEmail(args: {
  to: string
  nombre: string
  apellido: string
  tituloEvento: string
  diasHabilesRestantes: number
  fechaVencimientoFormateada: string
  numeroExpediente: string | null
  tituloExpediente: string | null
  prioridad: "BAJA" | "MEDIA" | "ALTA" | "FATAL"
  tareaId: string
  appUrl: string
}): Promise<SendResult> {
  const link = `${args.appUrl}/gestion-tareas?tareaAbierta=${args.tareaId}`
 
  const subjectPrefix = args.diasHabilesRestantes <= 0
    ? "Plazo vencido"
    : args.diasHabilesRestantes === 1
      ? "Vence mañana (1 día hábil)"
      : `Vence en ${args.diasHabilesRestantes} días hábiles`
 
  return sendEmail({
    to:      args.to,
    subject: `[${subjectPrefix}] ${args.tituloEvento}`,
    html:    alertaVencimientoTemplate({
      nombre:                     args.nombre,
      apellido:                   args.apellido,
      tituloEvento:               args.tituloEvento,
      diasHabilesRestantes:       args.diasHabilesRestantes,
      fechaVencimientoFormateada: args.fechaVencimientoFormateada,
      numeroExpediente:           args.numeroExpediente,
      tituloExpediente:           args.tituloExpediente,
      prioridad:                  args.prioridad,
      link,
    }),
  })
}