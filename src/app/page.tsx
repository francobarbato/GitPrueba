"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "./components/sidebar";
import { Header } from "./components/header";
import { useDashboardData } from "./hooks/useDashboardData"; 

// Tarjeta de menú rápida
function DashboardCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="block">
      <div className="rounded-lg border p-6 bg-white shadow-sm transition-all hover:shadow-md">
        <h3 className="text-lg font-medium text-gray-800">{title}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
      </div>
    </Link>
  );
}

function UpcomingDeadlines() {
  const deadlines = [
    {
      title: "Audiencia Preliminar - Caso #2023-45",
      subtitle: "Martínez c/ Empresa XYZ",
      date: "Mañana 09:00",
      location: "Juzgado Civil N°5",
      urgent: true,
    },
    {
      title: "Vencimiento Escrito - Caso #2023-32",
      subtitle: "López c/ Aseguradora ABC",
      date: "En 3 días",
      location: "Presentación de pruebas",
      urgent: false,
    },
  ];

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b p-4">
        <h3 className="font-medium">Próximos Vencimientos</h3>
        <p className="text-sm text-gray-500">Plazos y audiencias próximas</p>
      </div>
      <div className="p-4 space-y-4">
        {deadlines.map((item, index) => (
          <div key={index} className="flex justify-between border-b pb-2 last:border-0">
            <div>
              <p className="font-medium">{item.title}</p>
              <p className="text-sm text-gray-500">{item.subtitle}</p>
            </div>
            <div className="text-right">
              <p className="font-medium">{item.date}</p>
              <p className="text-sm text-gray-500">{item.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentActivity() {
  const activities = [
    {
      title: "Documento agregado - Caso #2023-45",
      description: "Respuesta a demanda",
      timestamp: "Hoy, 14:25 - Dr. González",
    },
    {
      title: "Nuevo cliente registrado",
      description: "Fernández, Carlos",
      timestamp: "Hace 2 días - Dra. Pérez",
    },
  ];

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <div className="border-b p-4">
        <h3 className="font-medium">Actividad Reciente</h3>
        <p className="text-sm text-gray-500">Últimas actualizaciones en casos</p>
      </div>
      <div className="p-4 space-y-4">
        {activities.map((item, index) => (
          <div key={index} className="border-b pb-2 last:border-0">
            <p className="font-medium">{item.title}</p>
            <p className="text-sm text-gray-500">{item.description}</p>
            <p className="text-xs text-gray-400">{item.timestamp}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  // Usamos el hook que refresca los datos (el mismo que usa el header)
  const { data, loading } = useDashboardData();

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-50">
      <Header user={{ name: "Usuario" }} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 space-y-6">
          <div>
            <h2 className="text-2xl font-bold">Panel Principal</h2>
            <p className="text-gray-500">Bienvenido al sistema</p>
          </div>

          {/* =========================
              MINI STATS (colocadas aquí, solo visible en md+)
              ========================= */}
          {/* <div className="hidden md:flex gap-6 items-center">
            {loading ? (
              <span className="text-gray-400 text-sm">Cargando...</span>
            ) : (
              <>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">{data?.totalCasos ?? 0}</p>
                  <p className="text-xs text-gray-500">Casos</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">{data?.casosAbiertos ?? 0}</p>
                  <p className="text-xs text-gray-500">Abiertos</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">{data?.casosEnProceso ?? 0}</p>
                  <p className="text-xs text-gray-500">En proceso</p>
                </div>
                <div className="text-center">
                  <p className="text-sm font-bold text-gray-800">{data?.casosCerrados ?? 0}</p>
                  <p className="text-xs text-gray-500">Cerrado00s</p>
                </div>
              </>
            )}
          </div> */}

          {/* =========================
              Estadísticas principales (blanco y negro)
              ========================= */}
          {!loading && data && (
            <div className="grid grid-cols-5 gap-4">
              <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-white shadow-sm">
                <p className="text-2xl font-semibold text-gray-800">{data.totalCasos}</p>
                <p className="text-sm text-gray-500">Casos</p>
              </div>
              <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-white shadow-sm">
                <p className="text-2xl font-semibold text-gray-800">{data.casosAbiertos}</p>
                <p className="text-sm text-gray-500">Abiertos</p>
              </div>
              <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-white shadow-sm">
                <p className="text-2xl font-semibold text-gray-800">{data.casosEnProceso}</p>
                <p className="text-sm text-gray-500">En proceso</p>
              </div>
              <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-white shadow-sm">
                <p className="text-2xl font-semibold text-gray-800">{data.casosCerrados}</p>
                <p className="text-sm text-gray-500">Cerrados</p>
              </div>
              <div className="flex flex-col items-center justify-center p-6 rounded-lg border bg-white shadow-sm">
                <p className="text-2xl font-semibold text-gray-800">{data.totalClientes}</p>
                <p className="text-sm text-gray-500">Clientes</p>
              </div>
            </div>
          )}

          {/* =========================
              Tarjetas de acceso rápido
              ========================= */}
          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              title="Gestión de Casos"
              description="Registro detallado de casos y actualizaciones en tiempo real."
              href="/casos"
            />
            <DashboardCard
              title="Seguimiento y Plazos"
              description="Alertas y notificaciones para audiencias y fechas importantes."
              href="/seguimiento-plazos"
            />
            <DashboardCard
              title="Plantillas de Documentos"
              description="Biblioteca de plantillas legales personalizables."
              href="/plantilla-documentos"
            />
            <DashboardCard
              title="Cálculos de Indemnización"
              description="Herramienta automatizada de cálculos laborales."
              href="/calculos-indemnizacion"
            />
            <DashboardCard
              title="Formulario de Toma de Casos"
              description="Registro inicial de nuevos clientes y casos."
              href="/formulario-toma-casos"
            />
            <DashboardCard
              title="Gestión de Clientes"
              description="Listado completo de clientes con historial de casos."
              href="/clientes"
            />
          </div>

          {/* =========================
              Secciones informativas
              ========================= */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <UpcomingDeadlines />
            <RecentActivity />
          </div>
        </main>
      </div>
    </div>
  );
}
