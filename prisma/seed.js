const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🔥 Iniciando SEED MASIVO para testing de reportes...");

  // ============================================================
  // 1. LIMPIEZA
  // ============================================================
  try {
    await prisma.bitacora.deleteMany();
    await prisma.tarea.deleteMany();
    await prisma.requirement.deleteMany();
    await prisma.pago.deleteMany();
  } catch (e) { console.log("✓ Tablas dependientes limpias."); }

  await prisma.caso.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️ Base de datos limpiada.");

  const password = await bcrypt.hash("123456", 10);

  // ============================================================
  // 2. USUARIOS (Admin + 4 Abogados)
  // ============================================================
  
  const usuarios = [
    { id: "u-admin", nombre: "Administrador", apellido: "General", email: "admin@estudio.com", rol: "ADMIN" },
    { id: "u-hernan", nombre: "Hernán", apellido: "Azar", email: "hernan@estudio.com", rol: "ABOGADO" },
    { id: "u-agustin", nombre: "Agustín", apellido: "Azar", email: "agustin@estudio.com", rol: "ABOGADO" },
    { id: "u-mario", nombre: "Mario", apellido: "Rodriguez", email: "mario@estudio.com", rol: "ABOGADO" },
    { id: "u-laura", nombre: "Laura", apellido: "Fernández", email: "laura@estudio.com", rol: "ABOGADO" },
  ];

  for (const u of usuarios) {
    await prisma.user.create({
      data: {
        ...u,
        password,
        isActive: true,
        name: `${u.nombre} ${u.apellido}`,
        emailVerified: new Date(),
      },
    });
  }

  console.log("👥 5 Usuarios creados (1 Admin + 4 Abogados).");

  // ============================================================
  // 3. CLIENTES (20 clientes variados)
  // ============================================================
  const clientes = [
    { id: 'c-01', tipoPersona: 'JURIDICA', nombre: "TechCorp S.A.", apellido: null, email: "legal@techcorp.com", telefono: "+54 11 4567-0001", tipoDocumento: "CUIT", numeroDocumento: "30-70001111-1", abogadoId: "u-hernan" },
    { id: 'c-02', tipoPersona: 'FISICA', nombre: "Carlos", apellido: "Mendoza", email: "carlos.mendoza@mail.com", telefono: "+54 9 351 111-0001", tipoDocumento: "DNI", numeroDocumento: "20111001", abogadoId: "u-hernan" },
    { id: 'c-03', tipoPersona: 'FISICA', nombre: "Ana", apellido: "López", email: "ana.lopez@mail.com", telefono: "+54 9 351 111-0002", tipoDocumento: "DNI", numeroDocumento: "27222002", abogadoId: "u-hernan" },
    { id: 'c-04', tipoPersona: 'JURIDICA', nombre: "Constructora del Sur S.R.L.", apellido: null, email: "admin@consur.com", tipoDocumento: "CUIT", numeroDocumento: "30-70002222-2", abogadoId: "u-hernan" },
    { id: 'c-05', tipoPersona: 'FISICA', nombre: "Roberto", apellido: "Díaz", email: "roberto.diaz@mail.com", tipoDocumento: "DNI", numeroDocumento: "18333003", abogadoId: "u-hernan" },
    { id: 'c-06', tipoPersona: 'FISICA', nombre: "María", apellido: "García", email: "maria.garcia@mail.com", tipoDocumento: "DNI", numeroDocumento: "25444004", abogadoId: "u-agustin" },
    { id: 'c-07', tipoPersona: 'FISICA', nombre: "Jorge", apellido: "Martínez", email: "jorge.martinez@mail.com", tipoDocumento: "DNI", numeroDocumento: "22555005", abogadoId: "u-agustin" },
    { id: 'c-08', tipoPersona: 'JURIDICA', nombre: "Importadora Global S.A.", apellido: null, email: "legal@impglobal.com", tipoDocumento: "CUIT", numeroDocumento: "30-70003333-3", abogadoId: "u-agustin" },
    { id: 'c-09', tipoPersona: 'FISICA', nombre: "Lucía", apellido: "Fernández", email: "lucia.fernandez@mail.com", tipoDocumento: "DNI", numeroDocumento: "29666006", abogadoId: "u-agustin" },
    { id: 'c-10', tipoPersona: 'FISICA', nombre: "Pedro", apellido: "Sánchez", email: "pedro.sanchez@mail.com", tipoDocumento: "DNI", numeroDocumento: "21777007", abogadoId: "u-agustin" },
    { id: 'c-11', tipoPersona: 'FISICA', nombre: "Andrés", apellido: "Gómez", email: "andres.gomez@mail.com", tipoDocumento: "DNI", numeroDocumento: "23888008", abogadoId: "u-mario" },
    { id: 'c-12', tipoPersona: 'JURIDICA', nombre: "Transporte Rápido S.A.", apellido: null, email: "legal@transrapido.com", tipoDocumento: "CUIT", numeroDocumento: "30-70004444-4", abogadoId: "u-mario" },
    { id: 'c-13', tipoPersona: 'FISICA', nombre: "Silvia", apellido: "Romero", email: "silvia.romero@mail.com", tipoDocumento: "DNI", numeroDocumento: "26999009", abogadoId: "u-mario" },
    { id: 'c-14', tipoPersona: 'FISICA', nombre: "Martín", apellido: "Torres", email: "martin.torres@mail.com", tipoDocumento: "DNI", numeroDocumento: "24000010", abogadoId: "u-mario" },
    { id: 'c-15', tipoPersona: 'FISICA', nombre: "Carolina", apellido: "Vega", email: "carolina.vega@mail.com", tipoDocumento: "DNI", numeroDocumento: "28111011", abogadoId: "u-laura" },
    { id: 'c-16', tipoPersona: 'JURIDICA', nombre: "Inmobiliaria Centro S.A.", apellido: null, email: "legal@inmobcentro.com", tipoDocumento: "CUIT", numeroDocumento: "30-70005555-5", abogadoId: "u-laura" },
    { id: 'c-17', tipoPersona: 'FISICA', nombre: "Fernando", apellido: "Castro", email: "fernando.castro@mail.com", tipoDocumento: "DNI", numeroDocumento: "20222012", abogadoId: "u-laura" },
    { id: 'c-18', tipoPersona: 'FISICA', nombre: "Patricia", apellido: "Morales", email: "patricia.morales@mail.com", tipoDocumento: "DNI", numeroDocumento: "27333013", abogadoId: "u-laura" },
    { id: 'c-19', tipoPersona: 'FISICA', nombre: "Diego", apellido: "Ruiz", email: "diego.ruiz@mail.com", tipoDocumento: "DNI", numeroDocumento: "25444014", abogadoId: "u-laura" },
    { id: 'c-20', tipoPersona: 'JURIDICA', nombre: "Agro Pampa S.A.", apellido: null, email: "legal@agropampa.com", tipoDocumento: "CUIT", numeroDocumento: "30-70006666-6", abogadoId: "u-laura" },
  ];

  for (const c of clientes) {
    await prisma.cliente.create({
      data: { ...c, activo: true, condicionIva: c.tipoPersona === 'JURIDICA' ? 'RESPONSABLE_INSCRIPTO' : 'CONSUMIDOR_FINAL' }
    });
  }
  console.log("👤 20 Clientes creados.");

  // ============================================================
  // 4. CASOS MASIVOS (45+ casos)
  // ============================================================
  // MOTIVOS DE CIERRE: Estos valores deben coincidir con lo que
  // guarda tu formulario de cierre. Ajustá si tu UI usa otros strings.
  // ============================================================
  
  const MOTIVOS = {
    FAVORABLE: 'Sentencia favorable',
    DESFAVORABLE: 'Sentencia desfavorable',
    ACUERDO: 'Acuerdo/Conciliación',
    DESISTIMIENTO: 'Desistimiento',
    ARCHIVO: 'Archivo',
    PRESCRIPCION: 'Prescripción',
  };

  const estados = [
    'Inicio / Demanda', 'Mediación / Previo', 'Prueba (Oficios/Pericias)',
    'Alegatos / Conclusiones', 'Sentencia de 1ra Instancia',
    'Apelación / 2da Instancia', 'Ejecución de Sentencia'
  ];

  const fueros = ['Capital Federal', 'Córdoba, Capital', 'Córdoba, Río Cuarto', 'Buenos Aires, La Plata', 'Mendoza', 'Rosario'];
  const juzgados = ['Juzgado Nº 1', 'Juzgado Nº 2', 'Juzgado Nº 3', 'Juzgado Nº 4', 'Juzgado Nº 5', 'Juzgado Nº 8', 'Juzgado Nº 12'];

  const diasAtras = (dias) => new Date(Date.now() - dias * 24 * 60 * 60 * 1000);
  
  const casos = [];
  let n = 1;

  // ================================================================
  // HERNÁN: 12 casos (5 cerrados con motivos variados + 4 activos + 3 dormidos)
  // ================================================================

  // Cerrados con motivo y montos
  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-001', titulo: 'TechCorp c/ Proveedor s/ Incumplimiento', tipo: 'CIVIL_COMERCIAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(365), fechaCierre: diasAtras(30), estaCerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoDisputa: 8500000, montoFinal: 7200000,
    abogadoId: 'u-hernan', clienteId: 'c-01', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-015', titulo: 'Mendoza c/ Empleador s/ Despido', tipo: 'LABORAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(210), fechaCierre: diasAtras(15), estaCerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoDisputa: 4500000, montoFinal: 3200000,
    abogadoId: 'u-hernan', clienteId: 'c-02', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-022', titulo: 'López c/ Consorcio s/ Daños', tipo: 'CIVIL_COMERCIAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(450), fechaCierre: diasAtras(45), estaCerrado: true, motivoCierre: MOTIVOS.DESFAVORABLE, montoDisputa: 3200000, montoFinal: 0,
    abogadoId: 'u-hernan', clienteId: 'c-03', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-023', titulo: 'Díaz c/ Empresa Textil s/ Indemnización', tipo: 'LABORAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(300), fechaCierre: diasAtras(60), estaCerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoDisputa: 6000000, montoFinal: 5800000,
    abogadoId: 'u-hernan', clienteId: 'c-05', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-024', titulo: 'Constructora del Sur c/ Municipalidad s/ Cobro', tipo: 'CONTENCIOSO_ADMINISTRATIVO', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(500), fechaCierre: diasAtras(90), estaCerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoDisputa: 15000000, montoFinal: 10000000,
    abogadoId: 'u-hernan', clienteId: 'c-04', priority: 'HIGH' });

  // Activos
  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-101', titulo: 'TechCorp c/ Cliente Moroso s/ Ejecutivo', tipo: 'CIVIL_COMERCIAL', estado: 'Prueba (Oficios/Pericias)',
    fechaInicio: diasAtras(60), updatedAt: diasAtras(5), montoDisputa: 2800000, abogadoId: 'u-hernan', clienteId: 'c-01', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-102', titulo: 'Mendoza c/ ART s/ Accidente', tipo: 'LABORAL', estado: 'Mediación / Previo',
    fechaInicio: diasAtras(30), updatedAt: diasAtras(3), montoDisputa: 7500000, abogadoId: 'u-hernan', clienteId: 'c-02', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-103', titulo: 'López c/ Seguro s/ Siniestro', tipo: 'CIVIL_COMERCIAL', estado: 'Alegatos / Conclusiones',
    fechaInicio: diasAtras(90), updatedAt: diasAtras(10), montoDisputa: 1500000, abogadoId: 'u-hernan', clienteId: 'c-03', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-104', titulo: 'Díaz c/ Vecino s/ Medianería', tipo: 'CIVIL_COMERCIAL', estado: 'Inicio / Demanda',
    fechaInicio: diasAtras(15), updatedAt: diasAtras(2), montoDisputa: 900000, abogadoId: 'u-hernan', clienteId: 'c-05', priority: 'LOW' });

  // Dormidos
  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-050', titulo: 'Constructora s/ Quiebra', tipo: 'CIVIL_COMERCIAL', estado: 'Alegatos / Conclusiones',
    fechaInicio: diasAtras(200), updatedAt: diasAtras(50), montoDisputa: 12000000, abogadoId: 'u-hernan', clienteId: 'c-04', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-051', titulo: 'TechCorp c/ AFIP s/ Impugnación', tipo: 'CONTENCIOSO_ADMINISTRATIVO', estado: 'Sentencia de 1ra Instancia',
    fechaInicio: diasAtras(180), updatedAt: diasAtras(60), montoDisputa: 4200000, abogadoId: 'u-hernan', clienteId: 'c-01', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-052', titulo: 'Mendoza s/ Sucesión', tipo: 'SUCESIONES', estado: 'Prueba (Oficios/Pericias)',
    fechaInicio: diasAtras(400), updatedAt: diasAtras(90), montoDisputa: 20000000, abogadoId: 'u-hernan', clienteId: 'c-02', priority: 'LOW' });

  // ================================================================
  // AGUSTÍN: 10 casos (5 cerrados + 3 activos + 2 dormidos)
  // ================================================================

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-100', titulo: 'García s/ Divorcio', tipo: 'FAMILIA', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(180), fechaCierre: diasAtras(10), estaCerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoDisputa: 2000000, montoFinal: 1800000,
    abogadoId: 'u-agustin', clienteId: 'c-06', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-101', titulo: 'Martínez c/ Inquilino s/ Desalojo', tipo: 'CIVIL_COMERCIAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(240), fechaCierre: diasAtras(20), estaCerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoDisputa: 1800000, montoFinal: 1800000,
    abogadoId: 'u-agustin', clienteId: 'c-07', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-102', titulo: 'Importadora c/ Aduana s/ Multa', tipo: 'CONTENCIOSO_ADMINISTRATIVO', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(400), fechaCierre: diasAtras(60), estaCerrado: true, motivoCierre: MOTIVOS.DESFAVORABLE, montoDisputa: 5500000, montoFinal: 0,
    abogadoId: 'u-agustin', clienteId: 'c-08', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-103', titulo: 'Fernández s/ Alimentos', tipo: 'FAMILIA', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(120), fechaCierre: diasAtras(5), estaCerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoDisputa: 800000, montoFinal: 750000,
    abogadoId: 'u-agustin', clienteId: 'c-09', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-104', titulo: 'Sánchez c/ Empresa s/ Despido', tipo: 'LABORAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(280), fechaCierre: diasAtras(35), estaCerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoDisputa: 3800000, montoFinal: 2900000,
    abogadoId: 'u-agustin', clienteId: 'c-10', priority: 'NORMAL' });

  // Activos
  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-200', titulo: 'García s/ Régimen de Visitas', tipo: 'FAMILIA', estado: 'Mediación / Previo',
    fechaInicio: diasAtras(20), updatedAt: diasAtras(4), montoDisputa: 0, abogadoId: 'u-agustin', clienteId: 'c-06', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-201', titulo: 'Importadora c/ Proveedor s/ Cumplimiento', tipo: 'CIVIL_COMERCIAL', estado: 'Inicio / Demanda',
    fechaInicio: diasAtras(10), updatedAt: diasAtras(1), montoDisputa: 6200000, abogadoId: 'u-agustin', clienteId: 'c-08', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-202', titulo: 'Martínez c/ Obra Social s/ Amparo', tipo: 'CIVIL_COMERCIAL', estado: 'Prueba (Oficios/Pericias)',
    fechaInicio: diasAtras(45), updatedAt: diasAtras(7), montoDisputa: 1200000, abogadoId: 'u-agustin', clienteId: 'c-07', priority: 'HIGH' });

  // Dormidos
  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-110', titulo: 'Martínez s/ Sucesión', tipo: 'SUCESIONES', estado: 'Prueba (Oficios/Pericias)',
    fechaInicio: diasAtras(250), updatedAt: diasAtras(35), montoDisputa: 18000000, abogadoId: 'u-agustin', clienteId: 'c-07', priority: 'LOW' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-111', titulo: 'Fernández c/ Ex Cónyuge s/ Liquidación', tipo: 'FAMILIA', estado: 'Sentencia de 1ra Instancia',
    fechaInicio: diasAtras(180), updatedAt: diasAtras(55), montoDisputa: 3500000, abogadoId: 'u-agustin', clienteId: 'c-09', priority: 'NORMAL' });

  // ================================================================
  // MARIO: 10 casos (4 cerrados + 4 activos + 2 dormidos)
  // ================================================================

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-200', titulo: 'Gómez s/ Lesiones Culposas', tipo: 'PENAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(350), fechaCierre: diasAtras(25), estaCerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoDisputa: 3000000, montoFinal: 2500000,
    abogadoId: 'u-mario', clienteId: 'c-11', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-201', titulo: 'Transporte c/ Aseguradora s/ Siniestro', tipo: 'CIVIL_COMERCIAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(270), fechaCierre: diasAtras(40), estaCerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoDisputa: 9000000, montoFinal: 6500000,
    abogadoId: 'u-mario', clienteId: 'c-12', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-202', titulo: 'Romero c/ Empresa s/ Mobbing', tipo: 'LABORAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(200), fechaCierre: diasAtras(50), estaCerrado: true, motivoCierre: MOTIVOS.DESISTIMIENTO, montoDisputa: 5000000, montoFinal: 0,
    abogadoId: 'u-mario', clienteId: 'c-13', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-203', titulo: 'Torres c/ ART s/ Incapacidad', tipo: 'LABORAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(320), fechaCierre: diasAtras(70), estaCerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoDisputa: 8200000, montoFinal: 7800000,
    abogadoId: 'u-mario', clienteId: 'c-14', priority: 'HIGH' });

  // Activos
  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-300', titulo: 'Romero c/ Vecino s/ Daños', tipo: 'CIVIL_COMERCIAL', estado: 'Prueba (Oficios/Pericias)',
    fechaInicio: diasAtras(40), updatedAt: diasAtras(8), montoDisputa: 2200000, abogadoId: 'u-mario', clienteId: 'c-13', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-301', titulo: 'Torres c/ Empleador s/ Despido', tipo: 'LABORAL', estado: 'Mediación / Previo',
    fechaInicio: diasAtras(25), updatedAt: diasAtras(3), montoDisputa: 5500000, abogadoId: 'u-mario', clienteId: 'c-14', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-302', titulo: 'Gómez s/ Hurto', tipo: 'PENAL', estado: 'Alegatos / Conclusiones',
    fechaInicio: diasAtras(50), updatedAt: diasAtras(12), montoDisputa: 0, abogadoId: 'u-mario', clienteId: 'c-11', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-303', titulo: 'Transporte c/ Cliente s/ Cobro Fletes', tipo: 'CIVIL_COMERCIAL', estado: 'Inicio / Demanda',
    fechaInicio: diasAtras(8), updatedAt: diasAtras(2), montoDisputa: 1800000, abogadoId: 'u-mario', clienteId: 'c-12', priority: 'LOW' });

  // Dormidos
  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-210', titulo: 'Romero s/ Usucapión', tipo: 'CIVIL_COMERCIAL', estado: 'Prueba (Oficios/Pericias)',
    fechaInicio: diasAtras(400), updatedAt: diasAtras(100), montoDisputa: 25000000, abogadoId: 'u-mario', clienteId: 'c-13', priority: 'LOW' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-211', titulo: 'Gómez c/ Estado s/ Daños', tipo: 'CONTENCIOSO_ADMINISTRATIVO', estado: 'Sentencia de 1ra Instancia',
    fechaInicio: diasAtras(250), updatedAt: diasAtras(65), montoDisputa: 4000000, abogadoId: 'u-mario', clienteId: 'c-11', priority: 'NORMAL' });

  // ================================================================
  // LAURA: 15 casos (7 cerrados variados + 5 activos + 3 dormidos)
  // ================================================================

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-300', titulo: 'Vega s/ Divorcio Express', tipo: 'FAMILIA', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(90), fechaCierre: diasAtras(5), estaCerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoDisputa: 1500000, montoFinal: 1500000,
    abogadoId: 'u-laura', clienteId: 'c-15', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-301', titulo: 'Inmobiliaria c/ Inquilino s/ Desalojo', tipo: 'CIVIL_COMERCIAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(150), fechaCierre: diasAtras(12), estaCerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoDisputa: 2400000, montoFinal: 2400000,
    abogadoId: 'u-laura', clienteId: 'c-16', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-302', titulo: 'Castro c/ Obra Social s/ Reintegro', tipo: 'CIVIL_COMERCIAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(120), fechaCierre: diasAtras(8), estaCerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoDisputa: 950000, montoFinal: 920000,
    abogadoId: 'u-laura', clienteId: 'c-17', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-303', titulo: 'Morales c/ Consorcio s/ Expensas', tipo: 'CIVIL_COMERCIAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(160), fechaCierre: diasAtras(18), estaCerrado: true, motivoCierre: MOTIVOS.ARCHIVO, montoDisputa: 350000, montoFinal: 0,
    abogadoId: 'u-laura', clienteId: 'c-18', priority: 'LOW' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-304', titulo: 'Ruiz c/ Empleador s/ Diferencias', tipo: 'LABORAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(280), fechaCierre: diasAtras(30), estaCerrado: true, motivoCierre: MOTIVOS.ACUERDO, montoDisputa: 4200000, montoFinal: 3500000,
    abogadoId: 'u-laura', clienteId: 'c-19', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-305', titulo: 'Agro Pampa c/ Acopiador s/ Cobro', tipo: 'CIVIL_COMERCIAL', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(200), fechaCierre: diasAtras(22), estaCerrado: true, motivoCierre: MOTIVOS.FAVORABLE, montoDisputa: 11000000, montoFinal: 9500000,
    abogadoId: 'u-laura', clienteId: 'c-20', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-306', titulo: 'Vega c/ Ex Cónyuge s/ Compensación Económica', tipo: 'FAMILIA', estado: 'Ejecución de Sentencia',
    fechaInicio: diasAtras(330), fechaCierre: diasAtras(55), estaCerrado: true, motivoCierre: MOTIVOS.DESFAVORABLE, montoDisputa: 5000000, montoFinal: 0,
    abogadoId: 'u-laura', clienteId: 'c-15', priority: 'NORMAL' });

  // Activos
  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-400', titulo: 'Vega s/ Tenencia', tipo: 'FAMILIA', estado: 'Prueba (Oficios/Pericias)',
    fechaInicio: diasAtras(35), updatedAt: diasAtras(5), montoDisputa: 0, abogadoId: 'u-laura', clienteId: 'c-15', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-401', titulo: 'Inmobiliaria c/ Constructor s/ Vicios', tipo: 'CIVIL_COMERCIAL', estado: 'Alegatos / Conclusiones',
    fechaInicio: diasAtras(80), updatedAt: diasAtras(10), montoDisputa: 8000000, abogadoId: 'u-laura', clienteId: 'c-16', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-402', titulo: 'Castro c/ Municipalidad s/ Amparo', tipo: 'CONTENCIOSO_ADMINISTRATIVO', estado: 'Inicio / Demanda',
    fechaInicio: diasAtras(12), updatedAt: diasAtras(2), montoDisputa: 3000000, abogadoId: 'u-laura', clienteId: 'c-17', priority: 'HIGH' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-403', titulo: 'Morales s/ Alimentos', tipo: 'FAMILIA', estado: 'Mediación / Previo',
    fechaInicio: diasAtras(18), updatedAt: diasAtras(4), montoDisputa: 600000, abogadoId: 'u-laura', clienteId: 'c-18', priority: 'NORMAL' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2025-404', titulo: 'Ruiz c/ ART s/ Accidente', tipo: 'LABORAL', estado: 'Prueba (Oficios/Pericias)',
    fechaInicio: diasAtras(55), updatedAt: diasAtras(8), montoDisputa: 9500000, abogadoId: 'u-laura', clienteId: 'c-19', priority: 'HIGH' });

  // Dormidos
  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-310', titulo: 'Agro Pampa c/ Banco s/ Ejecutivo', tipo: 'CIVIL_COMERCIAL', estado: 'Sentencia de 1ra Instancia',
    fechaInicio: diasAtras(280), updatedAt: diasAtras(85), montoDisputa: 7500000, abogadoId: 'u-laura', clienteId: 'c-20', priority: 'LOW' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-311', titulo: 'Castro s/ Sucesión', tipo: 'SUCESIONES', estado: 'Prueba (Oficios/Pericias)',
    fechaInicio: diasAtras(350), updatedAt: diasAtras(70), montoDisputa: 30000000, abogadoId: 'u-laura', clienteId: 'c-17', priority: 'LOW' });

  casos.push({ id: `cs-${n++}`, numero: 'EXP-2024-312', titulo: 'Inmobiliaria c/ AFIP s/ Repetición', tipo: 'CONTENCIOSO_ADMINISTRATIVO', estado: 'Apelación / 2da Instancia',
    fechaInicio: diasAtras(300), updatedAt: diasAtras(45), montoDisputa: 5800000, abogadoId: 'u-laura', clienteId: 'c-16', priority: 'NORMAL' });

  // ================================================================
  // GUARDAR CASOS
  // ================================================================
  for (const caso of casos) {
    const casoData = {
      id: caso.id,
      numero: caso.numero,
      titulo: caso.titulo,
      descripcion: `Descripción del caso ${caso.numero}`,
      tipo: caso.tipo,
      estado: caso.estado,
      porcentajeAvance: caso.estaCerrado ? 100 : Math.floor(Math.random() * 80) + 10,
      fuero: fueros[Math.floor(Math.random() * fueros.length)],
      juzgado: juzgados[Math.floor(Math.random() * juzgados.length)],
      montoDisputa: caso.montoDisputa || Math.floor(Math.random() * 5000000) + 100000,
      montoFinal: caso.montoFinal !== undefined ? caso.montoFinal : null,
      fechaInicio: caso.fechaInicio,
      estaCerrado: caso.estaCerrado || false,
      fechaCierre: caso.fechaCierre || null,
      motivoCierre: caso.motivoCierre || null,
      observacionCierre: caso.estaCerrado ? `Cierre registrado para testing - ${caso.motivoCierre || 'sin motivo'}` : null,
      cerradoPorId: caso.estaCerrado ? caso.abogadoId : null,
      estadoAntesCierre: caso.estaCerrado ? caso.estado : null,
      abogadoId: caso.abogadoId,
      clienteId: caso.clienteId,
      priority: caso.priority || 'NORMAL',
    };

    await prisma.caso.create({ data: casoData });

    if (caso.updatedAt) {
      await prisma.caso.update({
        where: { id: caso.id },
        data: { updatedAt: caso.updatedAt }
      });
    }
  }

  console.log(`📂 ${casos.length} Casos creados.`);

  // ============================================================
  // 5. BITÁCORA (Cambios de estado)
  // ============================================================
  const bitacoras = [];

  for (const caso of casos) {
    const estadoIndex = estados.indexOf(caso.estado);
    
    bitacoras.push({
      casoId: caso.id, texto: 'Caso ingresado al sistema', accion: 'CREATE',
      estadoNuevo: 'Inicio / Demanda', detalle: 'Alta de expediente', tipo: 'auto',
      usuarioId: caso.abogadoId, createdAt: caso.fechaInicio,
    });

    if (estadoIndex > 0) {
      let fechaActual = new Date(caso.fechaInicio);
      for (let i = 1; i <= estadoIndex; i++) {
        const diasEnEtapa = Math.floor(Math.random() * 45) + 15;
        fechaActual = new Date(fechaActual.getTime() + diasEnEtapa * 24 * 60 * 60 * 1000);
        if (fechaActual > new Date()) fechaActual = new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000);

        bitacoras.push({
          casoId: caso.id, texto: `Cambio de estado: ${estados[i-1]} → ${estados[i]}`,
          accion: 'Cambio de Estado', estadoAnterior: estados[i-1], estadoNuevo: estados[i],
          detalle: 'Avance procesal', tipo: 'auto', usuarioId: caso.abogadoId, createdAt: fechaActual,
        });
      }
    }

    // Agregar entrada de cierre en bitácora para casos cerrados
    if (caso.estaCerrado && caso.fechaCierre) {
      bitacoras.push({
        casoId: caso.id,
        texto: `Caso cerrado: ${caso.motivoCierre || 'Sin motivo'}. Monto final: $${caso.montoFinal || 0}`,
        accion: 'Cierre de Caso',
        estadoAnterior: caso.estado,
        estadoNuevo: 'Cerrado',
        detalle: `Motivo: ${caso.motivoCierre || 'N/A'}`,
        tipo: 'auto',
        usuarioId: caso.abogadoId,
        createdAt: caso.fechaCierre,
      });
    }
  }

  for (const b of bitacoras) {
    await prisma.bitacora.create({ data: b });
  }
  
  console.log(`📝 ${bitacoras.length} Entradas de bitácora creadas.`);

  // ============================================================
  // 6. RESUMEN
  // ============================================================
  const cerrados = casos.filter(c => c.estaCerrado);
  const activos = casos.filter(c => !c.estaCerrado);
  const dormidos = activos.filter(c => {
    const diasSinTocar = (Date.now() - (c.updatedAt || new Date()).getTime()) / (1000*60*60*24);
    return diasSinTocar > 30;
  });

  const favorables = cerrados.filter(c => c.motivoCierre === MOTIVOS.FAVORABLE).length;
  const acuerdos = cerrados.filter(c => c.motivoCierre === MOTIVOS.ACUERDO).length;
  const desfavorables = cerrados.filter(c => c.motivoCierre === MOTIVOS.DESFAVORABLE).length;
  const otrosCierre = cerrados.length - favorables - acuerdos - desfavorables;

  console.log("");
  console.log("✅ ===== SEED COMPLETADO EXITOSAMENTE =====");
  console.log("📊 Resumen:");
  console.log(`   • 5 Usuarios (1 Admin + 4 Abogados)`);
  console.log(`   • 20 Clientes`);
  console.log(`   • ${casos.length} Casos totales:`);
  console.log(`     - ${cerrados.length} Cerrados:`);
  console.log(`       · ${favorables} Sentencia favorable`);
  console.log(`       · ${acuerdos} Acuerdo/Conciliación`);
  console.log(`       · ${desfavorables} Sentencia desfavorable`);
  console.log(`       · ${otrosCierre} Otros (Desistimiento/Archivo/Prescripción)`);
  console.log(`     - ${activos.length} Activos`);
  console.log(`     - ${dormidos.length} Dormidos +30 días`);
  console.log(`   • ${bitacoras.length} Movimientos de bitácora`);
  console.log("");
  console.log("🔑 Credenciales de acceso:");
  console.log("   Admin:    admin@estudio.com / 123456");
  console.log("   Hernán:   hernan@estudio.com / 123456");
  console.log("   Agustín:  agustin@estudio.com / 123456");
  console.log("   Mario:    mario@estudio.com / 123456");
  console.log("   Laura:    laura@estudio.com / 123456");
  console.log("");
  console.log("📈 Reportes a probar:");
  console.log("   • /reportes/matriz-trabajo     → Carga y casos dormidos");
  console.log("   • /reportes/rendimiento         → Velocidad por abogado");
  console.log("   • /reportes/tiempo-por-etapa    → Cuellos de botella");
  console.log("   • /reportes/cartera-fuero       → Volumen vs valor por fuero");
  console.log("   • /reportes/analisis-resultados → Tasa de éxito y recupero");
}

main()
  .catch((e) => { console.error("❌ Error:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });