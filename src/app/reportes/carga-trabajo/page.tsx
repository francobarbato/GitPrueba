import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"
import { WorkloadTable } from "@/app/reportes/carga-trabajo/components/WorkloadTable"
import { InactivityAlerts } from "@/app/reportes/carga-trabajo/components/InactivityAlerts"
import { RiskMatrix } from "@/app/reportes/carga-trabajo/components/RiskMatrix"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ShieldAlert } from "lucide-react" // Agregué icono para admin
import Link from "next/link"
import { ReportesService } from "@/lib/aplication/services/reportes.service" 
import { getUserSessionServer } from "@/auth/actions/auth-actions" // <--- IMPORTANTE
import { redirect } from "next/navigation"

const reportesService = new ReportesService();

export default async function CargaTrabajoPage() {
  // 1. OBTENEMOS LA SESIÓN DEL USUARIO
  const user = await getUserSessionServer();
  
  // Si no hay usuario, lo mandamos al login
  if (!user) return redirect("/api/auth/signin");

  // 2. DETERMINAMOS SI ES ADMIN
  // (Asegúrate que tu usuario tenga la propiedad 'rol'. Si no, ajusta esta lógica)
  const esAdmin = user.rol === 'admin'; 

  // 3. PEDIMOS DATOS FILTRADOS SEGÚN EL ROL
  const [cargaData, riesgosData, alertasData] = await Promise.all([
    // La carga de trabajo (comparativa) generalmente es útil verla completa para transparencia,
    // o podrías filtrarla también si quisieras. Por ahora la dejamos completa.
    reportesService.getCargaTrabajo(), 

    // Aquí pasamos el ID y si es admin. 
    // Si es Admin -> Trae todo. Si es Abogado -> Solo lo suyo.
    reportesService.getMatrizRiesgos(user.id, esAdmin),    
    
    reportesService.getAlertasUnificadas(user.id, esAdmin) 
  ]);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <main className="flex-1 overflow-auto p-8">
          
          <div className="mb-6 flex justify-between items-center">
            <Link href="/reportes">
                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 pl-0 gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Volver al Tablero Principal
                </Button>
            </Link>
            
            {/* Badge informativo de qué vista estás viendo */}
            <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                esAdmin 
                ? "bg-purple-50 text-purple-700 border-purple-200" 
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
                {esAdmin ? "Vista Gerencial (Todos los casos)" : "Vista Operativa (Mis casos)"}
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-2">
                {esAdmin ? "Balance y Asignación Global" : "Mi Balance y Prioridades"}
            </h1>
            <p className="text-slate-600 max-w-3xl">
                {esAdmin 
                 ? "Herramienta gerencial para visualizar la carga de todo el equipo y detectar riesgos globales."
                 : "Herramienta operativa para gestionar tus prioridades del día y evitar vencimientos en tus expedientes."}
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            
            <div className="xl:col-span-2 space-y-6">
                {/* Si quieres que el abogado NO vea la tabla comparativa de sus compañeros, 
                   puedes envolver esto en: {esAdmin && <WorkloadTable ... />}
                   Por ahora lo dejo visible para transparencia del equipo.
                */}
                <WorkloadTable data={cargaData} />
                
                <RiskMatrix data={riesgosData} />
            </div>

            <div className="xl:col-span-1 space-y-6">
                <InactivityAlerts data={alertasData} />
                
                {esAdmin ? (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 text-sm text-purple-800">
                        <strong>👑 Consejo Gerencial:</strong>
                        <p className="mt-1 text-purple-700/80">
                            Revise la carga de los abogados en "Rojo" antes de asignar nuevos clientes esta semana.
                        </p>
                    </div>
                ) : (
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-800">
                        <strong>💡 Consejo Operativo:</strong>
                        <p className="mt-1 text-blue-700/80">
                            Priorice resolver las alertas críticas (Rojo) hoy mismo para mantener su índice de eficiencia alto.
                        </p>
                    </div>
                )}
            </div>

          </div>

        </main>
      </div>
    </div>
  )
}