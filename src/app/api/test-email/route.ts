// ⚠️ Endpoint temporal solo para testear el setup de email.
// BORRAR este archivo después de confirmar que funciona.

import { NextResponse } from "next/server";
import { sendActivationEmail } from "src/lib/email/send";

export async function GET() {
  const res = await sendActivationEmail({
    to:       "franco.barbato@mi.unc.edu.ar",          // ← poné acá tu email personal
    nombre:   "Franco",
    apellido: "Barbato",
    token:    "test-token-123",
    appUrl:   process.env.NEXTAUTH_URL || "http://localhost:3000",
  });

  return NextResponse.json(res);
}