'use client'

import { useSession, signOut, signIn } from "next-auth/react";

export const LogoutButton = () => {

  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <button
        className="block w-full px-4 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
      >
        Cargando...
      </button>
    );
  }

  if (status === "unauthenticated") {
    return (
      <button
        onClick={() => signIn()}
        className="block w-full px-4 py-2 text-left text-sm text-blue-600 hover:bg-gray-100"
      >
        Ingresar
      </button>
    );
  }

  // authenticated
  return (
    <button
      onClick={() => signOut()}
      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
    >
      Cerrar sesión
    </button>
  );
};
