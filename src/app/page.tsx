// app/page.jsx
import Link from "next/link"
import { Sidebar } from "./components/sidebar"
import { Header } from "./components/header"
import { auth } from "@/auth";

// Componente de tarjeta para el dashboard
function DashboardCard(props: {
  title: string;
  description: string;
  href: string;
}) {
  const { title, description, href } = props;
  
  return (
    <Link href={href} className="block">
      <div className="rounded-lg border p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">{title}</h3>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {description}
        </p>
      </div>
    </Link>
  )
}



// Componente para mostrar estadísticas
function StatsCards({
  totalCasos = 0,
  totalClientes = 0,
  totalAbogados = 0
}) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Total Casos</h3>
        </div>
        <p className="mt-2 text-2xl font-bold">{totalCasos}</p>
      </div>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Total Clientes</h3>
        </div>
        <p className="mt-2 text-2xl font-bold">{totalClientes}</p>
      </div>
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">Total Abogados</h3>
        </div>
        <p className="mt-2 text-2xl font-bold">{totalAbogados}</p>
      </div>
    </div>
  )
}

// Componente para mostrar próximos vencimientos
function UpcomingDeadlines() {
  const deadlines = [
    {
      title: "Audiencia Preliminar - Caso #2023-45",
      subtitle: "Martínez c/ Empresa XYZ",
      date: "Mañana 09:00",
      location: "Juzgado Civil N°5",
      urgent: true
    },
    {
      title: "Vencimiento Escrito - Caso #2023-32",
      subtitle: "López c/ Aseguradora ABC",
      date: "En 3 días",
      location: "Presentación de pruebas",
      urgent: false
    },
    {
      title: "Reunión Cliente - Caso #2023-51",
      subtitle: "Rodríguez, María",
      date: "En 5 días 15:30",
      location: "Oficina principal",
      urgent: false
    }
  ]
  
  return (
    <div className="rounded-lg border shadow-sm">
      <div className="border-b p-4">
        <h3 className="font-medium">Próximos Vencimientos</h3>
        <p className="text-sm text-gray-500">Plazos y audiencias para los próximos 7 días</p>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {deadlines.map((item, index) => (
            <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-500">{item.subtitle}</p>
              </div>
              <div className="text-right">
                <p className={`font-medium ${item.urgent ? 'text-red-600' : ''}`}>{item.date}</p>
                <p className="text-sm text-gray-500">{item.location}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Componente para mostrar actividad reciente
function RecentActivity() {
  const activities = [
    {
      type: "document",
      title: "Documento agregado - Caso #2023-45",
      description: "Respuesta a demanda",
      timestamp: "Hoy, 14:25 - Dr. González"
    },
    {
      type: "calculation",
      title: "Cálculo actualizado - Caso #2023-38",
      description: "Indemnización por despido",
      timestamp: "Ayer, 10:15 - Dra. Martínez"
    },
    {
      type: "client",
      title: "Nuevo cliente registrado",
      description: "Fernández, Carlos",
      timestamp: "Hace 2 días - Dr. Pérez"
    }
  ]
  
  return (
    <div className="rounded-lg border shadow-sm">
      <div className="border-b p-4">
        <h3 className="font-medium">Actividad Reciente</h3>
        <p className="text-sm text-gray-500">Últimas actualizaciones en casos activos</p>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {activities.map((item, index) => (
            <div key={index} className="flex items-start gap-4 border-b pb-2 last:border-0">
              <div className="rounded-full bg-blue-50 p-2">
                📄
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-gray-500">{item.description}</p>
                <p className="text-xs text-gray-500">{item.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default async function Dashboard() {
  const session = await auth();

  const dashboardData = {
    totalCasos: 3,
    totalClientes: 2,
    totalAbogados: 2
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header user={session?.user} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Panel Principal</h2>
            <p className="text-gray-500">
              Bienvenido, {session?.user?.name || "Usuario"}
            </p>
          </div>

          <StatsCards 
            totalCasos={dashboardData.totalCasos}
            totalClientes={dashboardData.totalClientes}
            totalAbogados={dashboardData.totalAbogados}
          />

          <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <DashboardCard
              title="Gestión de Casos"
              description="Registro detallado de casos, actualizaciones en tiempo real y acceso rápido a la información."
              href="/casos"
            />
            <DashboardCard
              title="Seguimiento y Plazos"
              description="Sistema de alertas y notificaciones para plazos judiciales, audiencias y fechas importantes."
              href="/seguimiento"
            />
            <DashboardCard
              title="Plantillas de Documentos"
              description="Biblioteca de plantillas para contratos, demandas y otros escritos legales."
              href="/plantillas"
            />
            <DashboardCard
              title="Cálculos de Indemnización"
              description="Herramienta para cálculos automatizados de indemnización y generación de informes."
              href="/indemnizaciones"
            />
            <DashboardCard
              title="Formulario de Toma de Casos"
              description="Formulario digital para el primer contacto con el cliente y evaluación de viabilidad."
              href="/formulario-casos"
            />
            <DashboardCard
              title="Gestión de Clientes"
              description="Perfiles de clientes con información personal, histórico de casos y comunicaciones."
              href="/clientes"
            />
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <UpcomingDeadlines />
            <RecentActivity />
          </div>
        </main>
      </div>
    </div>
  );
}
