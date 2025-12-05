import prisma from "src/lib/db/prisma";
import { Prisma } from "@prisma/client";

// --- 1. HISTORIAL REAL ---
export const getHistorialGlobal = async (
  usuarioId: string | number, 
  esAdmin: boolean, 
  query: string = ""
) => {
  
  // Filtro dinámico
  const whereClause: Prisma.BitacoraWhereInput = {};

  if (query) {
    whereClause.OR = [
      { tipo: { contains: query } },  // Busca por tipo
      { texto: { contains: query } }, // Busca por texto
      { usuario: { nombre: { contains: query } } }, // Busca por nombre de usuario
      { caso: { numero: { contains: query } } }     // Busca por número de caso
    ];
  }

  // Consulta a la DB
  const data = await prisma.bitacora.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: {
      usuario: true, // Traemos datos del usuario
      caso: true     // Traemos datos del caso
    },
    take: 50 // Limitamos a 50 para no explotar la vista
  });

  // Mapeo: Convertimos los nombres de la DB a lo que usa tu Front
  return data.map(item => ({
    id: item.id,
    tipo: item.casoId ? 'caso' : 'sistema', // Lógica para el ícono
    accion: item.tipo,   // DB: tipo -> Front: accion
    detalle: item.texto, // DB: texto -> Front: detalle
    fecha: item.createdAt.toLocaleDateString('es-AR', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' 
    }),
    usuario: item.usuario ? `${item.usuario.nombre} ${item.usuario.apellido}` : 'Usuario eliminado'
  }));
};

// --- 2. PRODUCTIVIDAD REAL (Calculada desde la DB) ---
export const getProductividadSemanal = async () => {
  // Calculamos la fecha de hace 7 días
  const haceSieteDias = new Date();
  haceSieteDias.setDate(haceSieteDias.getDate() - 7);

  // Agrupamos bitácoras por usuarioId creadas en la última semana
  const agrupado = await prisma.bitacora.groupBy({
    by: ['usuarioId'],
    where: {
      createdAt: {
        gte: haceSieteDias
      }
    },
    _count: {
      _all: true
    },
    orderBy: {
      _count: {
        usuarioId: 'desc'
      }
    },
    take: 3 // Traemos el Top 3 más productivos
  });

  // Como groupBy no trae los nombres del usuario (solo IDs), los buscamos aparte
  // Esto es necesario en Prisma para mantener performance
  const resultados = await Promise.all(agrupado.map(async (item) => {
    const usuario = await prisma.user.findUnique({
      where: { id: item.usuarioId }
    });

    return {
      nombre: usuario ? `${usuario.nombre} ${usuario.apellido}` : 'Desconocido',
      acciones: item._count._all
    };
  }));

  return resultados;
};