// src/app/portal/casos/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import prisma from "src/lib/db/prisma"
import { 
  Briefcase, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar,
  Inbox,
  Filter
} from 'lucide-react'

export default async function PortalCasosPage() {
  const user = await getUserSessionServer()

  if (!user || user.rol?.toUpperCase() !== 'CLIENTE') {
    redirect("/auth/signin")
  }

  // Obtener el cliente vinculado
  const cliente = await prisma.cliente.findFirst({
    where: { usuarioPortalId: user.id },
    include: {
      casos: {
        orderBy: { updatedAt: 'desc' },
        include: {
          abogado: {
            select: { nombre: true, apellido: true }
          }
        }
      }
    }
  })

  if (!cliente) {
    redirect("/portal")
  }

  const casosActivos = cliente.casos.filter(c => !c.estaCerrado)
  const casosCerrados = cliente.casos.filter(c => c.estaCerrado)

  // Formatear fecha
  const formatearFecha = (fecha: Date | string) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Componente de tarjeta de caso
  const CasoCard = ({ caso }: { caso: any }) => (
    <Link href={`/portal/casos/${caso.id}`}>
      <div className="p-4 border border-slate-200 rounded-lg hover:border-slate-300 hover:shadow-sm transition bg-white cursor-pointer">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {caso.numero}
              </span>
              <Badge variant="outline" className="text-xs">
                {caso.tipo}
              </Badge>
              {caso.estaCerrado && (
                <Badge variant="secondary" className="text-xs bg-slate-100">
                  Finalizado
                </Badge>
              )}
              {caso.priority === 'HIGH' && !caso.estaCerrado && (
                <Badge className="text-xs bg-red-100 text-red-700 border-0">
                  Urgente
                </Badge>
              )}
            </div>
            
            <h3 className="font-medium text-slate-900 mb-1">
              {caso.titulo}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {caso.estado}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatearFecha(caso.fechaInicio)}
              </span>
            </div>

            {caso.abogado && (
              <p className="text-xs text-slate-400 mt-2">
                Abogado: {caso.abogado.nombre} {caso.abogado.apellido}
              </p>
            )}
          </div>
          
          <ArrowRight className="h-5 w-5 text-slate-400 flex-shrink-0 mt-1" />
        </div>
      </div>
    </Link>
  )

  // Estado vacío
  const EmptyState = ({ mensaje, descripcion }: { mensaje: string; descripcion: string }) => (
    <div className="py-16 text-center">
      <Inbox className="h-12 w-12 text-slate-200 mx-auto mb-4" />
      <p className="text-slate-500 font-medium">{mensaje}</p>
      <p className="text-sm text-slate-400 mt-1">{descripcion}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Mis Casos</h1>
        <p className="text-slate-600 mt-1">
          Consulte el estado y detalle de todos sus expedientes
        </p>
      </div>

      {/* Resumen rápido */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-slate-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{casosActivos.length}</p>
                <p className="text-sm text-slate-600">En curso</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-slate-200">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">{casosCerrados.length}</p>
                <p className="text-sm text-slate-600">Finalizados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de casos */}
      <Tabs defaultValue="activos" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="activos" className="gap-2">
            <Clock className="h-4 w-4" />
            En Curso ({casosActivos.length})
          </TabsTrigger>
          <TabsTrigger value="cerrados" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Finalizados ({casosCerrados.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="activos" className="mt-6">
          {casosActivos.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <EmptyState 
                  mensaje="No tiene casos en curso"
                  descripcion="Cuando inicie un nuevo caso, aparecerá aquí"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {casosActivos.map((caso) => (
                <CasoCard key={caso.id} caso={caso} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="cerrados" className="mt-6">
          {casosCerrados.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="p-0">
                <EmptyState 
                  mensaje="No tiene casos finalizados"
                  descripcion="Los casos cerrados aparecerán aquí para su consulta"
                />
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {casosCerrados.map((caso) => (
                <CasoCard key={caso.id} caso={caso} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
