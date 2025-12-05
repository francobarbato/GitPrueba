import prisma from "src/lib/db/prisma" // O usa 'src/lib/db/prisma' si tu proyecto lo requiere asi
import { subDays, differenceInDays } from "date-fns";

export class ReportesService {

  // =========================================================
  // 1. MATRIZ DE CARGA Y EFICIENCIA (Para la tabla de carga)
  // =========================================================
  async getCargaTrabajo() {
    const abogados = await prisma.user.findMany({
      where: { rol: "abogado", isActive: true },
      include: {
        casos: {
          select: { estado: true, priority: true, updatedAt: true },
        }
      }
    });

    // Obtenemos alertas críticas globales para cruzar datos
    // (Esto es opcional pero recomendado para precisión, aquí lo simplificamos por caso)
    
    return abogados.map(abogado => {
      const total = abogado.casos.length;
      
      // Filtros básicos
      const casosActivos = abogado.casos.filter(c => 
          c.estado !== "Cerrado" && c.estado !== "Archivado"
      );
      const cantidadActivos = casosActivos.length;
      const cerrados = total - cantidadActivos;

      // --- NUEVA LÓGICA DE ESTADO ---
      // 1. Detectar casos "Incendiados" (Prioridad Alta + Inactividad o solo Cantidad)
      // Para simplificar sin hacer mil consultas: Si tiene muchos casos HIGH activos, es un factor.
      const casosUrgentes = casosActivos.filter(c => c.priority === 'HIGH').length;

      let estadoCarga = "Disponible"; // Default verde
      
      // Regla 1: Volumen puro
      if (cantidadActivos >= 8) estadoCarga = "Ocupado"; // Amarillo
      if (cantidadActivos >= 15) estadoCarga = "Saturado"; // Rojo por cantidad

      // Regla 2: Cuello de botella (Si tiene más de 3 casos urgentes activos, está complicado)
      if (casosUrgentes >= 3) estadoCarga = "Sobrecargado"; // Rojo por complejidad

      // Eficiencia
      const eficiencia = total > 0 ? Math.round((cerrados / total) * 100) : 0;

      return {
        id: abogado.id,
        nombre: abogado.nombre ? `${abogado.nombre} ${abogado.apellido}` : (abogado.name || "Sin Nombre"),
        email: abogado.email,
        activos: cantidadActivos, 
        // En la columna "En Proceso" mostramos cuántos son URGENTES (HIGH).
        // Esto le da contexto al jefe: "Tiene 5 casos, pero 3 son Urgentes".
        enProceso: casosUrgentes, 
        eficiencia,
        estadoCarga 
      };
    });
  }
  // =========================================================
  // 2. MATRIZ DE RIESGO (RiskMatrix)
  // Reemplaza a tu antigua getMatrizPrioridades adaptándola a la UI
  // =========================================================
  async getMatrizRiesgos(userId?: string, esAdmin: boolean = true) {
    const whereUser = esAdmin ? {} : { abogadoId: userId };

    const casos = await prisma.caso.findMany({
      where: {
        ...whereUser,
        NOT: { estado: { in: ['Cerrado', 'Archivado'] } }
      },
      select: {
        id: true, numero: true, titulo: true, priority: true, updatedAt: true,
        cliente: { select: { nombre: true, apellido: true } },
        // Traemos requisitos pendientes para detectar "Bombas"
        requirements: {
          where: { isCompleted: false },
          orderBy: { dueDate: 'asc' }
        }
      }
    });

    const resultados = casos.map(c => {
      const diasInactivo = differenceInDays(new Date(), c.updatedAt);
      
      // --- LÓGICA DE BOMBA (Vencimientos) ---
      const proximoVencimiento = c.requirements.find(r => r.dueDate !== null);
      let hayBombaInminente = false;

      if (proximoVencimiento && proximoVencimiento.dueDate) {
         const hoy = new Date();
         const fechaVenc = new Date(proximoVencimiento.dueDate);
         const diasParaVencer = differenceInDays(fechaVenc, hoy);
         
         // Si vence en menos de 3 días o ya venció, es bomba
         if (diasParaVencer <= 3) hayBombaInminente = true;
      }

      // --- SEMÁFORO (Crítico / Atención / Al día) ---
      let estadoRiesgo = "Al día"; 

      if (hayBombaInminente) estadoRiesgo = "Crítico";
      else if (diasInactivo > 45) estadoRiesgo = "Crítico";
      else if (c.priority === "HIGH" && diasInactivo > 20) estadoRiesgo = "Crítico";
      else if (diasInactivo > 15) estadoRiesgo = "Atención";

      return {
        id: c.id,
        expediente: c.numero,
        caratula: c.titulo,
        cliente: c.cliente ? `${c.cliente.nombre} ${c.cliente.apellido}` : 'S/C',
        // Mapeamos tu Enum de Priority al texto que muestra el Badge
        complejidad: c.priority === "HIGH" ? "Alta" : c.priority === "LOW" ? "Baja" : "Media",
        ultimoMovimiento: c.updatedAt.toLocaleDateString('es-ES'),
        diasInactivo,
        estado: estadoRiesgo, // "Crítico", "Atención", "Al día"
        
        // Peso para ordenar (Críticos primero)
        pesoOrden: estadoRiesgo === "Crítico" ? 3 : estadoRiesgo === "Atención" ? 2 : 1
      };
    });

    // Ordenamos: Primero gravedad, luego inactividad
    return resultados
      .sort((a, b) => b.pesoOrden - a.pesoOrden || b.diasInactivo - a.diasInactivo)
      .slice(0, 10); // Top 10
  }

  // =========================================================
  // 3. ALERTAS UNIFICADAS (InactivityAlerts)
  // Combina casos olvidados y checklist vencidos
  // =========================================================
async getAlertasUnificadas(userId?: string, esAdmin: boolean = true) {
    const whereUser = esAdmin ? {} : { abogadoId: userId };
    const whereUserCaso = esAdmin ? {} : { caso: { abogadoId: userId } };
    const hoy = new Date();

    // 1. Requirements VENCIDOS o POR VENCER (Próximos 7 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(hoy.getDate() + 7);

    const checklistItems = await prisma.requirement.findMany({
        where: { 
            ...whereUserCaso,
            isCompleted: false, 
            dueDate: { lte: fechaLimite } // Menor a 7 días en el futuro (incluye pasados)
        },
        include: { 
            caso: { 
                include: { abogado: true },
            } 
        },
    });

    // 2. Casos ZOMBIES (Abandonados > 120 días)
    const casosZombies = await prisma.caso.findMany({
      where: { 
        ...whereUser,
        updatedAt: { lt: subDays(hoy, 120) },
        estado: { notIn: ["Cerrado", "Archivado"] }
      },
      include: { abogado: true },
      take: 3
    });

    // 3. PROCESAMIENTO Y UNIFICACIÓN
    const listaCombinada = [
        ...checklistItems.map(r => {
            const diasDiferencia = differenceInDays(r.dueDate!, hoy); // Negativo si ya pasó, Positivo si falta
            const esVencido = diasDiferencia < 0;
            const esCasoUrgente = r.caso.priority === 'HIGH';

            // ALGORITMO DE PUNTAJE (Score): Mientras más alto, más arriba en el ranking
            let score = 0;
            let gravedad = "Baja";
            let tipo = "Pendiente";

            if (esVencido) {
                score = 100 + Math.abs(diasDiferencia); // Vencido hace mucho = Mayor prioridad
                gravedad = "Critico";
                tipo = "Vencido";
            } else if (diasDiferencia <= 1) { // Hoy o Mañana
                score = 80 + (esCasoUrgente ? 10 : 0); // Si es caso High, suma puntos
                gravedad = "Critico";
                tipo = "Urgente";
            } else { // 2 a 7 días
                score = 50 + (esCasoUrgente ? 10 : 0) - diasDiferencia;
                gravedad = "Preventivo";
                tipo = "Próximo";
            }

            return {
                id: `req-${r.id}`,
                abogado: r.caso.abogado.nombre || "S/A",
                mensaje: r.description,
                subtitulo: `Caso: ${r.caso.titulo} (${r.caso.priority})`,
                tiempo: esVencido ? `Venció hace ${Math.abs(diasDiferencia)} días` : `Vence en ${diasDiferencia} días`,
                gravedad, // Critico | Preventivo
                tipo,
                score,
                link: `/casos/${r.caso.id}`
            };
        }),
        ...casosZombies.map(c => ({
            id: `zombie-${c.id}`,
            abogado: c.abogado.nombre || "S/A",
            mensaje: `Revisar Expediente Abandonado`,
            subtitulo: `Caso: ${c.titulo}`,
            tiempo: "+4 meses inactivo",
            gravedad: "Preventivo",
            tipo: "Abandono",
            score: 20 + (c.priority === 'HIGH' ? 5 : 0), // Prioridad baja comparado a vencimientos
            link: `/casos/${c.id}`
        }))
    ];

    // 4. ORDENAR POR SCORE DESCENDENTE (El ranking real)
    return listaCombinada.sort((a, b) => b.score - a.score).slice(0, 6); // Top 6 tareas
  }
}