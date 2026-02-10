// src/app/portal/configuracion/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import prisma from "src/lib/db/prisma"
import { 
  Settings, 
  ArrowLeft,
  Bell,
  Mail,
  Shield,
  User
} from 'lucide-react'

export default async function PortalConfiguracionPage() {
  const user = await getUserSessionServer()

  if (!user || user.rol?.toUpperCase() !== 'CLIENTE') {
    redirect("/auth/signin")
  }

  // Obtener datos del cliente
  const cliente = await prisma.cliente.findFirst({
    where: { usuarioPortalId: user.id }
  })

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
          <h1 className="text-2xl font-semibold text-slate-900">Configuración</h1>
          <p className="text-slate-600 mt-1">
            Preferencias de su cuenta
          </p>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        
        {/* Información de la cuenta */}
        <Card className="border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-slate-600" />
              Información de la Cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-500">Nombre</Label>
                  <p className="font-medium text-slate-900 mt-1">
                    {cliente?.nombre} {cliente?.apellido}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500">Email</Label>
                  <p className="font-medium text-slate-900 mt-1">{user.email}</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100">
                <Link href="/perfil">
                  <Button variant="outline" size="sm">
                    Cambiar Contraseña
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card className="border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bell className="h-5 w-5 text-slate-600" />
              Notificaciones
            </CardTitle>
            <CardDescription>Configure cómo desea recibir alertas</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Notificaciones por email</Label>
                  <p className="text-sm text-slate-500">
                    Recibir alertas de movimientos en su correo
                  </p>
                </div>
                <Switch disabled defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Recordatorios de vencimientos</Label>
                  <p className="text-sm text-slate-500">
                    Alertas antes de fechas límite
                  </p>
                </div>
                <Switch disabled defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Resumen semanal</Label>
                  <p className="text-sm text-slate-500">
                    Informe semanal del estado de sus casos
                  </p>
                </div>
                <Switch disabled />
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <p className="text-sm text-slate-500">
                La configuración de notificaciones estará disponible próximamente.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seguridad */}
        <Card className="border-slate-200">
          <CardHeader className="border-b bg-slate-50/50">
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-slate-600" />
              Seguridad
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-700">Última sesión</p>
                  <p className="text-sm text-slate-500">
                    {user.ultimoAcceso 
                      ? new Date(user.ultimoAcceso).toLocaleString('es-AR')
                      : 'Primera sesión'
                    }
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <Link href="/perfil">
                  <Button variant="outline" size="sm" className="w-full">
                    Cambiar Contraseña
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card className="border-slate-200 bg-slate-50">
          <CardContent className="pt-6">
            <p className="text-sm text-slate-700 mb-2 font-medium">
              ¿Necesita actualizar sus datos?
            </p>
            <p className="text-sm text-slate-600">
              Para modificar su información personal (nombre, documento, dirección), 
              comuníquese con el estudio jurídico.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
