import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { validarTokenReset } from "src/lib/actions/password-reset-actions";
import { ResetPasswordForm } from "./ResetPasswordForm";

interface Props {
  params: { token: string };
}

export default async function ResetPasswordPage({ params }: Props) {
  const validacion = await validarTokenReset(params.token);

  // Token inválido / expirado / usado → pantalla de error
  if (!validacion.valido) {
    const titulo =
      validacion.razon === "expirado" ? "El enlace expiró" :
      validacion.razon === "ya_usado" ? "Este enlace ya fue utilizado" :
                                        "El enlace no es válido";
    const detalle =
      validacion.razon === "expirado"
        ? "Por seguridad, los enlaces de recuperación expiran 1 hora después de ser enviados."
      : validacion.razon === "ya_usado"
        ? "Cada enlace de recuperación se puede usar una sola vez. Si necesitás cambiar tu contraseña de nuevo, generá uno nuevo."
        : "El enlace que estás usando no existe o fue manipulado.";

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
              href="/auth/forgot-password"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition"
            >
              Solicitar un nuevo enlace
            </Link>

            <div className="mt-4">
              <Link
                href="/auth/signin"
                className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Token válido → render del form
  return <ResetPasswordForm token={params.token} email={validacion.email} />;
}