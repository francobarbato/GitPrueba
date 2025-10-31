"use client"

import { Sidebar } from "../components/sidebar"
import { Header } from "../components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Database } from "lucide-react"

export default function ReportesPage() {
  const handleOpenPowerBI = () => {
    alert(
      "📊 Para abrir Power BI:\n\n" +
        "1. Abre Power BI Desktop\n" +
        "2. Abre el archivo estudio_juridico.pbix\n" +
        "3. Los datos se actualizan automáticamente desde MySQL\n\n" +
        "💡 Próximamente: Reporte publicado en la nube",
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header superior */}
        <Header />

        {/* Contenido */}
        <main className="flex-1 p-8 space-y-8">
          <div>
            <h1 className="text-2xl font-bold mb-2">Reportes Power BI</h1>
            <p className="text-gray-600">
              Visualización de reportes dinámicos del estudio jurídico en Power BI.
            </p>
          </div>

          {/* Sección principal: dos columnas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Información lateral izquierda */}
            <div className="space-y-6 lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Acceso al reporte</CardTitle>
                  <CardDescription>Explorá las visualizaciones actualizadas.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    size="lg"
                    className="w-full h-12 text-lg font-medium"
                    onClick={handleOpenPowerBI}
                  >
                    <ExternalLink className="h-5 w-5 mr-2" />
                    Abrir en Power BI
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-5">
                  <div className="flex gap-3">
                    <Database className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-blue-900 mb-2">Incluye:</h3>
                      <ul className="text-sm text-blue-800 list-disc list-inside space-y-1">
                        <li>Casos por tipo y abogado</li>
                        <li>Estados de avance y progreso</li>
                        <li>Distribución por categoría</li>
                        <li>Datos actualizados en tiempo real</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">📌 Cómo usar:</h3>
                  <ol className="text-sm text-gray-700 list-decimal list-inside space-y-1">
                    <li>Presioná el botón “Abrir en Power BI”.</li>
                    <li>Iniciá sesión si es necesario.</li>
                    <li>Interactuá con las visualizaciones desde esta página.</li>
                  </ol>
                </CardContent>
              </Card>
            </div>

            {/* Iframe Power BI */}
            <div className="lg:col-span-2">
              <Card className="h-[650px] shadow-md border">
                <iframe
                  title="Reporte Power BI"
                  src="https://app.powerbi.com/reportEmbed?reportId=eafd8179-e385-4514-b668-3bf73ef5d09c&autoAuth=true&ctid=85430b7f-f12c-48f1-b10e-f34a99e68727"
                  className="w-full h-full rounded-lg border-0"
                  allowFullScreen
                ></iframe>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
