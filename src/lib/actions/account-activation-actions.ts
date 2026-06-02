"use server";

import prisma from "src/lib/db/prisma";
import bcrypt from "bcryptjs";
import { generarToken, fechaDeVencimiento, TOKEN_TTL } from "src/lib/auth/tokens";
import { validatePasswordStrength } from "src/lib/auth/password-validation";
import { sendActivationEmail } from "src/lib/email/send";
import { getUserSessionServer } from "@/auth/actions/auth-actions";

// ── 1. Crear usuario por invitación (lo dispara el ADMIN) ─────────────────────

interface CrearUsuarioInvitacionInput {
  email:    string;
  nombre:   string;
  apellido: string;
  rol:      "ADMIN" | "ABOGADO" | "ASISTENTE";
}

interface ResultadoInvitacion {
  ok:     boolean;
  error?: string;
  // Devolvemos el id solo si el admin necesita referenciarlo después;
  // el password queda sin setear hasta que el usuario active.
  userId?: string;
}

export async function crearUsuarioPorInvitacion(
  input: CrearUsuarioInvitacionInput
): Promise<ResultadoInvitacion> {

  // Solo ADMIN puede invitar usuarios
  const session = await getUserSessionServer();
  if (!session || session.rol !== "ADMIN") {
    return { ok: false, error: "No autorizado." };
  }

  // Normalizaciones
  const email    = input.email.toLowerCase().trim();
  const nombre   = input.nombre.trim();
  const apellido = input.apellido.trim();

  // Validaciones de input
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "El email no tiene un formato válido." };
  }
  if (!nombre || !apellido) {
    return { ok: false, error: "Nombre y apellido son obligatorios." };
  }
  if (!["ADMIN", "ABOGADO", "ASISTENTE"].includes(input.rol)) {
    return { ok: false, error: "Rol inválido. Los CLIENTE se vinculan desde el módulo de clientes." };
  }

  // Verificar que el email no esté en uso por otro usuario activo
  const existente = await prisma.user.findUnique({
    where:  { email },
    select: { id: true, isActive: true },
  });
  if (existente) {
    return {
      ok:    false,
      error: existente.isActive
        ? "Ya existe un usuario activo con ese email."
        : "Ese email pertenece a un usuario desactivado. Reactivalo en lugar de crear uno nuevo.",
    };
  }

  // Crear usuario con isActive=false y sin password (los seteará el usuario al activar).
  // También un AccountActivationToken válido por 48h y disparar el email,
  // todo dentro de una transacción para mantener consistencia.

  const token  = generarToken();
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const usuarioCreado = await prisma.$transaction(async (tx) => {
    const nuevoUser = await tx.user.create({
      data: {
        email,
        nombre,
        apellido,
        name:      `${nombre} ${apellido}`,
        rol:       input.rol,
        password:  null,
        isActive:  false,             // se activa al confirmar el token
        creadoPor: session.id,
      },
    });

    await tx.accountActivationToken.create({
      data: {
        token,
        userId:    nuevoUser.id,
        expiresAt: fechaDeVencimiento(TOKEN_TTL.ACCOUNT_ACTIVATION),
      },
    });

    await tx.bitacora.create({
      data: {
        texto:     `Usuario invitado: ${email} (rol ${input.rol})`,
        tipo:      "auto",
        accion:    "Invitación de Usuario",
        usuarioId: session.id,
      },
    });

    return nuevoUser;
  });

  // Mandar el email FUERA de la transacción.
  // Si falla el email, el usuario ya existe y el ADMIN puede reenviar la invitación.
  const envio = await sendActivationEmail({
    to:       email,
    nombre,
    apellido,
    token,
    appUrl,
  });

  if (!envio.ok) {
    return {
      ok:     true,
      userId: usuarioCreado.id,
      error:  "Usuario creado, pero falló el envío del email de activación. Reenvialo desde el panel.",
    };
  }

  return { ok: true, userId: usuarioCreado.id };
}

// ── 2. Reenviar invitación (si se venció o se perdió el mail) ────────────────

export async function reenviarInvitacion(userId: string): Promise<{ ok: boolean; error?: string }> {
  const session = await getUserSessionServer();
  if (!session || session.rol !== "ADMIN") {
    return { ok: false, error: "No autorizado." };
  }

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, nombre: true, apellido: true, isActive: true, password: true },
  });

  if (!usuario) {
    return { ok: false, error: "Usuario no encontrado." };
  }
  // Si el usuario ya activó (tiene password e isActive), no tiene sentido reenviar
  if (usuario.isActive && usuario.password) {
    return { ok: false, error: "Este usuario ya tiene la cuenta activada. Si necesita cambiar la contraseña, usá Recuperar contraseña." };
  }

  // Borrar token previo (si existe) y crear uno nuevo
  await prisma.accountActivationToken.deleteMany({ where: { userId } });

  const token  = generarToken();
  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  await prisma.accountActivationToken.create({
    data: {
      token,
      userId,
      expiresAt: fechaDeVencimiento(TOKEN_TTL.ACCOUNT_ACTIVATION),
    },
  });

  await prisma.bitacora.create({
    data: {
      texto:     `Reenvío de invitación a ${usuario.email}`,
      tipo:      "auto",
      accion:    "Reenvío Invitación",
      usuarioId: session.id,
    },
  });

  const envio = await sendActivationEmail({
    to:       usuario.email,
    nombre:   usuario.nombre ?? "",
    apellido: usuario.apellido ?? "",
    token,
    appUrl,
  });

  if (!envio.ok) {
    return { ok: false, error: "El usuario quedó con un token nuevo, pero falló el envío del email." };
  }

  return { ok: true };
}

// ── 3. Validar token de activación (para el server component de la página) ───

export type ValidacionActivacion =
  | { valido: true;  email: string; nombre: string; apellido: string }
  | { valido: false; razon: "no_encontrado" | "expirado" | "ya_usado" | "cuenta_ya_activa" };

export async function validarTokenActivacion(token: string): Promise<ValidacionActivacion> {
  if (!token || token.length < 16) {
    return { valido: false, razon: "no_encontrado" };
  }

  const reg = await prisma.accountActivationToken.findUnique({
    where:   { token },
    include: {
      user: { select: { email: true, nombre: true, apellido: true, isActive: true, password: true } },
    },
  });

  if (!reg)              return { valido: false, razon: "no_encontrado" };
  if (reg.usedAt)        return { valido: false, razon: "ya_usado" };
  if (reg.expiresAt < new Date()) return { valido: false, razon: "expirado" };

  // Edge case: cuenta ya activa (capaz el ADMIN tocó isActive manualmente)
  if (reg.user.isActive && reg.user.password) {
    return { valido: false, razon: "cuenta_ya_activa" };
  }

  return {
    valido:   true,
    email:    reg.user.email,
    nombre:   reg.user.nombre ?? "",
    apellido: reg.user.apellido ?? "",
  };
}

// ── 4. Confirmar activación (el usuario eligió password y aprieta submit) ────

interface ConfirmarActivacionInput {
  token:           string;
  password:        string;
  passwordRepetir: string;
}

interface ResultadoActivacion {
  ok:        boolean;
  error?:    string;
  detalles?: string[];
}

export async function confirmarActivacionCuenta(
  input: ConfirmarActivacionInput
): Promise<ResultadoActivacion> {

  // 1. Coincidencia y fortaleza
  if (input.password !== input.passwordRepetir) {
    return { ok: false, error: "Las contraseñas no coinciden." };
  }
  const check = validatePasswordStrength(input.password);
  if (!check.valid) {
    return {
      ok:       false,
      error:    "La contraseña no cumple con los requisitos de seguridad.",
      detalles: check.errors,
    };
  }

  // 2. Revalidar token (puede haber expirado o sido usado entre el form y el submit)
  const validacion = await validarTokenActivacion(input.token);
  if (!validacion.valido) {
    const motivo =
      validacion.razon === "expirado"         ? "El enlace de activación expiró. Pedile al administrador que reenvíe la invitación." :
      validacion.razon === "ya_usado"         ? "Este enlace ya fue utilizado. Si olvidaste tu contraseña, usá Recuperar contraseña." :
      validacion.razon === "cuenta_ya_activa" ? "Esta cuenta ya está activada. Iniciá sesión normalmente." :
                                                 "El enlace no es válido.";
    return { ok: false, error: motivo };
  }

  // 3. Setear password + activar la cuenta + consumir token (transacción)
  const reg = await prisma.accountActivationToken.findUnique({
    where: { token: input.token },
  });
  if (!reg) {
    return { ok: false, error: "El enlace no es válido." };
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: reg.userId },
      data: {
        password:             passwordHash,
        isActive:             true,
        debeResetearPassword: false,
      },
    }),
    prisma.accountActivationToken.update({
      where: { token: input.token },
      data:  { usedAt: new Date() },
    }),
    prisma.bitacora.create({
      data: {
        texto:     `Cuenta activada por el usuario`,
        tipo:      "auto",
        accion:    "Activación de Cuenta",
        usuarioId: reg.userId,
      },
    }),
  ]);

  return { ok: true };
}