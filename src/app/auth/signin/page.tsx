"use client";

import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrlRaw = searchParams.get("callbackUrl");

  // Solo aceptar callbackUrls válidas del sistema
  const rutasValidas = ["/casos", "/clientes", "/reportes", "/perfil", "/portal"];
  const callbackUrl = callbackUrlRaw && rutasValidas.some(r => callbackUrlRaw.startsWith(r))
    ? callbackUrlRaw
    : null;

  const error = searchParams.get("error");

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email:    email.toLowerCase(),
        password,
      });

      if (result?.error) {
        if (result.error === "UserInactive") {
          setErrorMsg("Su cuenta ha sido suspendida. Comuníquese con el administrador del estudio para regularizar su situación.");
        } else {
          setErrorMsg("Email o contraseña incorrectos");
        }
        setLoading(false);
        return;
      }

      const session = await getSession();
      const userRol = session?.user?.rol?.toUpperCase();

      let redirectUrl = "/";
      if (userRol === "CLIENTE") {
        redirectUrl = "/portal";
      } else if (callbackUrl && !callbackUrl.includes("/dashboard") && !callbackUrl.startsWith("/auth")) {
        redirectUrl = callbackUrl;
      }

      router.push(redirectUrl);
      router.refresh();
    } catch (err) {
      setErrorMsg("Error al iniciar sesión");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Sistema Legal</h1>
            <p className="text-slate-600 mt-2">Inicie sesión para continuar</p>
          </div>

                    {searchParams.get("reset") === "success" && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
              <p className="text-sm font-semibold">Contraseña cambiada</p>
              <p className="text-sm">Iniciá sesión con tu nueva contraseña.</p>
            </div>
          )}

          {searchParams.get("activated") === "success" && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
              <p className="text-sm font-semibold">Cuenta activada</p>
              <p className="text-sm">Tu cuenta quedó activada. Iniciá sesión con la contraseña que elegiste.</p>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="text-sm font-semibold">Error de autenticación</p>
              <p className="text-sm">
                {error === "CredentialsSignin" && "Email o contraseña incorrectos"}
                {error === "UserInactive"      && "Su cuenta ha sido suspendida. Comuníquese con el administrador del estudio para regularizar su situación."}
              </p>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              <p className="text-sm">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="usuario@estudio.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">Contraseña</label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>
          </form>

          {/* Link a recuperación de contraseña — lo armamos en el bloque 4 */}
          <div className="mt-6 text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}