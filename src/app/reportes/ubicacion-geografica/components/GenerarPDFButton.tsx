'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, Loader2, Download } from "lucide-react"

interface CasoUbicacion {
  id: string
  numero: string
  titulo: string
  tipo: string
  estado: string
  juzgado: string | null
  clienteNombre: string
  abogadoNombre: string
  abogadoId: string
  ultimoMovimiento: Date
  priority: string
  esUrgente: boolean
}

interface JuzgadoAgrupado {
  nombre: string
  casos: CasoUbicacion[]
  cantidadCasos: number
  urgentes: number
}

interface ZonaGeografica {
  id: string
  ciudad: string
  provincia: string
  coordenadas: { lat: number; lng: number } | null
  distanciaKm: number
  clasificacionDistancia: {
    tipo: 'local' | 'cercano' | 'medio' | 'lejano'
    label: string
    color: string
  }
  juzgados: JuzgadoAgrupado[]
  totalCasos: number
  casosUrgentes: number
  casos: CasoUbicacion[]
}

interface GenerarPDFButtonProps {
  zonas: ZonaGeografica[]
  vistaGeneral: boolean
  disabled?: boolean
}

export function GenerarPDFButton({ zonas, vistaGeneral, disabled }: GenerarPDFButtonProps) {
  const [generando, setGenerando] = useState(false)

  const generarPDF = async () => {
    setGenerando(true)
    
    try {
      // Generar HTML del reporte en el cliente
      const html = generarHTMLReporte(zonas, vistaGeneral)
      
      // Abrir en nueva ventana para imprimir
      const ventana = window.open('', '_blank')
      if (ventana) {
        ventana.document.write(html)
        ventana.document.close()
        
        // Esperar a que cargue y luego mostrar diálogo de impresión
        ventana.onload = () => {
          setTimeout(() => {
            ventana.print()
          }, 500)
        }
      } else {
        // Si el navegador bloquea popups, descargar como HTML
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `casos-ubicacion-${new Date().toISOString().split('T')[0]}.html`
        document.body.appendChild(a)
        a.click()
        URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error generando reporte:', error)
      alert('Error al generar el reporte. Intente nuevamente.')
    } finally {
      setGenerando(false)
    }
  }

  const totalCasos = zonas.reduce((sum, z) => sum + z.totalCasos, 0)

  return (
    <Button 
      onClick={generarPDF}
      disabled={disabled || generando}
      className="gap-2 bg-blue-600 hover:bg-blue-700"
    >
      {generando ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando...
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          Generar PDF ({totalCasos} casos)
        </>
      )}
    </Button>
  )
}

function generarHTMLReporte(zonas: ZonaGeografica[], vistaGeneral: boolean): string {
  const fecha = new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const totalCasos = zonas.reduce((sum, z) => sum + z.totalCasos, 0)
  const totalUrgentes = zonas.reduce((sum, z) => sum + z.casosUrgentes, 0)

  // Generar tabla resumen
  let tablaResumen = `
    <table class="tabla-resumen">
      <thead>
        <tr>
          <th>Ciudad</th>
          <th>Provincia</th>
          <th>Casos</th>
          <th>% Total</th>
          <th>Urgentes</th>
          <th>Distancia</th>
        </tr>
      </thead>
      <tbody>
  `

  zonas.forEach((zona) => {
    const porcentaje = totalCasos > 0 ? Math.round((zona.totalCasos / totalCasos) * 100) : 0
    tablaResumen += `
      <tr>
      <td><strong>${zona.ciudad}</strong></td>
        <td>${zona.provincia}</td>
        <td class="center">${zona.totalCasos}</td>
        <td class="center">${porcentaje}%</td>
        <td class="center ${zona.casosUrgentes > 0 ? 'urgente' : ''}">${zona.casosUrgentes}</td>
        <td class="center">${zona.distanciaKm} km</td>
      </tr>
    `
  })

  tablaResumen += `
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2"><strong>TOTAL</strong></td>
          <td class="center"><strong>${totalCasos}</strong></td>
          <td class="center"><strong>100%</strong></td>
          <td class="center"><strong>${totalUrgentes}</strong></td>
          <td></td>
        </tr>
      </tfoot>
    </table>
  `

  // Generar detalle por zona
  let detalleZonas = ''
  
  zonas.forEach((zona) => {
    detalleZonas += `
      <div class="zona-detalle">
        <h2>Casos en ${zona.provincia}, ${zona.ciudad}, (${zona.totalCasos})</h2>
        <p class="zona-info">
          Distancia desde Córdoba Capital: <strong>${zona.distanciaKm} km</strong> | 
          Clasificación: <strong>${zona.clasificacionDistancia.label}</strong>
          ${zona.casosUrgentes > 0 ? ` | <span class="urgente">${zona.casosUrgentes} urgente(s)</span>` : ''}
        </p>
        
        <table class="tabla-casos">
          <thead>
            <tr>
              <th>Expediente</th>
              <th>Carátula</th>
              <th>Cliente</th>
              <th>Juzgado</th>
              ${vistaGeneral ? '<th>Abogado</th>' : ''}
              <th>Estado</th>
              <th>Últ. Mov.</th>
            </tr>
          </thead>
          <tbody>
    `

    zona.casos.forEach((caso) => {
      const fechaMov = new Date(caso.ultimoMovimiento).toLocaleDateString('es-AR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
      
      detalleZonas += `
        <tr class="${caso.esUrgente ? 'fila-urgente' : ''}">
          <td class="mono">${caso.numero}</td>
          <td>${caso.titulo}</td>
          <td>${caso.clienteNombre}</td>
          <td>${caso.juzgado || 'Sin especificar'}</td>
          ${vistaGeneral ? `<td>${caso.abogadoNombre}</td>` : ''}
          <td><span class="badge">${caso.estado}</span></td>
          <td class="center">${fechaMov}</td>
        </tr>
      `
    })

    detalleZonas += `
          </tbody>
        </table>
      </div>
    `
  })

  // HTML completo
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Casos por Ubicación Geográfica - ${fecha}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      color: #1e293b;
      padding: 20px;
      background: white;
    }
    
    .portada {
      text-align: center;
      padding: 60px 40px;
      border: 2px solid #3b82f6;
      border-radius: 8px;
      margin-bottom: 40px;
      page-break-after: always;
    }
    
    .portada-icono {
      font-size: 48px;
      margin-bottom: 20px;
    }
    
    .portada h1 {
      font-size: 28px;
      color: #1e40af;
      margin-bottom: 10px;
    }
    
    .portada .subtitulo {
      font-size: 14px;
      color: #64748b;
      margin-bottom: 30px;
    }
    
    .portada .descripcion {
      font-size: 12px;
      color: #475569;
      max-width: 500px;
      margin: 0 auto 30px;
      text-align: left;
    }
    
    .portada .meta {
      font-size: 11px;
      color: #64748b;
      margin-top: 40px;
    }
    
    .portada .meta p {
      margin: 5px 0;
    }
    
    h2 {
      font-size: 14px;
      color: #1e40af;
      margin: 30px 0 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid #e2e8f0;
    }
    
    .seccion-titulo {
      font-size: 16px;
      color: #0f172a;
      margin: 20px 0 15px;
      padding: 10px;
      background: #f1f5f9;
      border-left: 4px solid #3b82f6;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 10px;
    }
    
    th, td {
      padding: 8px 10px;
      text-align: left;
      border: 1px solid #e2e8f0;
    }
    
    th {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      font-size: 9px;
    }
    
    .center {
      text-align: center;
    }
    
    .mono {
      font-family: monospace;
      font-size: 9px;
    }
    
    .urgente {
      color: #dc2626;
      font-weight: 600;
    }
    
    .fila-urgente {
      background: #fef2f2;
    }
    
    .badge {
      display: inline-block;
      padding: 2px 6px;
      background: #f1f5f9;
      border-radius: 4px;
      font-size: 9px;
    }
    
    .zona-detalle {
      page-break-inside: avoid;
      margin-bottom: 30px;
    }
    
    .zona-info {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 10px;
      padding: 8px;
      background: #f8fafc;
      border-radius: 4px;
    }
    
    .tabla-resumen {
      margin-bottom: 30px;
    }
    
    .tabla-resumen tfoot {
      background: #f1f5f9;
      font-weight: 600;
    }
    
    .no-print {
      margin-bottom: 20px;
      padding: 15px;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 8px;
      text-align: center;
    }
    
    .no-print button {
      background: #2563eb;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 6px;
      font-size: 14px;
      cursor: pointer;
      margin: 0 8px;
    }
    
    .no-print button:hover {
      background: #1d4ed8;
    }
    
    .no-print button.secondary {
      background: #64748b;
    }
    
    @media print {
      .no-print {
        display: none !important;
      }
      
      body {
        padding: 0;
      }
      
      .portada {
        page-break-after: always;
      }
      
      .zona-detalle {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Barra de acciones (no se imprime) -->
  <div class="no-print">
    <p style="margin-bottom: 10px; color: #475569;">
      Para guardar como PDF, presioná <strong>Ctrl+P</strong> (o Cmd+P en Mac) y seleccioná "Guardar como PDF"
    </p>
    <button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
    <button class="secondary" onclick="window.close()">✕ Cerrar</button>
  </div>

  <!-- PORTADA -->
  <div class="portada">
    <div class="portada-icono">📍</div>
    <h1>Casos por Ubicación Geográfica</h1>
    <p class="subtitulo">Distribución de Expedientes por Ciudad y Juzgado</p>
    
    <div class="descripcion">
      <p><strong>Descripción del Reporte:</strong> Este informe muestra la distribución de expedientes activos agrupados por ubicación geográfica (ciudad/fuero), permitiendo planificar visitas a tribunales y optimizar traslados.</p>
      <br>
      <p><strong>Cómo usar:</strong> Revise primero la tabla resumen para identificar las zonas con mayor concentración de casos. Luego consulte el detalle de cada zona para ver los expedientes específicos y sus juzgados.</p>
    </div>
    
    <div class="meta">
      <p><strong>Tipo de Vista:</strong> ${vistaGeneral ? 'General (Todo el Estudio)' : 'Personal (Mis Casos)'}</p>
      <p><strong>Total de Casos:</strong> ${totalCasos}</p>
      <p><strong>Zonas Incluidas:</strong> ${zonas.length}</p>
      <p><strong>Fecha de Generación:</strong> ${fecha}</p>
    </div>
  </div>

  <!-- TABLA RESUMEN -->
  <div class="seccion-titulo"> Resumen por Ciudad</div>
  ${tablaResumen}

  <!-- DETALLE POR ZONA -->
  <div class="seccion-titulo"> Detalle por Ubicación</div>
  ${detalleZonas}
</body>
</html>
  `
}
