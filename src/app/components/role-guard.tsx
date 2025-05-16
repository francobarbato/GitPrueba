"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    // Si la autenticación está completa y el usuario no tiene el rol permitido
    if (status === "authenticated" && 
        session?.user?.role &&
        !allowedRoles.includes(session.user.role)) {
      router.push("/");
    }
  }, [status, session, router, allowedRoles]);
  
  // Mientras se verifica la autenticación
  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center">Cargando...</div>;
  }
  
  // Si el usuario no está autenticado o no tiene el rol permitido
  if (status !== "authenticated" || 
      !session?.user?.role ||
      !allowedRoles.includes(session.user.role)) {
    return null;
  }
  
  // Si el usuario tiene el rol permitido
  return <>{children}</>;
}