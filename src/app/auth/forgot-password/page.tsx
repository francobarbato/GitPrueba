"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Loader2 } from "lucide-react";
import { solicitarResetPassword } from "src/lib/actions/password-reset-actions";

export default function ForgotPasswordPage() {
  const [email,     setEmail]     = useState("");
  const [enviando,  setEnviando]  = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; mensaje: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setResultado(null);

    const res = await solicitarResetPassword({ email });

    setResultado(res);
    setEnviando(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-4">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Recuperar contraseña</h1>
            <p className="text-slate-600 mt-2 text-sm">
              Ingresá tu email y te enviaremos un enlace para restablecerla.
            </p>
          </div>

          {/* Mensaje de resultado (neutro, siempre el mismo) */}
          {resultado && (
            <div
              className={`mb-6 p-4 rounded border-l-4 ${
                resultado.ok
                  ? "bg-green-50 border-green-500 text-green-700"
                  : "bg-red-50 border-red-500 text-red-700"
              }`}
            >
              <p className="text-sm">{resultado.mensaje}</p>
            </div>
          )}

          {/* Si el envío fue OK, ocultamos el form y mostramos un CTA para volver */}
          {!resultado?.ok && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={enviando}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
                  placeholder="usuario@estudio.com"
                />
              </div>

              <button
                type="submit"
                disabled={enviando}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {enviando && <Loader2 className="w-4 h-4 animate-spin" />}
                {enviando ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link
              href="/auth/signin"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}