"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const router = useRouter();
  const { data: session } = useSession();
  const user = session?.user;

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/api/auth/signin");
  };

  const avatar =
    user?.image ??
    "https://tailus.io/sources/blocks/stats-cards/preview/images/second_user.webp";

  const nombre = user?.name ?? "Usuario";
  const roles = Array.isArray(user?.rol) ? user.rol : [user?.rol ?? "sin rol"];

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-6">
      <button
        className="lg:hidden"
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        ☰
      </button>

      <h1 className="text-xl font-semibold">Sistema de Gestión Legal</h1>

      <div className="ml-auto flex items-center gap-4">
        <button className="rounded-full bg-gray-100 p-2">🔔</button>

        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <img src={avatar} className="w-6 h-6 rounded-full" alt="avatar" />
            <span>{nombre}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white py-1 shadow-lg">
              <div className="border-b px-4 py-2">
                <p className="font-medium">{nombre}</p>
                <p className="text-sm text-gray-500">{user?.email ?? ""}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Rol: {roles.join(", ")}
                </p>
              </div>

              <Link
                href="/perfil"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Mi Perfil
              </Link>

              <Link
                href="/configuracion"
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Configuración
              </Link>

              <button
                onClick={handleSignOut}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
              >
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
