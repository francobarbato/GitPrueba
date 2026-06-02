"use server";

import prisma from "src/lib/db/prisma";
import bcrypt from "bcryptjs";
import { generarToken, fechaDeVencimiento, TOKEN_TTL } from "src/lib/auth/tokens";
import { validatePasswordStrength } from "src/lib/auth/password-validation";
import { sendPasswordResetEmail } from "src/lib/email/send";

// ── 1. Solicitar reset (forgot-password) ─────────────────────────────────────

interface SolicitarResetInput {
  email: string;
}

interface ResultadoSolicitud {
  ok: boolean;
  // Mensaje neutro para mostrar al usuario — siempre el mismo, independiente
  // de si el email existe o no. Esto evita filtrar información a un atacante.
  mensaje: string;
}

export async function solicitarResetPassword(
  input: SolicitarResetInput
): Promise<ResultadoSolicitud> {
  const email = input.email?.toLowerCase().trim();

  // Validación mínima del input
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, mensaje: "Ingresá un email válido." };
  }

  // Mensaje neutro que se devuelve siempre (haya o no usuario).
  // Es a propósito — no filtra si el email existe en el sistema.
  const respuestaNeutra: ResultadoSolicitud = {
    ok:      true,
    mensaje: "Si el email está registrado en el sistema, vas a recibir un correo con instrucciones para restablecer tu contraseña.",
  };

  // Buscar usuario por email. Si no existe o está inactivo, devolvemos OK
  // neutro igual (no le decimos al atacante si la cuenta existe).
  const usuario = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, nombre: true, apellido: true, email: true, isActive: true },
  });

  if (!usuario || !usuario.isActive) {
    return respuestaNeutra;
  }

  // Invalidar tokens anteriores del mismo usuario que sigan activos.
  // Así si el usuario pidió varios resets en cortos minutos, solo el último vale.
  await prisma.passwordResetToken.updateMany({
    where: {
      userId:    usuario.id,
      usedAt:    null,
      expiresAt: { gt: new Date() },
    },
    data: { usedAt: new Date() },
  });

  // Crear nuevo token
  const token = generarToken();
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId:    usuario.id,
      expiresAt: fechaDeVencimiento(TOKEN_TTL.PASSWORD_RESET),
    },
  });

  // Enviar el email
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  await sendPasswordResetEmail({
    to:       usuario.email,
    nombre:   usuario.nombre || "",
    apellido: usuario.apellido || "",
    token,
    appUrl,
  });

  return respuestaNeutra;
}

// ── 2. Validar token (server component lo usa antes de mostrar form) ─────────

export type ValidacionToken =
  | { valido: true;  email: string }
  | { valido: false; razon: "no_encontrado" | "expirado" | "ya_usado" };

export async function validarTokenReset(token: string): Promise<ValidacionToken> {
  if (!token || token.length < 16) {
    return { valido: false, razon: "no_encontrado" };
  }

  const reg = await prisma.passwordResetToken.findUnique({
    where:   { token },
    include: { user: { select: { email: true } } },
  });

  if (!reg)              return { valido: false, razon: "no_encontrado" };
  if (reg.usedAt)        return { valido: false, razon: "ya_usado" };
  if (reg.expiresAt < new Date()) return { valido: false, razon: "expirado" };

  return { valido: true, email: reg.user.email };
}

// ── 3. Confirmar reset (cambio de password efectivo) ─────────────────────────

interface ConfirmarResetInput {
  token:           string;
  passwordNueva:   string;
  passwordRepetir: string;
}

interface ResultadoConfirmacion {
  ok:       boolean;
  error?:   string;
  detalles?: string[];
}

export async function confirmarResetPassword(
  input: ConfirmarResetInput
): Promise<ResultadoConfirmacion> {

  // 1. Las dos contraseñas coinciden
  if (input.passwordNueva !== input.passwordRepetir) {
    return { ok: false, error: "Las contraseñas no coinciden." };
  }

  // 2. Cumple los requisitos de fortaleza
  const check = validatePasswordStrength(input.passwordNueva);
  if (!check.valid) {
    return {
      ok:       false,
      error:    "La contraseña no cumple con los requisitos de seguridad.",
      detalles: check.errors,
    };
  }

  // 3. Validar el token de nuevo (puede haber expirado o sido usado entre
  //    el render del form y el submit)
  const validacion = await validarTokenReset(input.token);
  if (!validacion.valido) {
    const motivo =
      validacion.razon === "expirado"     ? "El enlace de recuperación expiró. Solicitá uno nuevo." :
      validacion.razon === "ya_usado"     ? "Este enlace ya fue utilizado. Solicitá uno nuevo si lo necesitás." :
                                             "El enlace no es válido.";
    return { ok: false, error: motivo };
  }

  // 4. Buscar el token + usuario y aplicar cambio en una transacción
  const reg = await prisma.passwordResetToken.findUnique({
    where: { token: input.token },
  });
  if (!reg) {
    return { ok: false, error: "El enlace no es válido." };
  }

  // 4.b  validar que la nueva contraseña no sea igual a la actual
  const usuarioActual = await prisma.user.findUnique({
    where:  { id: reg.userId },
    select: { password: true },
  });

  if (usuarioActual?.password) {
    const esLaMisma = await bcrypt.compare(input.passwordNueva, usuarioActual.password);
    if (esLaMisma) {
      return {
        ok:    false,
        error: "La nueva contraseña no puede ser igual a la actual. Elegí una diferente.",
      };
    }
  }

  const passwordHash = await bcrypt.hash(input.passwordNueva, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reg.userId },
      data: {
        password:             passwordHash,
        debeResetearPassword: false,
      },
    }),
    prisma.passwordResetToken.update({
      where: { token: input.token },
      data:  { usedAt: new Date() },
    }),
    prisma.bitacora.create({
      data: {
        texto:     `Contraseña restablecida vía recuperación por email`,
        tipo:      "auto",
        accion:    "Reset Password",
        usuarioId: reg.userId,
      },
    }),
  ]);

  return { ok: true };
}

// ── 4. Reset disparado por el ADMIN desde el panel ───────────────────────────

import { getUserSessionServer } from "@/auth/actions/auth-actions";

export async function adminSolicitarReset(userId: string): Promise<{
  ok:            boolean;
  error?:        string;
  emailEnviado?: string;
}> {
  const session = await getUserSessionServer();
  if (!session || session.rol !== "ADMIN") {
    return { ok: false, error: "No autorizado." };
  }

  const usuario = await prisma.user.findUnique({
    where:  { id: userId },
    select: { id: true, nombre: true, apellido: true, email: true, isActive: true },
  });

  if (!usuario) {
    return { ok: false, error: "Usuario no encontrado." };
  }
  if (!usuario.isActive) {
    return { ok: false, error: "El usuario está inactivo. Reactivalo antes de resetear la contraseña." };
  }

  // Invalidar tokens anteriores del mismo user que sigan activos
  await prisma.passwordResetToken.updateMany({
    where: { userId: usuario.id, usedAt: null, expiresAt: { gt: new Date() } },
    data:  { usedAt: new Date() },
  });

  const token  = generarToken();
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId:    usuario.id,
      expiresAt: fechaDeVencimiento(TOKEN_TTL.PASSWORD_RESET),
    },
  });

  await prisma.bitacora.create({
    data: {
      texto:     `Reset de contraseña disparado por admin para: ${usuario.email}`,
      tipo:      "auto",
      accion:    "Reset Password por Admin",
      usuarioId: session.id,
    },
  });

  const envio = await sendPasswordResetEmail({
    to:       usuario.email,
    nombre:   usuario.nombre ?? "",
    apellido: usuario.apellido ?? "",
    token,
    appUrl,
  });

  if (!envio.ok) {
    return { ok: false, error: "Se generó el token pero falló el envío del email." };
  }

  return { ok: true, emailEnviado: usuario.email };
}