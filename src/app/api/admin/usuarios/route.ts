// app/api/admin/usuarios/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getUserSessionServer } from "@/auth/actions/auth-actions";
import { UserService } from "@/lib/aplication/services/user.service";
import { crearUsuarioPorInvitacion } from "src/lib/actions/account-activation-actions";
import prisma from "src/lib/db/prisma";

const userService = new UserService();

// ===== GET: Obtener todos los usuarios (con flag de invitación pendiente) =====

export async function GET(req: NextRequest) {
  try {
    const user = await getUserSessionServer();

    if (!user || user.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "No autorizado. Solo administradores pueden ver usuarios." },
        { status: 403 }
      );
    }

    const [usuarios, estadisticas] = await Promise.all([
      userService.obtenerTodos(),
      userService.obtenerEstadisticas(),
    ]);

    // Marcar cuáles son "invitaciones pendientes" — usuarios isActive=false
    // que tienen un token de activación válido sin consumir.
    const userIds = usuarios.map((u: any) => u.id);
    const tokensActivos = await prisma.accountActivationToken.findMany({
      where: {
        userId:    { in: userIds },
        usedAt:    null,
        expiresAt: { gt: new Date() },
      },
      select: { userId: true },
    });
    const userIdsInvitados = new Set(tokensActivos.map(t => t.userId));

    const usuariosConEstado = usuarios.map((u: any) => ({
      ...u,
      estaInvitado: !u.isActive && userIdsInvitados.has(u.id),
    }));

    return NextResponse.json({
      usuarios:     usuariosConEstado,
      estadisticas,
    });

  } catch (error: any) {
    console.error("Error al obtener usuarios:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// ===== POST: Crear nuevo usuario (por invitación, sin password) =====

export async function POST(req: NextRequest) {
  try {
    const user = await getUserSessionServer();

    if (!user || user.rol !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { nombre, apellido, email, rol } = body;

    if (!nombre || !apellido || !email || !rol) {
      return NextResponse.json(
        { error: "Nombre, apellido, email y rol son obligatorios" },
        { status: 400 }
      );
    }

    const resultado = await crearUsuarioPorInvitacion({
      nombre,
      apellido,
      email,
      rol,
    });

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      userId:  resultado.userId,
      email:   email.toLowerCase().trim(),
      mensaje: resultado.error // si llega con error pero ok=true, es porque falló el email
        ? resultado.error
        : `Invitación enviada a ${email}. El usuario recibirá un email para activar su cuenta.`,
    }, { status: 201 });

  } catch (error: any) {
    console.error("Error al crear usuario:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear usuario" },
      { status: 500 }
    );
  }
}