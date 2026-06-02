"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, KeyRound, Check, X } from "lucide-react";
import { confirmarResetPassword } from "src/lib/actions/password-reset-actions";
import { PasswordRequirements } from "../../../components/auth/PasswordRequirements";
import { evaluatePasswordRules } from "src/lib/auth/password-validation";
import { signOut } from "next-auth/react";

interface Props {
  token: string;
  email: string;
}

export function ResetPasswordForm({ token, email }: Props) {
  const router = useRouter();

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [submitting,      setSubmitting]      = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const checks = useMemo(() => evaluatePasswordRules(password), [password]);
  const isValid = useMemo(() => Object.values(checks).every(Boolean), [checks]);
  const passwordsMatch = password === confirmPassword && confirmPassword !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValid)         return setError("La contraseña no cumple con todos los requisitos de seguridad.");
    if (!passwordsMatch)  return setError("Las contraseñas no coinciden.");

    setSubmitting(true);
    const res = await confirmarResetPassword({
      token,
      passwordNueva:   password,
      passwordRepetir: confirmPassword,
    });

    if (!res.ok) {
      setError(res.error || "No se pudo cambiar la contraseña.");
      setSubmitting(false);
      return;
    }

    // Forzar logout de cualquier sesión activa antes de mandar al login.
    // Esto evita que un user logueado con cuenta A reciba una pantalla "logueada
    // pero en login" después de cambiar la password de la cuenta B.
    await signOut({ redirect: false });
    window.location.href = "/auth/signin?reset=success";
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 rounded-full mb-4">
              <KeyRound className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Nueva contraseña</h1>
            <p className="text-slate-600 mt-2 text-sm">
              Cambiando contraseña para <strong>{email}</strong>
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="w-full px-4 py-3 pr-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <PasswordRequirements password={password} />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Confirmar contraseña</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={submitting}
                  className={`w-full px-4 py-3 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:opacity-50 ${
                    confirmPassword && !passwordsMatch ? "border-red-300 bg-red-50" :
                    confirmPassword &&  passwordsMatch ? "border-green-300 bg-green-50" :
                                                         "border-slate-300"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && (
                <p
                  className={`text-xs mt-2 flex items-center gap-1 ${
                    passwordsMatch ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {passwordsMatch
                    ? <><Check className="w-3.5 h-3.5" /> Las contraseñas coinciden</>
                    : <><X     className="w-3.5 h-3.5" /> Las contraseñas no coinciden</>
                  }
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !isValid || !passwordsMatch}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? "Cambiando..." : "Cambiar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}