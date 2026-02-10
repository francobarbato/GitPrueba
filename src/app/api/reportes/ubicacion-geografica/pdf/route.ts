// app/api/reportes/ubicacion-geografica/pdf/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getUserSessionServer } from '@/auth/actions/auth-actions'

// Usamos jsPDF que funciona en el servidor con Node
// Alternativa: reportlab con Python, pero esto es más simple para Next.js

export async function POST(request: NextRequest) {
  try {
    const user = await getUserSessionServer()
    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { zonas, vistaGeneral, fechaGeneracion } = body

    // Generar HTML para el PDF
    const html = generarHTMLReporte(zonas, vistaGeneral, fechaGeneracion, user)

    // Para simplificar, devolvemos el HTML que el cliente puede imprimir como PDF
    // En producción podrías usar puppeteer o similar para generar PDF real
    
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="casos-ubicacion-${new Date().toISOString().split('T')[0]}.html"`,
      },
    })
  } catch (error) {
    console.error('Error generando PDF:', error)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

function generarHTMLReporte(
  zonas: any[], 
  vistaGeneral: boolean, 
  fechaGeneracion: string,
  user: any
): string {
  const fecha = new Date(fechaGeneracion).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  const totalCasos = zonas.reduce((sum: number, z: any) => sum + z.totalCasos, 0)
  const totalUrgentes = zonas.reduce((sum: number, z: any) => sum + z.casosUrgentes, 0)

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

  zonas.forEach((zona: any) => {
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
  
  zonas.forEach((zona: any) => {
    detalleZonas += `
      <div class="zona-detalle">
        <h2>📍 Casos en ${zona.ciudad}, ${zona.provincia} (${zona.totalCasos})</h2>
        <p class="zona-info">
          Distancia desde Córdoba Capital: <strong>${zona.distanciaKm} km</strong> | 
          Clasificación: <strong>${zona.clasificacionDistancia.label}</strong>
          ${zona.casosUrgentes > 0 ? ` | <span class="urgente">⚠️ ${zona.casosUrgentes} urgente(s)</span>` : ''}
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

    zona.casos.forEach((caso: any) => {
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
  <title>Casos por Ubicación Geográfica</title>
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
    
    @media print {
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
      <p><strong>Generado por:</strong> ${user.nombre || user.email}</p>
    </div>
  </div>

  <!-- TABLA RESUMEN -->
  <h2 class="seccion-titulo">📊 Resumen por Ciudad</h2>
  ${tablaResumen}

  <!-- DETALLE POR ZONA -->
  <h2 class="seccion-titulo">📋 Detalle por Ubicación</h2>
  ${detalleZonas}

  <script>
    // Auto-imprimir al abrir
    // window.onload = function() { window.print(); }
  </script>
</body>
</html>
  `
}
