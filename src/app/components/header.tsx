"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();
  const user = session?.user;

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // ===== LOGOUT CORREGIDO =====
  const handleSignOut = () => {
    setShowUserMenu(false)
    signOut({ callbackUrl: "/auth/signin" })
  }

  const getInitials = (name: string) => {
  return name
    .split(" ")
    .map(n => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

  const nombre = user?.name ?? "Usuario";
  const rol = user?.rol ?? "sin rol";

  const avatar = user?.image ?? null;
const initials = getInitials(nombre); 
  
  // Verificar si es admin (case-insensitive)
  const isAdmin = typeof rol === 'string' && rol.toLowerCase() === "admin";

  // Formatear rol para mostrar
  const getRolLabel = (rol: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      ABOGADO: 'Abogado',
      ASISTENTE: 'Asistente',
      CLIENTE: 'Cliente'
    };
    return roles[rol?.toUpperCase()] || rol;
  };

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
            {avatar ? (
                <img src={avatar} className="w-6 h-6 rounded-full" alt="avatar" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold">
                  {initials}
                </div>
              )}
            <span>{nombre}</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-md border bg-white py-1 shadow-lg">
              <div className="border-b px-4 py-2">
                <p className="font-medium">{nombre}</p>
                <p className="text-sm text-gray-500">{user?.email ?? ""}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Rol: {getRolLabel(rol)}
                </p>
              </div>

              <Link
                href="/perfil"
                onClick={() => setShowUserMenu(false)}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Mi Perfil
              </Link>

              {/* Solo mostrar Configuración si es ADMIN */}
              {isAdmin && (
                <Link
                  href="/configuracion"
                  onClick={() => setShowUserMenu(false)}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Configuración
                </Link>
              )}

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