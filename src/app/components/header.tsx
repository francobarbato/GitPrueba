"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signOut } from 'next-auth/react';
// import { signOut } from "@/auth";

interface User {
  name?: string | null;
  email?: string | null;
  role?: string | null;
}

interface HeaderProps {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  const router = useRouter();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/auth/login");
    router.refresh();
  };
  
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-6">
      <button 
        className="lg:hidden" 
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        ☰
        <span className="sr-only">Toggle menu</span>
      </button>
      
      <h1 className="text-xl font-semibold">Sistema de Gestión Legal</h1>
      
      <div className="ml-auto flex items-center gap-4">
        <button className="rounded-full bg-gray-100 p-2">
          🔔
          <span className="sr-only">Notificaciones</span>
        </button>
        
        <div className="relative">
          <button 
            className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            👤
            <span>{user?.name || "Usuario"}</span>
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 rounded-md border bg-white py-1 shadow-lg">
              <div className="border-b px-4 py-2">
                <p className="font-medium">{user?.name || "Usuario"}</p>
                <p className="text-sm text-gray-500">{user?.email || ""}</p>
                <p className="text-xs text-gray-500">
                  Rol: {user?.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1)) : ""}
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