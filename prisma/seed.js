const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 Iniciando SEED con datos mejorados...");

  // ============================================================
  // 1. LIMPIEZA (Borrado en cascada seguro)
  // ============================================================
  try {
    await prisma.bitacora.deleteMany();
    await prisma.tarea.deleteMany();
    await prisma.requirement.deleteMany(); 
  } catch (e) { console.log("✓ Tablas dependientes limpias."); }

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
  
  await prisma.user.create({
    data: {
      id: "u-admin-global",
      nombre: "Administrador", 
      apellido: "General", 
      email: "admin@estudio.com",
      password, 
      rol: "admin", 
      isActive: true, 
      name: "Admin General", 
      emailVerified: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      id: "u-hernan",
      nombre: "Hernán", 
      apellido: "Azar", 
      email: "hernan@estudio.com",
      password, 
      rol: "abogado", 
      isActive: true, 
      name: "Hernán Azar", 
      emailVerified: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      id: "u-agustin",
      nombre: "Agustín", 
      apellido: "Azar", 
      email: "agustin@estudio.com",
      password, 
      rol: "abogado", 
      isActive: true, 
      name: "Agustín Azar", 
      emailVerified: new Date(),
    },
  });

  await prisma.user.create({
    data: {
      id: "u-mario",
      nombre: "Mario", 
      apellido: "Rodriguez", 
      email: "mario@estudio.com",
      password, 
      rol: "abogado", 
      isActive: true, 
      name: "Mario Rodriguez", 
      emailVerified: new Date(),
    },
  });

  console.log("👥 4 Usuarios creados (1 Admin + 3 Abogados).");

  // ============================================================
  // 3. CLIENTES (ACTUALIZADOS CON NUEVOS CAMPOS)
  // ============================================================
  await prisma.cliente.createMany({
    data: [
      // ===== HERNÁN =====
      { 
        id: 'c-h-01', 
        tipoPersona: 'JURIDICA',
        nombre: "Crisis S.A.", 
        apellido: null, // Jurídica no tiene apellido
        email: "admin@crisis.com", 
        telefono: "+54 11 4567-8901",
        direccion: "Av. Corrientes 1234, CABA",
        tipoDocumento: "CUIT", 
        numeroDocumento: "30-11223344-5",
        condicionIva: "RESPONSABLE_INSCRIPTO",
        activo: true,
        abogadoId: "u-hernan" 
      },
      { 
        id: 'c-h-02', 
        tipoPersona: 'JURIDICA',
        nombre: "Transporte El Rápido S.R.L.", 
        apellido: null,
        email: "legales@elrapido.com", 
        telefono: "+54 351 456-7890",
        direccion: "Ruta 9 Km 45, Córdoba",
        tipoDocumento: "CUIT", 
        numeroDocumento: "30-55667788-9",
        condicionIva: "RESPONSABLE_INSCRIPTO",
        activo: true,
        abogadoId: "u-hernan" 
      },
      { 
        id: 'c-h-03', 
        tipoPersona: 'FISICA',
        nombre: "Juan", 
        apellido: "Pérez",
        email: "juan.perez@mail.com", 
        telefono: "+54 9 351 234-5678",
        direccion: "Caseros 456, Córdoba",
        tipoDocumento: "DNI", 
        numeroDocumento: "20333444",
        condicionIva: "CONSUMIDOR_FINAL",
        activo: true,
        abogadoId: "u-hernan" 
      },
      { 
        id: 'c-h-04', 
        tipoPersona: 'JURIDICA',
        nombre: "Constructora Norte S.A.", 
        apellido: null,
        email: "obras@constructoranorte.com", 
        telefono: "+54 381 789-1234",
        direccion: "San Martín 890, Tucumán",
        tipoDocumento: "CUIT", 
        numeroDocumento: "33-99887766-7",
        condicionIva: "RESPONSABLE_INSCRIPTO",
        notasInternas: "Cliente moroso - revisar cuenta corriente",
        activo: true,
        abogadoId: "u-hernan" 
      },
      
      // ===== AGUSTÍN =====
      { 
        id: 'c-a-01', 
        tipoPersona: 'FISICA',
        nombre: "María", 
        apellido: "Gómez",
        email: "maria.gomez@mail.com", 
        telefono: "+54 9 11 5678-9012",
        direccion: "Rivadavia 123, CABA",
        tipoDocumento: "DNI", 
        numeroDocumento: "27112223",
        condicionIva: "MONOTRIBUTISTA",
        activo: true,
        abogadoId: "u-agustin" 
      },
      { 
        id: 'c-a-02', 
        tipoPersona: 'FISICA',
        nombre: "Esteban", 
        apellido: "Quito",
        email: "esteban.quito@mail.com", 
        telefono: "+54 9 341 987-6543",
        direccion: "Belgrano 789, Rosario",
        tipoDocumento: "DNI", 
        numeroDocumento: "20998877",
        condicionIva: "CONSUMIDOR_FINAL",
        activo: true,
        abogadoId: "u-agustin" 
      },
      
      // ===== MARIO =====
      { 
        id: 'c-m-01', 
        tipoPersona: 'FISICA',
        nombre: "Roberto", 
        apellido: "Carlos",
        email: "roberto.carlos@mail.com", 
        telefono: "+54 9 261 123-4567",
        direccion: "Las Heras 234, Mendoza",
        tipoDocumento: "DNI", 
        numeroDocumento: "20123123",
        condicionIva: "CONSUMIDOR_FINAL",
        activo: true,
        abogadoId: "u-mario" 
      },
    ]
  });

  console.log("👤 7 Clientes creados (3 Jurídicas + 4 Físicas).");

  // ============================================================
  // 4. CASOS (ACTUALIZADOS CON NUEVOS CAMPOS)
  // ============================================================
  await prisma.caso.createMany({
    data: [
      // ===== HERNÁN =====
      { 
        id: 'cs-h-01', 
        numero: 'EXP-2025-001', 
        titulo: 'Crisis S.A. c/ Obra Social s/ Amparo Salud', 
        descripcion: 'Medida cautelar urgente por cobertura oncológica.',
        tipo: 'CIVIL', 
        estado: 'Prueba (Oficios/Pericias)', 
        porcentajeAvance: 80, 
        fechaInicio: new Date('2025-10-01'),
        juzgado: "Juzgado Nº 12 Civil y Comercial",
        fuero: "Capital Federal",
        contraparteNombre: "Obra Social del Personal de Comercio",
        contraparteDni: "30-12345678-9",
        montoDisputa: 5000000.00,
        ubicacionFisica: "Bibliorato A - Estante 3",
        abogadoId: 'u-hernan', 
        clienteId: 'c-h-01', 
        priority: 'HIGH', 
        isFavorite: true 
      },
      { 
        id: 'cs-h-02', 
        numero: 'EXP-2025-045', 
        titulo: 'Pérez, Juan c/ Fábrica Textil s/ Despido', 
        descripcion: 'Reclamo indemnizatorio por despido sin causa.',
        tipo: 'LABORAL', 
        estado: 'Inicio / Demanda', 
        porcentajeAvance: 10, 
        fechaInicio: new Date('2025-11-15'),
        juzgado: "Juzgado Nº 5 del Trabajo",
        fuero: "Provincia de Buenos Aires",
        contraparteNombre: "Textil La Productiva S.A.",
        montoDisputa: 850000.00,
        ubicacionFisica: "Bibliorato C - Estante 1",
        abogadoId: 'u-hernan', 
        clienteId: 'c-h-03', 
        priority: 'NORMAL' 
      },
      { 
        id: 'cs-h-03', 
        numero: 'EXP-2024-999', 
        titulo: 'Ejecución Fiscal AFIP c/ Crisis S.A.', 
        descripcion: 'Embargo bancario por deuda impositiva.',
        tipo: 'COMERCIAL', 
        estado: 'Mediación / Previo', 
        porcentajeAvance: 50, 
        fechaInicio: new Date('2024-05-20'),
        juzgado: "Juzgado Federal Nº 3",
        fuero: "Capital Federal",
        contraparteNombre: "AFIP - Administración Federal",
        montoDisputa: 12500000.00,
        ubicacionFisica: "Caja Fuerte - Sector Urgentes",
        abogadoId: 'u-hernan', 
        clienteId: 'c-h-01', 
        priority: 'HIGH' 
      },

      // ===== AGUSTÍN =====
      { 
        id: 'cs-a-01', 
        numero: 'EXP-FAM-001', 
        titulo: 'Gómez, María s/ Divorcio Contencioso', 
        descripcion: 'Divorcio con liquidación de sociedad conyugal.',
        tipo: 'FAMILIA', 
        estado: 'Prueba (Oficios/Pericias)', 
        porcentajeAvance: 60, 
        fechaInicio: new Date('2025-08-01'),
        juzgado: "Juzgado Nº 8 de Familia",
        fuero: "Capital Federal",
        contraparteNombre: "Gómez, Carlos Alberto",
        contraparteDni: "18765432",
        montoDisputa: 3200000.00,
        ubicacionFisica: "Bibliorato B - Estante 2",
        abogadoId: 'u-agustin', 
        clienteId: 'c-a-01', 
        priority: 'HIGH' 
      },
      { 
        id: 'cs-a-02', 
        numero: 'EXP-FAM-002', 
        titulo: 'Quito, Esteban s/ Cuota Alimentaria', 
        descripcion: 'Reclamo de aumento de cuota por hijos menores.',
        tipo: 'FAMILIA', 
        estado: 'Terminado', 
        porcentajeAvance: 100, 
        fechaInicio: new Date('2025-01-10'), 
        fechaFin: new Date('2025-06-20'),
        juzgado: "Juzgado Nº 4 de Familia",
        fuero: "Rosario",
        montoDisputa: 450000.00,
        ubicacionFisica: "Archivo General - Caja 2025",
        abogadoId: 'u-agustin', 
        clienteId: 'c-a-02', 
        priority: 'NORMAL' 
      },

      // ===== MARIO =====
      { 
        id: 'cs-m-01', 
        numero: 'EXP-PEN-100', 
        titulo: 'Carlos, Roberto s/ Lesiones Leves', 
        descripcion: 'Defensa penal en causa de lesiones en riña.',
        tipo: 'PENAL', 
        estado: 'Alegatos / Conclusiones', 
        porcentajeAvance: 40, 
        fechaInicio: new Date('2025-11-01'),
        juzgado: "Juzgado Correccional Nº 2",
        fuero: "Mendoza",
        contraparteNombre: "Fiscal de Instrucción",
        ubicacionFisica: "Bibliorato D - Estante 1",
        abogadoId: 'u-mario', 
        clienteId: 'c-m-01', 
        priority: 'HIGH' 
      },
    ]
  });

  console.log("📂 7 Casos creados con datos completos.");

  // ============================================================
  // 5. TAREAS (Para alertas)
  // ============================================================
  await prisma.tarea.createMany({
    data: [
      { 
        titulo: "Contestar Demanda (VENCIDA)", 
        fecha: "2025-11-25", 
        completada: false, 
        prioridad: "Alta", 
        fatal: true, 
        casoId: 'cs-h-02', 
        usuarioId: 'u-hernan' 
      },
      { 
        titulo: "Presentar pericia médica", 
        fecha: "2025-12-15", 
        completada: false, 
        prioridad: "Alta", 
        fatal: true, 
        casoId: 'cs-h-01', 
        usuarioId: 'u-hernan' 
      },
      { 
        titulo: "Audiencia de Conciliación", 
        fecha: "2025-12-20", 
        completada: false, 
        prioridad: "Alta", 
        fatal: true, 
        casoId: 'cs-a-01', 
        usuarioId: 'u-agustin' 
      },
      { 
        titulo: "Presentar alegato defensa (VENCE HOY)", 
        fecha: new Date().toISOString().split('T')[0], 
        completada: false, 
        prioridad: "Alta", 
        fatal: true, 
        casoId: 'cs-m-01', 
        usuarioId: 'u-mario' 
      },
    ]
  });

  console.log("📋 4 Tareas urgentes creadas.");

  // ============================================================
  // 6. BITÁCORA
  // ============================================================
  await prisma.bitacora.createMany({
    data: [
      { casoId: 'cs-h-01', texto: 'Carpeta ingresada al sistema', accion: 'CREATE', detalle: 'Inicio de trámite', tipo: 'auto', usuarioId: 'u-hernan', createdAt: new Date('2025-10-01') },
      { casoId: 'cs-h-01', texto: 'Presentada medida cautelar', accion: 'UPDATE', detalle: 'MC admitida por el juzgado', tipo: 'manual', usuarioId: 'u-hernan', createdAt: new Date('2025-10-15') },
      { casoId: 'cs-a-01', texto: 'Audiencia de conciliación fijada', accion: 'Agenda', detalle: 'Fecha: 20/12/2025', tipo: 'auto', usuarioId: 'u-agustin', createdAt: new Date('2025-11-10') },
      { casoId: 'cs-m-01', texto: 'Cliente declaró en indagatoria', accion: 'UPDATE', detalle: 'Se negó a declarar (asesorado)', tipo: 'manual', usuarioId: 'u-mario', createdAt: new Date('2025-11-05') },
    ]
  });

  console.log("📝 Bitácora inicial creada.");
  console.log("");
  console.log("✅ ===== SEED COMPLETADO EXITOSAMENTE =====");
  console.log("📊 Resumen:");
  console.log("   • 4 Usuarios (1 Admin + 3 Abogados)");
  console.log("   • 7 Clientes (3 Jurídicas + 4 Físicas)");
  console.log("   • 7 Casos (con datos jurisdiccionales completos)");
  console.log("   • 4 Tareas urgentes");
  console.log("   • 4 Movimientos de bitácora");
  console.log("");
  console.log("🔑 Credenciales de acceso:");
  console.log("   Admin:    admin@estudio.com / 123456");
  console.log("   Hernán:   hernan@estudio.com / 123456");
  console.log("   Agustín:  agustin@estudio.com / 123456");
  console.log("   Mario:    mario@estudio.com / 123456");
}

main()
  .catch((e) => {
    console.error("❌ Error ejecutando seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });