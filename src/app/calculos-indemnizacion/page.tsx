import { redirect } from "next/navigation";
import { getUserSessionServer } from "@/auth/actions/auth-actions";
import CalculadoraIndemnizacionesClient from "./CalculadoraIndemnizacionesClient";

// ============================================================================
// SERVER COMPONENT — controla acceso por rol
// ============================================================================
// Acceso permitido: ABOGADO y ASISTENTE.
// CLIENTE redirige al portal (ya lo hace el middleware, pero defensa en profundidad).
// ADMIN redirige al inicio (rol técnico, sin acceso a datos legales).
// ============================================================================

export default async function CalculadoraIndemnizacionesPage() {
  const user = await getUserSessionServer();

  if (!user) redirect("/auth/login");

  const accesoPermitido = user.rol === "ABOGADO" || user.rol === "ASISTENTE";
  if (!accesoPermitido) {
    // CLIENTE → portal; ADMIN u otros → inicio
    redirect(user.rol === "CLIENTE" ? "/portal" : "/");
  }

  return <CalculadoraIndemnizacionesClient />;
}