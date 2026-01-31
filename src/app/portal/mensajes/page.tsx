// src/app/portal/mensajes/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  MessageSquare, 
  Send,
  ArrowLeft,
  Inbox,
  Clock,
  CheckCheck
} from 'lucide-react'

export default async function PortalMensajesPage() {
  const user = await getUserSessionServer()

  if (!user || user.rol?.toUpperCase() !== 'CLIENTE') {
    redirect("/auth/signin")
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/portal">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Mensajes</h1>
          <p className="text-slate-600 mt-1">
            Comunicación con el estudio jurídico
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Área principal */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Inbox className="h-5 w-5 text-slate-600" />
                    Bandeja de Entrada
                  </CardTitle>
                  <CardDescription>Mensajes de su abogado</CardDescription>
                </div>
                <Button className="gap-2" disabled>
                  <Send className="h-4 w-4" />
                  Nuevo Mensaje
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Estado vacío elegante */}
              <div className="py-16 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  Sin mensajes
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-6">
                  No tiene mensajes en su bandeja de entrada. 
                  Esta función de comunicación estará disponible próximamente.
                </p>
                <Button variant="outline" disabled>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Primer Mensaje
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar informativo */}
        <div className="space-y-6">
          
          {/* Estado de mensajes */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-base">Estado de Mensajes</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-slate-300" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Enviado</p>
                    <p className="text-xs text-slate-500">Mensaje en tránsito</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Recibido</p>
                    <p className="text-xs text-slate-500">El abogado lo recibió</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCheck className="h-4 w-4 text-green-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">Leído</p>
                    <p className="text-xs text-slate-500">El abogado vio el mensaje</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tiempos de respuesta */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Tiempos de Respuesta
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="text-sm text-slate-600">
                Los mensajes son atendidos en horario laboral. 
                Tiempo estimado de respuesta: <strong>24-48 horas hábiles</strong>.
              </p>
              <p className="text-sm text-slate-500 mt-3">
                Para urgencias, comuníquese telefónicamente con el estudio.
              </p>
            </CardContent>
          </Card>

          {/* Información */}
          <Card className="border-slate-200 bg-green-50 border-green-100">
            <CardContent className="pt-4">
              <p className="text-sm text-green-800 font-medium mb-2">
                Próximamente
              </p>
              <p className="text-sm text-green-700">
                El sistema de mensajería estará disponible pronto. 
                Podrá comunicarse directamente con su abogado desde aquí.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
