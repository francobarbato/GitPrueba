// app/api/admin/usuarios/[id]/cambiar-password/route.ts

import { NextRequest, NextResponse } from "next/server";
import { adminSolicitarReset } from "src/lib/actions/password-reset-actions";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const resultado = await adminSolicitarReset(params.id);

    if (!resultado.ok) {
      return NextResponse.json(
        { error: resultado.error },
        { status: resultado.error === "No autorizado." ? 403 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      mensaje: `Se envió un email a ${resultado.emailEnviado} con instrucciones para restablecer la contraseña.`,
    });

  } catch (error: any) {
    console.error("Error al resetear contraseña:", error);
    return NextResponse.json(
      { error: error.message || "Error al resetear contraseña" },
      { status: 500 }
    );
  }
}