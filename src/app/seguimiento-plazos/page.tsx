"use client";
import { Sidebar } from "../components/sidebar"
import { Header } from "../components/header"
import ComingSoon from "../components/ComingSoon";

export default function SeguimientoPlazosPage() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1">
        <Header title="Seguimiento y Plazos" />
        <main className="flex-1 p-6">
          <ComingSoon title="Seguimiento y Plazos" />
        </main>
      </div>
    </div>
  );
}
