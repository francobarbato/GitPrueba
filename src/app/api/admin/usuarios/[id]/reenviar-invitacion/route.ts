// app/api/admin/usuarios/[id]/reenviar-invitacion/route.ts

import { NextRequest, NextResponse } from "next/server";
import { reenviarInvitacion } from "src/lib/actions/account-activation-actions";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resultado = await reenviarInvitacion(params.id);

    if (!resultado.ok) {
      return NextResponse.json(
        { error: resultado.error },
        { status: resultado.error === "No autorizado." ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: "Invitación reenviada correctamente.",
    });

  } catch (error: any) {
    console.error("Error al reenviar invitación:", error);
    return NextResponse.json(
      { error: error.message || "Error al reenviar invitación" },
      { status: 500 }
    );
  }
}