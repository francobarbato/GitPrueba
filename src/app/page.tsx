import React from "react";
import Link from "next/link";
import { Sidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/header";
import { getUserSessionServer } from "@/auth/actions/auth-actions";
import { redirect } from "next/navigation";
// Importamos el servicio actualizado
import { DashboardService } from "@/lib/aplication/services/dashboard.service";

const dashboardService = new DashboardService();

// --- COMPONENTES VISUALES (Mantienen tu diseño) ---

function DashboardCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <Link href={href} className="block">
      <div className="rounded-lg border p-6 bg-white shadow-sm transition-all hover:shadow-md h-full">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}

function StatCard({ label, value }: { label: string, value: number }) {
    return (
        <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-white shadow-sm">
            <p className="text-2xl font-semibold text-gray-800">{value}</p>
            <p className="text-sm text-gray-500">{label}</p>
        </div>
    )
}

function RecentActivity({ actividad }: { actividad: any[] }) {
  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b p-4">
        <h3 className="font-medium">Actividad Reciente</h3>
        <p className="text-sm text-gray-500">Últimas actualizaciones en tus casos</p>
      </div>
      <div className="p-4 space-y-4">
        {actividad.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No hay actividad reciente.</p>
        ) : (
            actividad.map((caso) => (
            <div key={caso.id} className="border-b pb-2 last:border-0">
                <p className="font-medium">{caso.titulo}</p>
                <p className="text-sm text-gray-500">
                    {caso.cliente ? `Cliente: ${caso.cliente.nombre} ${caso.cliente.apellido}` : 'Sin cliente'}
                </p>
                <p className="text-xs text-gray-400">
                    Actualizado: {new Date(caso.updatedAt).toLocaleDateString()}
                </p>
            </div>
            ))
        )}
      </div>
    </div>
  );
}

// --- PÁGINA PRINCIPAL (SERVER COMPONENT) ---

export default async function DashboardPage() {
  // 1. Obtener Sesión
  const user = await getUserSessionServer();
  if (!user) redirect("/api/auth/signin");

  const esAdmin = user.rol === 'admin';

  // 2. Obtener Datos del Servicio
  const stats = await dashboardService.getStats(user.id, esAdmin);
  const actividad = await dashboardService.getActividadReciente(user.id, esAdmin);

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div>
            <h2 className="text-2xl font-bold">Panel Principal</h2>
            <p className="text-gray-500">
                Bienvenido, {user.nombre || user.email}. 
                {esAdmin ? " (Vista de Administrador)" : " (Vista de Abogado)"}
            </p>
          </div>

          {/* ESTADÍSTICAS */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <StatCard label="Total Casos" value={stats.totalCasos} />
            <StatCard label="Abiertos" value={stats.casosAbiertos} />
            <StatCard label="En Proceso" value={stats.casosEnProceso} />
            <StatCard label="Cerrados" value={stats.casosCerrados} />
            <StatCard label="Clientes" value={stats.totalClientes} />
          </div>

          {/* ACCESOS RÁPIDOS */}
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              title="Gestión de Casos"
              description="Registro detallado de casos y actualizaciones."
              href="/casos"
            />
            <DashboardCard
              title="Gestión de Clientes"
              description="Listado completo de clientes con historial."
              href="/clientes"
            />
            <DashboardCard
              title="Formulario de Toma de Casos"
              description="Registro rápido para nuevos clientes."
              href="/casos/nuevo"
            />
             <DashboardCard
              title="Cálculos de Indemnización"
              description="Herramienta automatizada de cálculos laborales."
              href="/calculos-indemnizacion"
            />
             <DashboardCard
              title="Seguimiento y Plazos"
              description="Alertas y notificaciones (Próximamente)."
              href="#"
            />
             <DashboardCard
              title="Reportes Power BI"
              description="Análisis avanzado de datos."
              href="#"
            />
          </div>

          {/* SECCIONES INFORMATIVAS */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {/* Dejamos UpcomingDeadlines estático por ahora o lo quitamos si no hay datos reales */}
            <div className="rounded-lg border bg-white shadow-sm p-6 flex items-center justify-center text-gray-400 italic">
                Próximos Vencimientos (Módulo en desarrollo)
            </div>
            
            <RecentActivity actividad={actividad} />
          </div>
        </main>
      </div>
    </div>
  );
}