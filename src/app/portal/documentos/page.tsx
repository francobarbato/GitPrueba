// src/app/portal/documentos/page.tsx

import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { 
  FileText, 
  Upload,
  FolderOpen,
  ArrowLeft,
  File,
  Image,
  FileSpreadsheet
} from 'lucide-react'

export default async function PortalDocumentosPage() {
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
          <h1 className="text-2xl font-semibold text-slate-900">Documentos</h1>
          <p className="text-slate-600 mt-1">
            Gestione la documentación de sus casos
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
                    <FolderOpen className="h-5 w-5 text-slate-600" />
                    Mis Documentos
                  </CardTitle>
                  <CardDescription>Archivos subidos a sus casos</CardDescription>
                </div>
                <Button className="gap-2" disabled>
                  <Upload className="h-4 w-4" />
                  Subir Documento
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Estado vacío elegante */}
              <div className="py-16 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-700 mb-2">
                  Sin documentos
                </h3>
                <p className="text-slate-500 max-w-sm mx-auto mb-6">
                  Aún no ha subido documentos a sus casos. Esta función estará disponible próximamente.
                </p>
                <Button variant="outline" disabled>
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Primer Documento
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar informativo */}
        <div className="space-y-6">
          
          {/* Tipos de archivo aceptados */}
          <Card className="border-slate-200">
            <CardHeader className="border-b bg-slate-50/50">
              <CardTitle className="text-base">Formatos Aceptados</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-red-50 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">PDF</p>
                    <p className="text-xs text-slate-500">Documentos, contratos</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-blue-50 flex items-center justify-center">
                    <File className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Word, Excel</p>
                    <p className="text-xs text-slate-500">Documentos editables</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded bg-green-50 flex items-center justify-center">
                    <Image className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">Imágenes</p>
                    <p className="text-xs text-slate-500">JPG, PNG (fotos, comprobantes)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información */}
          <Card className="border-slate-200 bg-blue-50 border-blue-100">
            <CardContent className="pt-4">
              <p className="text-sm text-blue-800 font-medium mb-2">
                Próximamente
              </p>
              <p className="text-sm text-blue-700">
                La función de carga de documentos estará disponible en breve. 
                Podrá adjuntar comprobantes, poderes y demás documentación requerida.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
