const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 Iniciando SEED FINAL REPARADO...");

  // ============================================================
  // 1. LIMPIEZA (Borrado en cascada seguro)
  // ============================================================
  try {
    await prisma.bitacora.deleteMany();
    await prisma.tarea.deleteMany();
    await prisma.requirement.deleteMany(); 
  } catch (e) { console.log(" - Tablas dependientes limpias."); }

  await prisma.caso.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️ Base de datos limpiada.");

  const password = await bcrypt.hash("123456", 10);

  // ============================================================
  // 2. USUARIOS (Admin + 3 Abogados)
  // ============================================================
  
  // ADMIN GLOBAL
  await prisma.user.create({
    data: {
      id: "u-admin-global",
      nombre: "Administrador", apellido: "General", email: "admin@estudio.com",
      password, rol: "admin", isActive: true, name: "Admin General", emailVerified: new Date(),
    },
  });

  // HERNÁN
  await prisma.user.create({
    data: {
      id: "u-hernan",
      nombre: "Hernán", apellido: "Azar", email: "hernan@estudio.com",
      password, rol: "abogado", isActive: true, name: "Hernán Azar", emailVerified: new Date(),
    },
  });

  // AGUSTÍN
  await prisma.user.create({
    data: {
      id: "u-agustin",
      nombre: "Agustín", apellido: "Azar", email: "agustin@estudio.com",
      password, rol: "abogado", isActive: true, name: "Agustín Azar", emailVerified: new Date(),
    },
  });

  // MARIO
  await prisma.user.create({
    data: {
      id: "u-mario",
      nombre: "Mario", apellido: "Rodriguez", email: "mario@estudio.com",
      password, rol: "abogado", isActive: true, name: "Mario Rodriguez", emailVerified: new Date(),
    },
  });

  console.log("👥 Usuarios creados.");

  // ============================================================
  // 3. CLIENTES
  // ============================================================
  await prisma.cliente.createMany({
    data: [
      // Hernán
      { id: 'c-h-01', nombre: "Empresa", apellido: "Crisis S.A.", email: "admin@crisis.com", tipoDocumento: "CUIT", numeroDocumento: "30-112233-4", estado: "Activo", abogadoId: "u-hernan" },
      { id: 'c-h-02', nombre: "Transporte", apellido: "El Rápido", email: "legales@elrapido.com", tipoDocumento: "CUIT", numeroDocumento: "30-556677-8", estado: "Activo", abogadoId: "u-hernan" },
      { id: 'c-h-03', nombre: "Juan", apellido: "Pérez", email: "juan.p@mail.com", tipoDocumento: "DNI", numeroDocumento: "20333444", estado: "Activo", abogadoId: "u-hernan" },
      { id: 'c-h-04', nombre: "Constructora", apellido: "Norte", email: "obras@norte.com", tipoDocumento: "CUIT", numeroDocumento: "33-998877-6", estado: "Deudor", abogadoId: "u-hernan" },
      // Agustín
      { id: 'c-a-01', nombre: "Maria", apellido: "Gomez", email: "maria.g@mail.com", tipoDocumento: "DNI", numeroDocumento: "2711222333", estado: "Activo", abogadoId: "u-agustin" },
      { id: 'c-a-02', nombre: "Esteban", apellido: "Quito", email: "esteban@mail.com", tipoDocumento: "DNI", numeroDocumento: "20998877", estado: "Activo", abogadoId: "u-agustin" },
      // Mario
      { id: 'c-m-01', nombre: "Roberto", apellido: "Carlos", email: "rcarlos@mail.com", tipoDocumento: "DNI", numeroDocumento: "20123123", estado: "Activo", abogadoId: "u-mario" },
    ]
  });

  // ============================================================
  // 4. CASOS (Aquí estaba el error de sintaxis, ya corregido)
  // ============================================================
  await prisma.caso.createMany({
    data: [
      // --- HERNÁN ---
      { 
        id: 'cs-h-01', numero: 'EXP-2025-001', titulo: 'Amparo Salud Crisis S.A.', descripcion: 'Medida cautelar urgente.',
        tipo: 'Amparo', estado: 'En proceso', porcentajeAvance: 80, fechaInicio: new Date('2025-10-01'), 
        abogadoId: 'u-hernan', clienteId: 'c-h-01', priority: 'HIGH', isFavorite: true 
      },
      { 
        id: 'cs-h-02', numero: 'EXP-2025-045', titulo: 'Despido Pérez c/ Fábrica', descripcion: 'Reclamo indemnizatorio.',
        tipo: 'Laboral', estado: 'Abierto', porcentajeAvance: 10, fechaInicio: new Date('2025-11-15'), 
        abogadoId: 'u-hernan', clienteId: 'c-h-03', priority: 'NORMAL' 
      },
      { 
        id: 'cs-h-03', numero: 'EXP-2024-999', titulo: 'Ejecución Fiscal AFIP', descripcion: 'Embargo bancario.',
        tipo: 'Tributario', estado: 'Suspendido', porcentajeAvance: 50, fechaInicio: new Date('2024-05-20'), 
        abogadoId: 'u-hernan', clienteId: 'c-h-01', priority: 'HIGH' 
      },

      // --- AGUSTÍN ---
      { 
        id: 'cs-a-01', numero: 'EXP-FAM-001', titulo: 'Divorcio Gomez', descripcion: 'Divorcio con bienes.',
        tipo: 'Familia', estado: 'En proceso', porcentajeAvance: 60, fechaInicio: new Date('2025-08-01'), 
        abogadoId: 'u-agustin', clienteId: 'c-a-01', priority: 'HIGH' 
      },
      { 
        id: 'cs-a-02', numero: 'EXP-FAM-002', titulo: 'Alimentos Quito', descripcion: 'Cuota alimentaria.',
        tipo: 'Familia', estado: 'Cerrado', porcentajeAvance: 100, fechaInicio: new Date('2025-01-10'), fechaCierre: new Date('2025-06-20'),
        abogadoId: 'u-agustin', clienteId: 'c-a-02', priority: 'NORMAL' 
      },

      // --- MARIO ---
      { 
        id: 'cs-m-01', numero: 'EXP-PEN-100', titulo: 'Defensa Penal Carlos', descripcion: 'Causa lesiones.',
        tipo: 'Penal', estado: 'En proceso', porcentajeAvance: 40, fechaInicio: new Date('2025-11-01'), 
        abogadoId: 'u-mario', clienteId: 'c-m-01', priority: 'HIGH' 
      },
    ]
  });

  console.log("📂 Casos cargados.");

  // ============================================================
  // 5. TAREAS (Para alertas ROJAS)
  // ============================================================
  await prisma.tarea.createMany({
    data: [
      // Hernán (Vencidas)
      { titulo: "Contestar Demanda (VENCIDA)", fecha: "2025-11-25", completada: false, prioridad: "Alta", fatal: true, casoId: 'cs-h-02', usuarioId: 'u-hernan' },
      { titulo: "Pagar Bono Ley (VENCIDA)", fecha: "2025-11-30", completada: false, prioridad: "Media", fatal: false, casoId: 'cs-h-03', usuarioId: 'u-hernan' },
      
      // Agustín (A futuro)
      { titulo: "Audiencia Conciliación", fecha: "2025-12-20", completada: false, prioridad: "Alta", fatal: true, casoId: 'cs-a-01', usuarioId: 'u-agustin' },

      // Mario (Vence Hoy)
      { titulo: "Presentar Escrito (VENCE HOY)", fecha: new Date().toISOString().split('T')[0], completada: false, prioridad: "Alta", fatal: true, casoId: 'cs-m-01', usuarioId: 'u-mario' },
    ]
  });

  // ============================================================
  // 6. BITÁCORA
  // ============================================================
  await prisma.bitacora.createMany({
      data: [
          { casoId: 'cs-h-01', texto: 'Ingreso de carpeta', accion: 'CREATE', detalle: 'Inicio', tipo: 'sistema', usuarioId: 'u-hernan', createdAt: new Date('2025-10-01') },
          { casoId: 'cs-a-01', texto: 'Audiencia fijada', accion: 'UPDATE', detalle: 'Fecha 20/12', tipo: 'sistema', usuarioId: 'u-agustin', createdAt: new Date('2025-11-10') },
          { casoId: 'cs-m-01', texto: 'Declaración indagatoria', accion: 'UPDATE', detalle: 'Cliente declaró', tipo: 'manual', usuarioId: 'u-mario', createdAt: new Date('2025-11-05') },
      ]
  });

  console.log("✅ SEED COMPLETADO CORRECTAMENTE");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
