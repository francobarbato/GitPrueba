import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { validarTokenActivacion } from "src/lib/actions/account-activation-actions";
import { ActivateAccountForm } from "./ActivateAccountForm";

interface Props {
  params: { token: string };
}

export default async function ActivateAccountPage({ params }: Props) {
  const validacion = await validarTokenActivacion(params.token);

  // Token inválido / expirado / usado → pantalla de error
  if (!validacion.valido) {
    const titulo =
      validacion.razon === "expirado"         ? "El enlace de activación expiró" :
      validacion.razon === "ya_usado"         ? "Este enlace ya fue utilizado" :
      validacion.razon === "cuenta_ya_activa" ? "Esta cuenta ya está activada" :
                                                "El enlace no es válido";

    const detalle =
      validacion.razon === "expirado"
        ? "Los enlaces de invitación expiran 48 horas después de ser enviados. Comunicate con el administrador del estudio para que te reenvíe la invitación."
      : validacion.razon === "ya_usado"
        ? "Esta invitación ya fue usada para activar la cuenta. Si olvidaste tu contraseña, podés recuperarla desde el inicio de sesión."
      : validacion.razon === "cuenta_ya_activa"
        ? "Esta cuenta ya está activa. Iniciá sesión normalmente."
        : "El enlace que estás usando no existe o fue manipulado.";

    // En todos los casos, el botón principal lleva al signin.
    // Acá NO ofrecemos "Recuperar contraseña" porque un usuario que nunca
    // activó NO tiene password que recuperar — eso era un bug previo.
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-red-50 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{titulo}</h1>
            <p className="text-sm text-slate-600 mb-6">{detalle}</p>

            <Link
              href="/auth/signin"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
            >
              Ir al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Token válido → render del form de activación
  return (
    <ActivateAccountForm
      token={params.token}
      email={validacion.email}
      nombre={validacion.nombre}
      apellido={validacion.apellido}
    />
  );
}