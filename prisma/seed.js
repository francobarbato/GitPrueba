// prisma/seed.js
// Seed v2 — Optimizado para todos los reportes incluido ES-12 (Cartera de Clientes)
// 40 clientes, ~85 casos, distribución geográfica realista
// Cobertura ES-12: clientes frecuentes (5+ casos), recurrentes (2-4), únicos (1),
//                  inactivos (solo cerrados), mix persona/jurídica, antigüedades variadas

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 Iniciando SEED v2...");

  // ============================================================
  // 1. LIMPIEZA
  // ============================================================
  try {
    await prisma.bitacora.deleteMany();
    await prisma.tarea.deleteMany();
    await prisma.requirement.deleteMany();
    await prisma.pago.deleteMany();
  } catch (e) { console.log("✓ Tablas dependientes limpias."); }

  try { await prisma.casoColaborador.deleteMany(); } catch (e) {}

  await prisma.caso.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️ Base de datos limpiada.");

  const password = await bcrypt.hash("123456", 10);

  // ============================================================
  // 2. USUARIOS
  // ============================================================
  const usuarios = [
    { id: "u-admin",     nombre: "Carlos",    apellido: "Mendoza",   email: "admin@estudio.com",      rol: "ADMIN" },
    { id: "u-hernan",    nombre: "Hernán",    apellido: "Azar",      email: "hernan@estudio.com",     rol: "ABOGADO" },
    { id: "u-agustin",   nombre: "Agustín",   apellido: "Azar",      email: "agustin@estudio.com",    rol: "ABOGADO" },
    { id: "u-mario",     nombre: "Mario",     apellido: "Rodríguez", email: "mario@estudio.com",      rol: "ABOGADO" },
    { id: "u-laura",     nombre: "Laura",     apellido: "Fernández", email: "laura@estudio.com",      rol: "ABOGADO" },
    { id: "u-asistente", nombre: "Valentina", apellido: "López",     email: "valentina@estudio.com",  rol: "ASISTENTE" },
  ];

  for (const u of usuarios) {
    await prisma.user.create({
      data: { ...u, password, isActive: true, name: `${u.nombre} ${u.apellido}`, emailVerified: new Date() },
    });
  }
  console.log("👥 6 Usuarios creados.");

  // ============================================================
  // 3. CLIENTES (38)
  // ============================================================
  // Distribución objetivo para ES-12:
  //   Frecuentes (5+ casos): ~4 clientes (empresas grandes)
  //   Recurrentes (2-4 casos): ~12 clientes (mix persona/empresa)
  //   Únicos (1 caso): ~14 clientes
  //   Inactivos (solo cerrados): ~8 clientes
  //   Sin casos (recién cargados): ~2 clientes
  //
  // Antigüedad variada: desde 2 años hasta hace 1 semana
  // ============================================================

  const diasAtrasDate = (dias) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  const clientes = [
    // === FRECUENTES (empresas grandes, muchos casos) ===
    { id: 'c-01', tipoPersona: 'JURIDICA', nombre: "TechCorp S.A.",               apellido: null,        email: "legal@techcorp.com",        telefono: "+54 11 4567-0001", tipoDocumento: "CUIT", numeroDocumento: "30-70001111-1", abogadoId: "u-hernan",  createdAt: diasAtrasDate(730) },
    { id: 'c-04', tipoPersona: 'JURIDICA', nombre: "Constructora del Sur S.R.L.", apellido: null,        email: "admin@consur.com",          telefono: "+54 351 444-0001", tipoDocumento: "CUIT", numeroDocumento: "30-70002222-2", abogadoId: "u-hernan",  createdAt: diasAtrasDate(650) },
    { id: 'c-12', tipoPersona: 'JURIDICA', nombre: "Transporte Rápido S.A.",      apellido: null,        email: "legal@transrapido.com",     telefono: "+54 341 555-0001", tipoDocumento: "CUIT", numeroDocumento: "30-70004444-4", abogadoId: "u-mario",   createdAt: diasAtrasDate(600) },
    { id: 'c-20', tipoPersona: 'JURIDICA', nombre: "Agro Pampa S.A.",             apellido: null,        email: "legal@agropampa.com",       telefono: "+54 342 666-0001", tipoDocumento: "CUIT", numeroDocumento: "30-70006666-6", abogadoId: "u-laura",   createdAt: diasAtrasDate(550) },

    // === RECURRENTES (2-4 casos, mix persona/empresa) ===
    { id: 'c-02', tipoPersona: 'FISICA',   nombre: "Carlos",                      apellido: "Mendoza",   email: "carlos.mendoza@mail.com",   telefono: "+54 9 351 111-0001", tipoDocumento: "DNI", numeroDocumento: "20111001", abogadoId: "u-hernan",  createdAt: diasAtrasDate(500) },
    { id: 'c-03', tipoPersona: 'FISICA',   nombre: "Ana",                         apellido: "López",     email: "ana.lopez@mail.com",        telefono: "+54 9 351 111-0002", tipoDocumento: "DNI", numeroDocumento: "27222002", abogadoId: "u-hernan",  createdAt: diasAtrasDate(480) },
    { id: 'c-05', tipoPersona: 'FISICA',   nombre: "Roberto",                     apellido: "Díaz",      email: "roberto.diaz@mail.com",     telefono: "+54 9 351 111-0003", tipoDocumento: "DNI", numeroDocumento: "18333003", abogadoId: "u-hernan",  createdAt: diasAtrasDate(400) },
    { id: 'c-06', tipoPersona: 'FISICA',   nombre: "María",                       apellido: "García",    email: "maria.garcia@mail.com",     telefono: "+54 9 351 222-0001", tipoDocumento: "DNI", numeroDocumento: "25444004", abogadoId: "u-agustin", createdAt: diasAtrasDate(420) },
    { id: 'c-07', tipoPersona: 'FISICA',   nombre: "Jorge",                       apellido: "Martínez",  email: "jorge.martinez@mail.com",   telefono: "+54 9 351 222-0002", tipoDocumento: "DNI", numeroDocumento: "22555005", abogadoId: "u-agustin", createdAt: diasAtrasDate(380) },
    { id: 'c-08', tipoPersona: 'JURIDICA', nombre: "Importadora Global S.A.",     apellido: null,        email: "legal@impglobal.com",       telefono: "+54 11 4567-0002",   tipoDocumento: "CUIT", numeroDocumento: "30-70003333-3", abogadoId: "u-agustin", createdAt: diasAtrasDate(500) },
    { id: 'c-11', tipoPersona: 'FISICA',   nombre: "Andrés",                      apellido: "Gómez",     email: "andres.gomez@mail.com",     telefono: "+54 9 351 333-0001", tipoDocumento: "DNI", numeroDocumento: "23888008", abogadoId: "u-mario",   createdAt: diasAtrasDate(450) },
    { id: 'c-15', tipoPersona: 'FISICA',   nombre: "Carolina",                    apellido: "Vega",      email: "carolina.vega@mail.com",    telefono: "+54 9 351 444-0001", tipoDocumento: "DNI", numeroDocumento: "28111011", abogadoId: "u-laura",   createdAt: diasAtrasDate(370) },
    { id: 'c-16', tipoPersona: 'JURIDICA', nombre: "Inmobiliaria Centro S.A.",    apellido: null,        email: "legal@inmobcentro.com",     telefono: "+54 351 555-0002",   tipoDocumento: "CUIT", numeroDocumento: "30-70005555-5", abogadoId: "u-laura",   createdAt: diasAtrasDate(360) },
    { id: 'c-19', tipoPersona: 'FISICA',   nombre: "Diego",                       apellido: "Ruiz",      email: "diego.ruiz@mail.com",       telefono: "+54 9 351 444-0003", tipoDocumento: "DNI", numeroDocumento: "25444014", abogadoId: "u-laura",   createdAt: diasAtrasDate(330) },
    { id: 'c-22', tipoPersona: 'JURIDICA', nombre: "Metalúrgica Norte S.A.",      apellido: null,        email: "legal@metalnorte.com",      telefono: "+54 351 666-0001",   tipoDocumento: "CUIT", numeroDocumento: "30-70007777-7", abogadoId: "u-hernan",  createdAt: diasAtrasDate(300) },
    { id: 'c-25', tipoPersona: 'JURIDICA', nombre: "Farmacia del Pueblo S.R.L.",  apellido: null,        email: "legal@farmpueblo.com",      telefono: "+54 351 666-0002",   tipoDocumento: "CUIT", numeroDocumento: "30-70008888-8", abogadoId: "u-laura",   createdAt: diasAtrasDate(340) },
    { id: 'c-28', tipoPersona: 'JURIDICA', nombre: "Cereales del Centro S.A.",    apellido: null,        email: "legal@cercentro.com",       telefono: "+54 353 777-0001",   tipoDocumento: "CUIT", numeroDocumento: "30-70009999-9", abogadoId: "u-mario",   createdAt: diasAtrasDate(280) },

    // === ÚNICOS (1 solo caso cada uno) ===
    { id: 'c-09', tipoPersona: 'FISICA',   nombre: "Lucía",                       apellido: "Fernández", email: "lucia.fernandez@mail.com",  telefono: "+54 9 351 222-0003", tipoDocumento: "DNI", numeroDocumento: "29666006", abogadoId: "u-agustin", createdAt: diasAtrasDate(200) },
    { id: 'c-10', tipoPersona: 'FISICA',   nombre: "Pedro",                       apellido: "Sánchez",   email: "pedro.sanchez@mail.com",    telefono: "+54 9 351 222-0004", tipoDocumento: "DNI", numeroDocumento: "21777007", abogadoId: "u-agustin", createdAt: diasAtrasDate(310) },
    { id: 'c-13', tipoPersona: 'FISICA',   nombre: "Silvia",                      apellido: "Romero",    email: "silvia.romero@mail.com",    telefono: "+54 9 351 333-0002", tipoDocumento: "DNI", numeroDocumento: "26999009", abogadoId: "u-mario",   createdAt: diasAtrasDate(250) },
    { id: 'c-14', tipoPersona: 'FISICA',   nombre: "Martín",                      apellido: "Torres",    email: "martin.torres@mail.com",    telefono: "+54 9 351 333-0003", tipoDocumento: "DNI", numeroDocumento: "24000010", abogadoId: "u-mario",   createdAt: diasAtrasDate(350) },
    { id: 'c-17', tipoPersona: 'FISICA',   nombre: "Fernando",                    apellido: "Castro",    email: "fernando.castro@mail.com",  telefono: "+54 9 351 444-0002", tipoDocumento: "DNI", numeroDocumento: "20222012", abogadoId: "u-laura",   createdAt: diasAtrasDate(180) },
    { id: 'c-18', tipoPersona: 'FISICA',   nombre: "Patricia",                    apellido: "Morales",   email: "patricia.morales@mail.com", telefono: "+54 9 351 444-0004", tipoDocumento: "DNI", numeroDocumento: "27333013", abogadoId: "u-laura",   createdAt: diasAtrasDate(200) },
    { id: 'c-21', tipoPersona: 'FISICA',   nombre: "Raúl",                        apellido: "Pereyra",   email: "raul.pereyra@mail.com",     telefono: "+54 9 351 555-0001", tipoDocumento: "DNI", numeroDocumento: "19555015", abogadoId: "u-hernan",  createdAt: diasAtrasDate(300) },
    { id: 'c-23', tipoPersona: 'FISICA',   nombre: "Gabriela",                    apellido: "Acosta",    email: "gabriela.acosta@mail.com",  telefono: "+54 9 351 555-0002", tipoDocumento: "DNI", numeroDocumento: "30666016", abogadoId: "u-hernan",  createdAt: diasAtrasDate(30) },
    { id: 'c-26', tipoPersona: 'FISICA',   nombre: "Estela",                      apellido: "Navarro",   email: "estela.navarro@mail.com",   telefono: "+54 9 351 666-0001", tipoDocumento: "DNI", numeroDocumento: "26888018", abogadoId: "u-agustin", createdAt: diasAtrasDate(270) },
    { id: 'c-29', tipoPersona: 'FISICA',   nombre: "Liliana",                     apellido: "Paz",       email: "liliana.paz@mail.com",      telefono: "+54 9 351 777-0001", tipoDocumento: "DNI", numeroDocumento: "28000020", abogadoId: "u-mario",   createdAt: diasAtrasDate(240) },
    { id: 'c-30', tipoPersona: 'FISICA',   nombre: "Marcelo",                     apellido: "Ríos",      email: "marcelo.rios@mail.com",     telefono: "+54 9 351 777-0002", tipoDocumento: "DNI", numeroDocumento: "23111021", abogadoId: "u-mario",   createdAt: diasAtrasDate(260) },

    // === INACTIVOS (solo casos cerrados, hace tiempo sin actividad) ===
    { id: 'c-31', tipoPersona: 'FISICA',   nombre: "Osvaldo",                     apellido: "Figueroa",  email: "osvaldo.figueroa@mail.com", telefono: "+54 9 351 888-0001", tipoDocumento: "DNI", numeroDocumento: "19222030", abogadoId: "u-hernan",  createdAt: diasAtrasDate(700) },
    { id: 'c-32', tipoPersona: 'JURIDICA', nombre: "Distribuidora Litoral S.R.L.",apellido: null,        email: "legal@distlitoral.com",     telefono: "+54 342 999-0001",   tipoDocumento: "CUIT", numeroDocumento: "30-71001111-1", abogadoId: "u-laura",   createdAt: diasAtrasDate(600) },
    { id: 'c-33', tipoPersona: 'FISICA',   nombre: "Graciela",                    apellido: "Molina",    email: "graciela.molina@mail.com",  telefono: "+54 9 351 888-0002", tipoDocumento: "DNI", numeroDocumento: "24333031", abogadoId: "u-agustin", createdAt: diasAtrasDate(550) },
    { id: 'c-34', tipoPersona: 'FISICA',   nombre: "Hugo",                        apellido: "Cabrera",   email: "hugo.cabrera@mail.com",     telefono: "+54 9 261 888-0001", tipoDocumento: "DNI", numeroDocumento: "21444032", abogadoId: "u-mario",   createdAt: diasAtrasDate(500) },
    { id: 'c-35', tipoPersona: 'JURIDICA', nombre: "Estudio Contable Ríos",       apellido: null,        email: "info@ecrios.com",           telefono: "+54 351 888-0003",   tipoDocumento: "CUIT", numeroDocumento: "30-71002222-2", abogadoId: "u-hernan",  createdAt: diasAtrasDate(450) },
    { id: 'c-36', tipoPersona: 'FISICA',   nombre: "Norma",                       apellido: "Peralta",   email: "norma.peralta@mail.com",    telefono: "+54 9 351 888-0004", tipoDocumento: "DNI", numeroDocumento: "26555033", abogadoId: "u-laura",   createdAt: diasAtrasDate(400) },
    { id: 'c-37', tipoPersona: 'FISICA',   nombre: "Alberto",                     apellido: "Sosa",      email: "alberto.sosa@mail.com",     telefono: "+54 9 351 888-0005", tipoDocumento: "DNI", numeroDocumento: "18666034", abogadoId: "u-agustin", createdAt: diasAtrasDate(380) },
    { id: 'c-38', tipoPersona: 'JURIDICA', nombre: "Panadería La Estrella S.R.L.",apellido: null,        email: "info@panalestrella.com",    telefono: "+54 351 888-0006",   tipoDocumento: "CUIT", numeroDocumento: "30-71003333-3", abogadoId: "u-mario",   createdAt: diasAtrasDate(350) },

    // === SIN CASOS (recién cargados al sistema) ===
    { id: 'c-39', tipoPersona: 'FISICA',   nombre: "Romina",                      apellido: "Ledesma",   email: "romina.ledesma@mail.com",   telefono: "+54 9 351 999-0001", tipoDocumento: "DNI", numeroDocumento: "31777035", abogadoId: "u-laura",   createdAt: diasAtrasDate(7) },
    { id: 'c-40', tipoPersona: 'JURIDICA', nombre: "Software del Interior S.A.",  apellido: null,        email: "legal@softint.com",         telefono: "+54 351 999-0002",   tipoDocumento: "CUIT", numeroDocumento: "30-71004444-4", abogadoId: "u-hernan",  createdAt: diasAtrasDate(3) },
  ];

  for (const c of clientes) {
    const { createdAt, ...rest } = c;
    await prisma.cliente.create({
      data: {
        ...rest,
        activo: true,
        condicionIva: c.tipoPersona === 'JURIDICA' ? 'RESPONSABLE_INSCRIPTO' : 'CONSUMIDOR_FINAL',
        createdAt,
      }
    });
  }
  console.log("👤 38 Clientes creados.");

  // ============================================================
  // 4. CONSTANTES
  // ============================================================
  const MOTIVOS = {
    FAVORABLE: 'Sentencia favorable',
    DESFAVORABLE: 'Sentencia desfavorable',
    ACUERDO: 'Acuerdo/Conciliación',
    DESISTIMIENTO: 'Desistimiento',
    ARCHIVO: 'Archivo',
  };

  const diasAtras = (dias) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

  // ============================================================
  // 5. DEFINICIÓN DE CASOS (~85 total)
  // ============================================================

  const casosDef = [];

  // ================================================================
  // HERNÁN: 9 cerrados + 6 activos + 5 estancados = 20
  // Clientes: c-01(5), c-02(2), c-03(2), c-04(3), c-05(2), c-21(2), c-22(2), c-23(1), c-24→c-31(1), c-35(1)
  // ================================================================

  // --- Cerrados ---
  casosDef.push({ numero: 'EXP-2024-001', titulo: 'TechCorp c/ Proveedor s/ Incumplimiento', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-01', priority: 'HIGH', montoDisputa: 8500000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 7200000, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia', 'Ejecución de Sentencia'], diasPorEtapa: [35, 70, 30, 45], inicioHace: 365, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 5' });
  casosDef.push({ numero: 'EXP-2024-015', titulo: 'Mendoza c/ Empleador s/ Despido', tipo: 'LABORAL', abogadoId: 'u-hernan', clienteId: 'c-02', priority: 'NORMAL', montoDisputa: 4500000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 3200000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [30], inicioHace: 210, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Laboral Nº 3' });
  casosDef.push({ numero: 'EXP-2024-022', titulo: 'López c/ Consorcio s/ Daños', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-03', priority: 'NORMAL', montoDisputa: 3200000, cerrado: true, motivoCierre: MOTIVOS.DESFAVORABLE, montoFinal: 0, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia'], diasPorEtapa: [40, 80, 35], inicioHace: 450, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 12' });
  casosDef.push({ numero: 'EXP-2024-023', titulo: 'Díaz c/ Empresa Textil s/ Indemnización', tipo: 'LABORAL', abogadoId: 'u-hernan', clienteId: 'c-05', priority: 'HIGH', montoDisputa: 6000000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 5800000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia'], diasPorEtapa: [25, 35, 60, 30], inicioHace: 300, fuero: 'Rosario', juzgado: 'Juzgado Laboral Nº 1' });
  casosDef.push({ numero: 'EXP-2024-024', titulo: 'Constructora c/ Municipalidad s/ Cobro', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-hernan', clienteId: 'c-04', priority: 'HIGH', montoDisputa: 15000000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 10000000, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones'], diasPorEtapa: [50, 80], inicioHace: 500, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Cont. Adm. Nº 2' });
  casosDef.push({ numero: 'EXP-2024-025', titulo: 'Pereyra c/ Empresa s/ Accidente Laboral', tipo: 'LABORAL', abogadoId: 'u-hernan', clienteId: 'c-21', priority: 'NORMAL', montoDisputa: 5200000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 4800000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia'], diasPorEtapa: [20, 45, 55], inicioHace: 280, fuero: 'Capital Federal', juzgado: 'Juzgado Nacional del Trabajo Nº 8' });
  casosDef.push({ numero: 'EXP-2024-026', titulo: 'Metalúrgica c/ Sindicato s/ Cautelar', tipo: 'LABORAL', abogadoId: 'u-hernan', clienteId: 'c-22', priority: 'HIGH', montoDisputa: 3800000, cerrado: true, motivoCierre: MOTIVOS.DESISTIMIENTO, montoFinal: 0, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [35], inicioHace: 180, fuero: 'Córdoba, Río Cuarto', juzgado: 'Juzgado Civil y Com. Nº 1' });
  casosDef.push({ numero: 'EXP-2024-027', titulo: 'López c/ Banco s/ Cobro de Pesos', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-03', priority: 'NORMAL', montoDisputa: 2100000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 1950000, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia'], diasPorEtapa: [30, 55, 25], inicioHace: 260, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 8' });
  casosDef.push({ numero: 'EXP-2024-028', titulo: 'Díaz s/ Alimentos', tipo: 'FAMILIA', abogadoId: 'u-hernan', clienteId: 'c-05', priority: 'HIGH', montoDisputa: 900000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 850000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [18], inicioHace: 130, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 4' });

  // --- Inactivos: casos cerrados de clientes que NO tienen activos ---
  casosDef.push({ numero: 'EXP-2023-001', titulo: 'Figueroa c/ Empleador s/ Despido', tipo: 'LABORAL', abogadoId: 'u-hernan', clienteId: 'c-31', priority: 'NORMAL', montoDisputa: 3500000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 3200000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Sentencia de 1ra Instancia'], diasPorEtapa: [30, 60], inicioHace: 600, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Laboral Nº 1' });
  casosDef.push({ numero: 'EXP-2023-002', titulo: 'Estudio Ríos c/ Cliente s/ Honorarios', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-35', priority: 'LOW', montoDisputa: 800000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 600000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [25], inicioHace: 400, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 1' });

  // --- Activos recientes ---
  casosDef.push({ numero: 'EXP-2025-101', titulo: 'TechCorp c/ Cliente Moroso s/ Ejecutivo', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-01', priority: 'HIGH', montoDisputa: 2800000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [20, 25], inicioHace: 60, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 5' });
  casosDef.push({ numero: 'EXP-2025-102', titulo: 'TechCorp c/ ART s/ Accidente Empleado', tipo: 'LABORAL', abogadoId: 'u-hernan', clienteId: 'c-01', priority: 'NORMAL', montoDisputa: 7500000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [18], inicioHace: 30, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Laboral Nº 3' });
  casosDef.push({ numero: 'EXP-2025-103', titulo: 'López c/ Seguro s/ Siniestro', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-03', priority: 'NORMAL', montoDisputa: 1500000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones'], diasPorEtapa: [20, 30], inicioHace: 70, fuero: 'Rosario', juzgado: 'Juzgado Civil Nº 3' });
  casosDef.push({ numero: 'EXP-2025-104', titulo: 'Díaz c/ Vecino s/ Medianería', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-05', priority: 'LOW', montoDisputa: 900000, cerrado: false, etapasTransitadas: ['Inicio / Demanda'], diasPorEtapa: [], inicioHace: 15, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 12' });
  casosDef.push({ numero: 'EXP-2025-105', titulo: 'Pereyra c/ Consorcio s/ Filtraciones', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-21', priority: 'NORMAL', montoDisputa: 1200000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [12], inicioHace: 22, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 1' });
  casosDef.push({ numero: 'EXP-2025-106', titulo: 'Acosta c/ Empleador s/ Diferencias Salariales', tipo: 'LABORAL', abogadoId: 'u-hernan', clienteId: 'c-23', priority: 'HIGH', montoDisputa: 3400000, cerrado: false, etapasTransitadas: ['Inicio / Demanda'], diasPorEtapa: [], inicioHace: 8, fuero: 'Capital Federal', juzgado: 'Juzgado Nacional del Trabajo Nº 15' });

  // --- Estancados ---
  casosDef.push({ numero: 'EXP-2024-050', titulo: 'Constructora s/ Quiebra', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-04', priority: 'NORMAL', montoDisputa: 12000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones'], diasPorEtapa: [40, 60], inicioHace: 200, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 5' });
  casosDef.push({ numero: 'EXP-2024-051', titulo: 'TechCorp c/ AFIP s/ Impugnación', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-hernan', clienteId: 'c-01', priority: 'HIGH', montoDisputa: 4200000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia'], diasPorEtapa: [30, 50, 35], inicioHace: 250, fuero: 'Capital Federal', juzgado: 'Juzgado Cont. Adm. Federal Nº 4' });
  casosDef.push({ numero: 'EXP-2024-052', titulo: 'Mendoza s/ Sucesión', tipo: 'SUCESIONES', abogadoId: 'u-hernan', clienteId: 'c-02', priority: 'LOW', montoDisputa: 20000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [45], inicioHace: 400, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 1' });
  casosDef.push({ numero: 'EXP-2023-010', titulo: 'Metalúrgica c/ Proveedor s/ Cobro de Pesos', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-22', priority: 'LOW', montoDisputa: 6500000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [60], inicioHace: 550, fuero: 'Córdoba, Río Cuarto', juzgado: 'Juzgado Civil y Com. Nº 1' });
  casosDef.push({ numero: 'EXP-2024-053', titulo: 'TechCorp c/ Socio s/ Disolución', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-hernan', clienteId: 'c-01', priority: 'NORMAL', montoDisputa: 18000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [25, 35], inicioHace: 220, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 8' });

  // ================================================================
  // AGUSTÍN: 7 cerrados + 5 activos + 4 estancados = 16
  // ================================================================

  // --- Cerrados ---
  casosDef.push({ numero: 'EXP-2024-100', titulo: 'García s/ Divorcio', tipo: 'FAMILIA', abogadoId: 'u-agustin', clienteId: 'c-06', priority: 'NORMAL', montoDisputa: 2000000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 1800000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Sentencia de 1ra Instancia'], diasPorEtapa: [30, 50], inicioHace: 180, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 2' });
  casosDef.push({ numero: 'EXP-2024-101', titulo: 'Martínez c/ Inquilino s/ Desalojo', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-agustin', clienteId: 'c-07', priority: 'HIGH', montoDisputa: 1800000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 1800000, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia', 'Ejecución de Sentencia'], diasPorEtapa: [25, 55, 45], inicioHace: 240, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 8' });
  casosDef.push({ numero: 'EXP-2024-102', titulo: 'Importadora c/ Aduana s/ Multa', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-agustin', clienteId: 'c-08', priority: 'NORMAL', montoDisputa: 5500000, cerrado: true, motivoCierre: MOTIVOS.DESFAVORABLE, montoFinal: 0, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia'], diasPorEtapa: [40, 70, 35], inicioHace: 400, fuero: 'Capital Federal', juzgado: 'Juzgado Cont. Adm. Federal Nº 1' });
  casosDef.push({ numero: 'EXP-2024-103', titulo: 'Fernández s/ Alimentos', tipo: 'FAMILIA', abogadoId: 'u-agustin', clienteId: 'c-09', priority: 'HIGH', montoDisputa: 800000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 750000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [20], inicioHace: 120, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 4' });
  casosDef.push({ numero: 'EXP-2024-104', titulo: 'Sánchez c/ Empresa s/ Despido', tipo: 'LABORAL', abogadoId: 'u-agustin', clienteId: 'c-10', priority: 'NORMAL', montoDisputa: 3800000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 2900000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [30, 45], inicioHace: 280, fuero: 'Santa Fe', juzgado: 'Juzgado Laboral Nº 2' });
  casosDef.push({ numero: 'EXP-2024-105', titulo: 'Navarro c/ Ex Pareja s/ Compensación', tipo: 'FAMILIA', abogadoId: 'u-agustin', clienteId: 'c-26', priority: 'NORMAL', montoDisputa: 4500000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 4200000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia'], diasPorEtapa: [25, 40, 50], inicioHace: 250, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 2' });
  casosDef.push({ numero: 'EXP-2024-106', titulo: 'García c/ Vecino s/ Ruidos Molestos', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-agustin', clienteId: 'c-06', priority: 'LOW', montoDisputa: 500000, cerrado: true, motivoCierre: MOTIVOS.ARCHIVO, montoFinal: 0, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [40], inicioHace: 190, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 1' });

  // --- Inactivos ---
  casosDef.push({ numero: 'EXP-2023-003', titulo: 'Molina s/ Divorcio', tipo: 'FAMILIA', abogadoId: 'u-agustin', clienteId: 'c-33', priority: 'NORMAL', montoDisputa: 1500000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 1200000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Sentencia de 1ra Instancia'], diasPorEtapa: [25, 45], inicioHace: 500, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 2' });
  casosDef.push({ numero: 'EXP-2023-004', titulo: 'Sosa c/ Vecino s/ Daños', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-agustin', clienteId: 'c-37', priority: 'LOW', montoDisputa: 700000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 650000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia'], diasPorEtapa: [20, 35, 40], inicioHace: 350, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 5' });

  // --- Activos recientes ---
  casosDef.push({ numero: 'EXP-2025-200', titulo: 'García s/ Régimen de Visitas', tipo: 'FAMILIA', abogadoId: 'u-agustin', clienteId: 'c-06', priority: 'NORMAL', montoDisputa: 0, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [15], inicioHace: 20, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 2' });
  casosDef.push({ numero: 'EXP-2025-201', titulo: 'Importadora c/ Proveedor s/ Cumplimiento', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-agustin', clienteId: 'c-08', priority: 'NORMAL', montoDisputa: 6200000, cerrado: false, etapasTransitadas: ['Inicio / Demanda'], diasPorEtapa: [], inicioHace: 10, fuero: 'Rosario', juzgado: 'Juzgado Civil Nº 5' });
  casosDef.push({ numero: 'EXP-2025-202', titulo: 'Importadora c/ Obra Social s/ Amparo', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-agustin', clienteId: 'c-08', priority: 'HIGH', montoDisputa: 1200000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [15, 22], inicioHace: 45, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 12' });
  casosDef.push({ numero: 'EXP-2025-203', titulo: 'Navarro c/ Empleador s/ Despido', tipo: 'LABORAL', abogadoId: 'u-agustin', clienteId: 'c-26', priority: 'HIGH', montoDisputa: 4800000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [10], inicioHace: 18, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Laboral Nº 1' });
  casosDef.push({ numero: 'EXP-2025-204', titulo: 'Importadora c/ Banco s/ Daños', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-agustin', clienteId: 'c-08', priority: 'NORMAL', montoDisputa: 2100000, cerrado: false, etapasTransitadas: ['Inicio / Demanda'], diasPorEtapa: [], inicioHace: 5, fuero: 'Buenos Aires, La Plata', juzgado: 'Juzgado Civil y Com. Nº 3' });

  // --- Estancados ---
  casosDef.push({ numero: 'EXP-2024-110', titulo: 'Martínez s/ Sucesión', tipo: 'SUCESIONES', abogadoId: 'u-agustin', clienteId: 'c-07', priority: 'LOW', montoDisputa: 18000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [45], inicioHace: 250, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 8' });
  casosDef.push({ numero: 'EXP-2024-111', titulo: 'Fernández c/ Ex Cónyuge s/ Liquidación', tipo: 'FAMILIA', abogadoId: 'u-agustin', clienteId: 'c-09', priority: 'NORMAL', montoDisputa: 3500000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia'], diasPorEtapa: [25, 40, 50], inicioHace: 210, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 4' });
  casosDef.push({ numero: 'EXP-2024-112', titulo: 'Sánchez c/ Municipalidad s/ Daños Vía Pública', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-agustin', clienteId: 'c-10', priority: 'NORMAL', montoDisputa: 2800000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [40], inicioHace: 300, fuero: 'Santa Fe', juzgado: 'Juzgado Cont. Adm. Nº 1' });
  casosDef.push({ numero: 'EXP-2023-050', titulo: 'Importadora c/ Despachante s/ Cobro', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-agustin', clienteId: 'c-08', priority: 'LOW', montoDisputa: 4100000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones'], diasPorEtapa: [50, 65], inicioHace: 500, fuero: 'Rosario', juzgado: 'Juzgado Civil Nº 1' });

  // ================================================================
  // MARIO: 8 cerrados + 6 activos + 5 estancados = 19
  // ================================================================

  // --- Cerrados ---
  casosDef.push({ numero: 'EXP-2024-200', titulo: 'Gómez s/ Lesiones Culposas', tipo: 'PENAL', abogadoId: 'u-mario', clienteId: 'c-11', priority: 'HIGH', montoDisputa: 3000000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 2500000, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia'], diasPorEtapa: [30, 65, 35], inicioHace: 350, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Penal Nº 6' });
  casosDef.push({ numero: 'EXP-2024-201', titulo: 'Transporte c/ Aseguradora s/ Siniestro', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-mario', clienteId: 'c-12', priority: 'NORMAL', montoDisputa: 9000000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 6500000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [25, 40], inicioHace: 270, fuero: 'Rosario', juzgado: 'Juzgado Civil Nº 3' });
  casosDef.push({ numero: 'EXP-2024-202', titulo: 'Romero c/ Empresa s/ Mobbing', tipo: 'LABORAL', abogadoId: 'u-mario', clienteId: 'c-13', priority: 'NORMAL', montoDisputa: 5000000, cerrado: true, motivoCierre: MOTIVOS.DESISTIMIENTO, montoFinal: 0, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [30], inicioHace: 200, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Laboral Nº 3' });
  casosDef.push({ numero: 'EXP-2024-203', titulo: 'Torres c/ ART s/ Incapacidad', tipo: 'LABORAL', abogadoId: 'u-mario', clienteId: 'c-14', priority: 'HIGH', montoDisputa: 8200000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 7800000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia', 'Ejecución de Sentencia'], diasPorEtapa: [20, 30, 70, 25, 45], inicioHace: 320, fuero: 'Buenos Aires, La Plata', juzgado: 'Juzgado Laboral Nº 5' });
  casosDef.push({ numero: 'EXP-2024-204', titulo: 'Cereales c/ Transportista s/ Faltante', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-mario', clienteId: 'c-28', priority: 'NORMAL', montoDisputa: 3600000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 2800000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [20, 35], inicioHace: 150, fuero: 'Córdoba, Río Cuarto', juzgado: 'Juzgado Civil y Com. Nº 2' });
  casosDef.push({ numero: 'EXP-2024-205', titulo: 'Paz c/ Empleador s/ Despido Embarazo', tipo: 'LABORAL', abogadoId: 'u-mario', clienteId: 'c-29', priority: 'HIGH', montoDisputa: 7000000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 6800000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia'], diasPorEtapa: [15, 35, 50], inicioHace: 220, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Laboral Nº 1' });
  casosDef.push({ numero: 'EXP-2024-206', titulo: 'Ríos c/ Consorcio s/ Daños Unidad', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-mario', clienteId: 'c-30', priority: 'NORMAL', montoDisputa: 1800000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 1650000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia'], diasPorEtapa: [25, 40, 45], inicioHace: 250, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 12' });
  casosDef.push({ numero: 'EXP-2024-207', titulo: 'Gómez c/ Empleador s/ Despido Injustificado', tipo: 'LABORAL', abogadoId: 'u-mario', clienteId: 'c-11', priority: 'NORMAL', montoDisputa: 4500000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 3200000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [25, 45], inicioHace: 220, fuero: 'Tucumán', juzgado: 'Juzgado Laboral Nº 1' });

  // --- Inactivos ---
  casosDef.push({ numero: 'EXP-2023-005', titulo: 'Cabrera c/ Empleador s/ Indemnización', tipo: 'LABORAL', abogadoId: 'u-mario', clienteId: 'c-34', priority: 'NORMAL', montoDisputa: 4200000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 3800000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia'], diasPorEtapa: [30, 40, 50], inicioHace: 450, fuero: 'Mendoza', juzgado: 'Juzgado Laboral Nº 1' });
  casosDef.push({ numero: 'EXP-2023-006', titulo: 'Panadería c/ Proveedor s/ Cobro', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-mario', clienteId: 'c-38', priority: 'LOW', montoDisputa: 600000, cerrado: true, motivoCierre: MOTIVOS.ARCHIVO, montoFinal: 0, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [35], inicioHace: 320, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 1' });

  // --- Activos recientes ---
  casosDef.push({ numero: 'EXP-2025-300', titulo: 'Romero c/ Vecino s/ Daños', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-mario', clienteId: 'c-13', priority: 'NORMAL', montoDisputa: 2200000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [25], inicioHace: 40, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 1' });
  casosDef.push({ numero: 'EXP-2025-301', titulo: 'Transporte c/ Empleado s/ Despido', tipo: 'LABORAL', abogadoId: 'u-mario', clienteId: 'c-12', priority: 'HIGH', montoDisputa: 5500000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [18], inicioHace: 25, fuero: 'Buenos Aires, La Plata', juzgado: 'Juzgado Laboral Nº 5' });
  casosDef.push({ numero: 'EXP-2025-302', titulo: 'Gómez s/ Hurto', tipo: 'PENAL', abogadoId: 'u-mario', clienteId: 'c-11', priority: 'HIGH', montoDisputa: 0, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones'], diasPorEtapa: [18, 22], inicioHace: 50, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Penal Nº 6' });
  casosDef.push({ numero: 'EXP-2025-303', titulo: 'Transporte c/ Cliente s/ Cobro Fletes', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-mario', clienteId: 'c-12', priority: 'LOW', montoDisputa: 1800000, cerrado: false, etapasTransitadas: ['Inicio / Demanda'], diasPorEtapa: [], inicioHace: 8, fuero: 'Rosario', juzgado: 'Juzgado Civil Nº 5' });
  casosDef.push({ numero: 'EXP-2025-304', titulo: 'Ríos c/ ART s/ Enfermedad Profesional', tipo: 'LABORAL', abogadoId: 'u-mario', clienteId: 'c-30', priority: 'HIGH', montoDisputa: 6200000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [12], inicioHace: 20, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Laboral Nº 3' });
  casosDef.push({ numero: 'EXP-2025-305', titulo: 'Cereales c/ AFIP s/ Determinación', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-mario', clienteId: 'c-28', priority: 'NORMAL', montoDisputa: 8500000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [30], inicioHace: 55, fuero: 'Córdoba, Río Cuarto', juzgado: 'Juzgado Civil y Com. Nº 2' });

  // --- Estancados ---
  casosDef.push({ numero: 'EXP-2024-210', titulo: 'Romero s/ Usucapión', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-mario', clienteId: 'c-13', priority: 'LOW', montoDisputa: 25000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [50], inicioHace: 400, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 5' });
  casosDef.push({ numero: 'EXP-2024-211', titulo: 'Transporte c/ Estado s/ Daños', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-mario', clienteId: 'c-12', priority: 'NORMAL', montoDisputa: 4000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia'], diasPorEtapa: [35, 55, 40], inicioHace: 250, fuero: 'Mendoza', juzgado: 'Juzgado Cont. Adm. Nº 1' });
  casosDef.push({ numero: 'EXP-2024-212', titulo: 'Transporte s/ Sucesión Fundador', tipo: 'SUCESIONES', abogadoId: 'u-mario', clienteId: 'c-12', priority: 'LOW', montoDisputa: 15000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [55], inicioHace: 380, fuero: 'Buenos Aires, La Plata', juzgado: 'Juzgado Civil y Com. Nº 8' });
  casosDef.push({ numero: 'EXP-2023-080', titulo: 'Transporte c/ Municipalidad s/ Habilitación', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-mario', clienteId: 'c-12', priority: 'NORMAL', montoDisputa: 2200000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones'], diasPorEtapa: [45, 60], inicioHace: 520, fuero: 'Rosario', juzgado: 'Juzgado Cont. Adm. Nº 2' });
  casosDef.push({ numero: 'EXP-2024-213', titulo: 'Paz c/ Obra Social s/ Prestaciones', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-mario', clienteId: 'c-29', priority: 'NORMAL', montoDisputa: 1600000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [20, 30], inicioHace: 160, fuero: 'Tucumán', juzgado: 'Juzgado Civil Nº 2' });

  // ================================================================
  // LAURA: 10 cerrados + 7 activos + 5 estancados = 22
  // ================================================================

  // --- Cerrados ---
  casosDef.push({ numero: 'EXP-2024-300', titulo: 'Vega s/ Divorcio Express', tipo: 'FAMILIA', abogadoId: 'u-laura', clienteId: 'c-15', priority: 'NORMAL', montoDisputa: 1500000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 1500000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [20], inicioHace: 90, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 4' });
  casosDef.push({ numero: 'EXP-2024-301', titulo: 'Inmobiliaria c/ Inquilino s/ Desalojo', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-laura', clienteId: 'c-16', priority: 'HIGH', montoDisputa: 2400000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 2400000, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia', 'Ejecución de Sentencia'], diasPorEtapa: [30, 45, 35], inicioHace: 150, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 1' });
  casosDef.push({ numero: 'EXP-2024-302', titulo: 'Castro c/ Obra Social s/ Reintegro', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-laura', clienteId: 'c-17', priority: 'NORMAL', montoDisputa: 950000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 920000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [25, 35], inicioHace: 120, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 12' });
  casosDef.push({ numero: 'EXP-2024-303', titulo: 'Morales c/ Consorcio s/ Expensas', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-laura', clienteId: 'c-18', priority: 'LOW', montoDisputa: 350000, cerrado: true, motivoCierre: MOTIVOS.ARCHIVO, montoFinal: 0, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [30], inicioHace: 160, fuero: 'Córdoba, Río Cuarto', juzgado: 'Juzgado Civil y Com. Nº 1' });
  casosDef.push({ numero: 'EXP-2024-304', titulo: 'Ruiz c/ Empleador s/ Diferencias', tipo: 'LABORAL', abogadoId: 'u-laura', clienteId: 'c-19', priority: 'NORMAL', montoDisputa: 4200000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 3500000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones'], diasPorEtapa: [25, 40, 55], inicioHace: 280, fuero: 'Mendoza', juzgado: 'Juzgado Laboral Nº 1' });
  casosDef.push({ numero: 'EXP-2024-305', titulo: 'Agro Pampa c/ Acopiador s/ Cobro', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-laura', clienteId: 'c-20', priority: 'HIGH', montoDisputa: 11000000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 9500000, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia', 'Ejecución de Sentencia'], diasPorEtapa: [30, 50, 25, 40], inicioHace: 200, fuero: 'Santa Fe', juzgado: 'Juzgado Civil Nº 4' });
  casosDef.push({ numero: 'EXP-2024-306', titulo: 'Vega c/ Ex Cónyuge s/ Compensación', tipo: 'FAMILIA', abogadoId: 'u-laura', clienteId: 'c-15', priority: 'NORMAL', montoDisputa: 5000000, cerrado: true, motivoCierre: MOTIVOS.DESFAVORABLE, montoFinal: 0, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia'], diasPorEtapa: [30, 45, 65, 30], inicioHace: 330, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 2' });
  casosDef.push({ numero: 'EXP-2024-307', titulo: 'Farmacia c/ Proveedor s/ Incumplimiento', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-laura', clienteId: 'c-25', priority: 'NORMAL', montoDisputa: 2100000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 2000000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia'], diasPorEtapa: [20, 40, 45], inicioHace: 200, fuero: 'Córdoba, Río Cuarto', juzgado: 'Juzgado Civil y Com. Nº 2' });
  casosDef.push({ numero: 'EXP-2024-309', titulo: 'Ruiz c/ Empresa Seguridad s/ Despido', tipo: 'LABORAL', abogadoId: 'u-laura', clienteId: 'c-19', priority: 'HIGH', montoDisputa: 6800000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 6500000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia'], diasPorEtapa: [20, 30, 60, 25], inicioHace: 240, fuero: 'Capital Federal', juzgado: 'Juzgado Nacional del Trabajo Nº 8' });
  casosDef.push({ numero: 'EXP-2024-310A', titulo: 'Agro Pampa c/ Arrendatario s/ Rescisión', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-laura', clienteId: 'c-20', priority: 'NORMAL', montoDisputa: 3200000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 2800000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [30, 40], inicioHace: 180, fuero: 'Córdoba, Río Cuarto', juzgado: 'Juzgado Civil y Com. Nº 1' });

  // --- Inactivos ---
  casosDef.push({ numero: 'EXP-2023-007', titulo: 'Distribuidora c/ Cliente s/ Cobro Facturas', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-laura', clienteId: 'c-32', priority: 'NORMAL', montoDisputa: 2800000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 2500000, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Sentencia de 1ra Instancia'], diasPorEtapa: [35, 50], inicioHace: 550, fuero: 'Santa Fe', juzgado: 'Juzgado Civil Nº 2' });
  casosDef.push({ numero: 'EXP-2023-008', titulo: 'Distribuidora c/ Empleado s/ Despido', tipo: 'LABORAL', abogadoId: 'u-laura', clienteId: 'c-32', priority: 'NORMAL', montoDisputa: 3500000, cerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoFinal: 2800000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [25, 40], inicioHace: 480, fuero: 'Santa Fe', juzgado: 'Juzgado Laboral Nº 2' });
  casosDef.push({ numero: 'EXP-2023-009', titulo: 'Peralta s/ Alimentos', tipo: 'FAMILIA', abogadoId: 'u-laura', clienteId: 'c-36', priority: 'NORMAL', montoDisputa: 1200000, cerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoFinal: 1100000, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Sentencia de 1ra Instancia'], diasPorEtapa: [20, 40], inicioHace: 380, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 4' });

  // --- Activos recientes ---
  casosDef.push({ numero: 'EXP-2025-400', titulo: 'Vega s/ Tenencia', tipo: 'FAMILIA', abogadoId: 'u-laura', clienteId: 'c-15', priority: 'HIGH', montoDisputa: 0, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [12, 15], inicioHace: 35, fuero: 'Córdoba, Capital', juzgado: 'Juzgado de Familia Nº 2' });
  casosDef.push({ numero: 'EXP-2025-401', titulo: 'Agro Pampa c/ Constructor s/ Vicios Galpón', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-laura', clienteId: 'c-20', priority: 'NORMAL', montoDisputa: 8000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones'], diasPorEtapa: [30, 35], inicioHace: 80, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 1' });
  casosDef.push({ numero: 'EXP-2025-402', titulo: 'Castro c/ Municipalidad s/ Amparo', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-laura', clienteId: 'c-17', priority: 'HIGH', montoDisputa: 3000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda'], diasPorEtapa: [], inicioHace: 12, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Cont. Adm. Nº 2' });
  casosDef.push({ numero: 'EXP-2025-403', titulo: 'TechCorp s/ Mediación Laboral Interna', tipo: 'FAMILIA', abogadoId: 'u-laura', clienteId: 'c-01', priority: 'NORMAL', montoDisputa: 600000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [12], inicioHace: 18, fuero: 'Córdoba, Río Cuarto', juzgado: 'Juzgado de Familia Nº 1' });
  casosDef.push({ numero: 'EXP-2025-404', titulo: 'Ruiz c/ ART s/ Accidente', tipo: 'LABORAL', abogadoId: 'u-laura', clienteId: 'c-19', priority: 'HIGH', montoDisputa: 9500000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [20, 25], inicioHace: 55, fuero: 'Buenos Aires, La Plata', juzgado: 'Juzgado Laboral Nº 3' });
  casosDef.push({ numero: 'EXP-2025-405', titulo: 'Farmacia c/ ANMAT s/ Habilitación', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-laura', clienteId: 'c-25', priority: 'HIGH', montoDisputa: 1500000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo'], diasPorEtapa: [10], inicioHace: 16, fuero: 'Capital Federal', juzgado: 'Juzgado Cont. Adm. Federal Nº 1' });
  casosDef.push({ numero: 'EXP-2025-406', titulo: 'Agro Pampa c/ Arrendatario s/ Desalojo Rural', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-laura', clienteId: 'c-20', priority: 'NORMAL', montoDisputa: 4500000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [22], inicioHace: 38, fuero: 'Santa Fe', juzgado: 'Juzgado Civil Nº 4' });

  // --- Estancados ---
  casosDef.push({ numero: 'EXP-2024-310', titulo: 'Agro Pampa c/ Banco s/ Ejecutivo', tipo: 'CIVIL_COMERCIAL', abogadoId: 'u-laura', clienteId: 'c-20', priority: 'LOW', montoDisputa: 7500000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia'], diasPorEtapa: [40, 55, 35], inicioHace: 280, fuero: 'Mendoza', juzgado: 'Juzgado Civil Nº 2' });
  casosDef.push({ numero: 'EXP-2024-311', titulo: 'Agro Pampa s/ Sucesión Socio', tipo: 'SUCESIONES', abogadoId: 'u-laura', clienteId: 'c-20', priority: 'LOW', montoDisputa: 30000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [50], inicioHace: 350, fuero: 'Córdoba, Capital', juzgado: 'Juzgado Civil Nº 8' });
  casosDef.push({ numero: 'EXP-2024-312', titulo: 'Agro Pampa c/ AFIP s/ Repetición', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-laura', clienteId: 'c-20', priority: 'NORMAL', montoDisputa: 5800000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia', 'Apelación / 2da Instancia'], diasPorEtapa: [35, 50, 30, 45], inicioHace: 300, fuero: 'Capital Federal', juzgado: 'Juzgado Cont. Adm. Federal Nº 4' });
  casosDef.push({ numero: 'EXP-2023-090', titulo: 'Vega c/ Estado s/ Expropiación', tipo: 'CONTENCIOSO_ADMINISTRATIVO', abogadoId: 'u-laura', clienteId: 'c-15', priority: 'HIGH', montoDisputa: 45000000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Prueba (Oficios/Pericias)', 'Alegatos / Conclusiones'], diasPorEtapa: [60, 80], inicioHace: 600, fuero: 'Tucumán', juzgado: 'Juzgado Cont. Adm. Nº 1' });
  casosDef.push({ numero: 'EXP-2024-313', titulo: 'Importadora c/ Empleado s/ Reinstalación', tipo: 'LABORAL', abogadoId: 'u-laura', clienteId: 'c-08', priority: 'HIGH', montoDisputa: 5200000, cerrado: false, etapasTransitadas: ['Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)'], diasPorEtapa: [25, 40], inicioHace: 190, fuero: 'Mendoza', juzgado: 'Juzgado Laboral Nº 1' });

  // ============================================================
  // 6. CREAR CASOS + BITÁCORAS
  // ============================================================
  let totalBitacoras = 0;

  for (const def of casosDef) {
    const fechaInicio = diasAtras(def.inicioHace);
    const etapaActual = def.etapasTransitadas[def.etapasTransitadas.length - 1];

    let fechaUltimoCambio = new Date(fechaInicio.getTime());
    for (const dias of def.diasPorEtapa) {
      fechaUltimoCambio = new Date(fechaUltimoCambio.getTime() + dias * 24 * 60 * 60 * 1000);
    }

    let updatedAt = new Date(fechaUltimoCambio.getTime());
    if (!def.cerrado) {
      const diasDesdeUltimoCambio = Math.floor((Date.now() - fechaUltimoCambio.getTime()) / (1000 * 60 * 60 * 24));
      if (diasDesdeUltimoCambio < 90) {
        const diasRecientes = Math.floor(Math.random() * Math.min(diasDesdeUltimoCambio, 20));
        updatedAt = diasAtras(diasRecientes);
      }
    }

    let fechaCierre = null;
    if (def.cerrado) {
      const diasExtra = 15 + Math.floor(Math.random() * 30);
      fechaCierre = new Date(fechaUltimoCambio.getTime() + diasExtra * 24 * 60 * 60 * 1000);
      if (fechaCierre > new Date()) fechaCierre = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      updatedAt = fechaCierre;
    }

    const caso = await prisma.caso.create({
      data: {
        numero: def.numero,
        titulo: def.titulo,
        descripcion: `Descripción del caso ${def.numero}`,
        tipo: def.tipo,
        estado: etapaActual,
        porcentajeAvance: def.cerrado ? 100 : Math.min(Math.floor((def.etapasTransitadas.length / 7) * 100), 95),
        fuero: def.fuero,
        juzgado: def.juzgado,
        montoDisputa: def.montoDisputa,
        montoFinal: def.cerrado ? (def.montoFinal ?? null) : null,
        fechaInicio,
        fechaUltimoCambioEstado: fechaUltimoCambio,
        updatedAt,
        estaCerrado: def.cerrado || false,
        fechaCierre,
        motivoCierre: def.cerrado ? (def.motivoCierre || null) : null,
        observacionCierre: def.cerrado ? `Cierre: ${def.motivoCierre || 'N/A'}` : null,
        cerradoPorId: def.cerrado ? def.abogadoId : null,
        estadoAntesCierre: def.cerrado ? etapaActual : null,
        abogadoId: def.abogadoId,
        clienteId: def.clienteId,
        priority: def.priority || 'NORMAL',
      }
    });

    // Bitácora: CREATE
    await prisma.bitacora.create({
      data: {
        casoId: caso.id, usuarioId: def.abogadoId,
        accion: 'CREATE', estadoNuevo: def.etapasTransitadas[0], estadoAnterior: null,
        texto: `Caso creado en estado: ${def.etapasTransitadas[0]}`,
        detalle: `Tipo: ${def.tipo}, Prioridad: ${def.priority}`,
        tipo: 'sistema', createdAt: fechaInicio,
      }
    });
    totalBitacoras++;

    // Bitácora: ESTADO_CHANGE
    let fechaAcumulada = new Date(fechaInicio.getTime());
    for (let i = 0; i < def.etapasTransitadas.length - 1; i++) {
      const diasEnEtapa = def.diasPorEtapa[i] || 30;
      fechaAcumulada = new Date(fechaAcumulada.getTime() + diasEnEtapa * 24 * 60 * 60 * 1000);

      await prisma.bitacora.create({
        data: {
          casoId: caso.id, usuarioId: def.abogadoId,
          accion: 'ESTADO_CHANGE',
          estadoAnterior: def.etapasTransitadas[i],
          estadoNuevo: def.etapasTransitadas[i + 1],
          texto: `Cambio de estado: ${def.etapasTransitadas[i]} → ${def.etapasTransitadas[i + 1]}`,
          detalle: 'Avance procesal', tipo: 'sistema', createdAt: fechaAcumulada,
        }
      });
      totalBitacoras++;
    }

    // Bitácora: CIERRE
    if (def.cerrado && fechaCierre) {
      await prisma.bitacora.create({
        data: {
          casoId: caso.id, usuarioId: def.abogadoId,
          accion: 'CIERRE', estadoAnterior: etapaActual, estadoNuevo: 'Cerrado',
          texto: `Caso cerrado: ${def.motivoCierre}`,
          detalle: `Monto final: $${def.montoFinal || 0}`,
          tipo: 'sistema', createdAt: fechaCierre,
        }
      });
      totalBitacoras++;
    }
  }

  console.log(`📂 ${casosDef.length} Casos creados.`);
  console.log(`📝 ${totalBitacoras} Entradas de bitácora creadas.`);

  // ============================================================
  // 7. RESUMEN
  // ============================================================
  const cerrados = casosDef.filter(c => c.cerrado);
  const activos = casosDef.filter(c => !c.cerrado);
  const hoy = new Date();

  const getEstancamiento = (c) => {
    let fecha = new Date(Date.now() - c.inicioHace * 24 * 60 * 60 * 1000);
    for (const d of c.diasPorEtapa) fecha = new Date(fecha.getTime() + d * 24 * 60 * 60 * 1000);
    return Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24));
  };

  const estancados = activos.filter(c => getEstancamiento(c) >= 90);
  const favorables = cerrados.filter(c => c.motivoCierre === MOTIVOS.FAVORABLE).length;
  const acuerdos = cerrados.filter(c => c.motivoCierre === MOTIVOS.ACUERDO).length;
  const desfavorables = cerrados.filter(c => c.motivoCierre === MOTIVOS.DESFAVORABLE).length;
  const otrosCierre = cerrados.length - favorables - acuerdos - desfavorables;

  // Distribución geográfica
  const geoMap = {};
  casosDef.forEach(c => { geoMap[c.fuero] = (geoMap[c.fuero] || 0) + 1; });

  // Distribución de clientes para ES-12
  const clienteConCasos = {};
  casosDef.forEach(c => {
    if (!clienteConCasos[c.clienteId]) clienteConCasos[c.clienteId] = { total: 0, activos: 0, cerrados: 0 };
    clienteConCasos[c.clienteId].total++;
    if (c.cerrado) clienteConCasos[c.clienteId].cerrados++;
    else clienteConCasos[c.clienteId].activos++;
  });

  const frecuentes = Object.values(clienteConCasos).filter(c => c.total >= 5).length;
  const recurrentes = Object.values(clienteConCasos).filter(c => c.total >= 2 && c.total < 5).length;
  const unicos = Object.values(clienteConCasos).filter(c => c.total === 1).length;
  const soloInactivos = Object.values(clienteConCasos).filter(c => c.activos === 0).length;
  const sinCasos = clientes.length - Object.keys(clienteConCasos).length;

  console.log("");
  console.log("✅ ===== SEED v2 COMPLETADO =====");
  console.log(`   • 6 Usuarios (1 Admin + 4 Abogados + 1 Asistente)`);
  console.log(`   • ${clientes.length} Clientes`);
  console.log(`   • ${casosDef.length} Casos: ${activos.length} activos + ${cerrados.length} cerrados`);
  console.log(`     Cerrados: ${favorables} favorables, ${acuerdos} acuerdos, ${desfavorables} desfavorables, ${otrosCierre} otros`);
  console.log(`   • Estancados: ${estancados.length} total`);
  console.log("");
  console.log("   📊 Distribución de clientes (ES-12):");
  console.log(`      Frecuentes (5+ casos): ${frecuentes}`);
  console.log(`      Recurrentes (2-4 casos): ${recurrentes}`);
  console.log(`      Únicos (1 caso): ${unicos}`);
  console.log(`      Solo inactivos (sin activos): ${soloInactivos}`);
  console.log(`      Sin casos: ${sinCasos}`);
  console.log("");
  console.log("   📍 Distribución geográfica:");
  Object.entries(geoMap).sort((a, b) => b[1] - a[1]).forEach(([fuero, cant]) => {
    console.log(`      ${fuero}: ${cant} casos`);
  });
  console.log("");

  for (const abId of ['u-hernan', 'u-agustin', 'u-mario', 'u-laura']) {
    const act = activos.filter(c => c.abogadoId === abId).length;
    const cerr = cerrados.filter(c => c.abogadoId === abId).length;
    const est = activos.filter(c => c.abogadoId === abId && getEstancamiento(c) >= 90).length;
    const nombre = usuarios.find(u => u.id === abId)?.nombre;
    console.log(`   ${nombre}: ${act} activos (${est} estancados) + ${cerr} cerrados`);
  }

  console.log("");
  console.log("🔑 Credenciales:");
  console.log("   admin@estudio.com / 123456 (Admin)");
  console.log("   hernan@estudio.com / 123456");
  console.log("   agustin@estudio.com / 123456");
  console.log("   mario@estudio.com / 123456");
  console.log("   laura@estudio.com / 123456");
  console.log("   valentina@estudio.com / 123456 (Asistente)");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });