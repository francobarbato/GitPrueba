// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Limpiar datos existentes
  await prisma.alerta.deleteMany();
  await prisma.documento.deleteMany();
  await prisma.actualizacionCaso.deleteMany();
  await prisma.indemnizacion.deleteMany();
  await prisma.caso.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.plantilla.deleteMany();

  console.log('Base de datos limpiada');

  // Crear usuarios
  const adminPassword = await hash('admin123', 10);
  const userPassword = await hash('password123', 10);
  
  const admin = await prisma.usuario.create({
    data: {
      email: 'admin@example.com',
      nombre: 'Admin',
      apellido: 'Sistema',
      password: adminPassword,
      rol: 'admin',
    },
  });
  
  const abogado1 = await prisma.usuario.create({
    data: {
      email: 'abogado1@example.com',
      nombre: 'Juan',
      apellido: 'Pérez',
      password: userPassword,
      rol: 'abogado',
    },
  });
  
  const abogado2 = await prisma.usuario.create({
    data: {
      email: 'abogado2@example.com',
      nombre: 'María',
      apellido: 'González',
      password: userPassword,
      rol: 'abogado',
    },
  });
  
  const cliente1 = await prisma.usuario.create({
    data: {
      email: 'cliente1@example.com',
      nombre: 'Carlos',
      apellido: 'Rodríguez',
      password: userPassword,
      rol: 'cliente',
    },
  });
  
  const cliente2 = await prisma.usuario.create({
    data: {
      email: 'cliente2@example.com',
      nombre: 'Ana',
      apellido: 'López',
      password: userPassword,
      rol: 'cliente',
    },
  });
  
  console.log('Usuarios creados');

  // Crear casos
  const caso1 = await prisma.caso.create({
    data: {
      numero: '2023-001',
      titulo: 'Despido injustificado',
      descripcion: 'Caso de despido sin causa justificada',
      tipo: 'laboral',
      estado: 'abierto',
      fechaInicio: new Date('2023-01-15'),
      abogadoId: abogado1.id,
      clienteId: cliente1.id,
      ubicacion: 'Buenos Aires',
    },
  });
  
  const caso2 = await prisma.caso.create({
    data: {
      numero: '2023-002',
      titulo: 'Divorcio contencioso',
      descripcion: 'Proceso de divorcio con disputa de bienes',
      tipo: 'familia',
      estado: 'en_proceso',
      fechaInicio: new Date('2023-02-20'),
      abogadoId: abogado2.id,
      clienteId: cliente2.id,
      ubicacion: 'Córdoba',
    },
  });
  
  const caso3 = await prisma.caso.create({
    data: {
      numero: '2023-003',
      titulo: 'Incumplimiento de contrato',
      descripcion: 'Demanda por incumplimiento de contrato comercial',
      tipo: 'comercial',
      estado: 'abierto',
      fechaInicio: new Date('2023-03-10'),
      abogadoId: abogado1.id,
      clienteId: cliente2.id,
      ubicacion: 'Rosario',
    },
  });
  
  console.log('Casos creados');

  // Crear alertas
  await prisma.alerta.create({
    data: {
      tipo: 'audiencia',
      titulo: 'Audiencia preliminar',
      descripcion: 'Audiencia preliminar en juzgado laboral',
      fecha: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 días en el futuro
      estado: 'pendiente',
      prioridad: 'alta',
      casoId: caso1.id,
      usuarioId: abogado1.id,
    },
  });
  
  await prisma.alerta.create({
    data: {
      tipo: 'plazo',
      titulo: 'Vencimiento presentación escrito',
      descripcion: 'Presentación de pruebas documentales',
      fecha: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días en el futuro
      estado: 'pendiente',
      prioridad: 'media',
      casoId: caso2.id,
      usuarioId: abogado2.id,
    },
  });
  
  await prisma.alerta.create({
    data: {
      tipo: 'reunion',
      titulo: 'Reunión con cliente',
      descripcion: 'Actualización sobre el caso',
      fecha: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 día en el futuro
      estado: 'pendiente',
      prioridad: 'baja',
      casoId: caso3.id,
      usuarioId: abogado1.id,
    },
  });
  
  console.log('Alertas creadas');

  // Crear documentos
  await prisma.documento.create({
    data: {
      nombre: 'Demanda inicial',
      tipo: 'demanda',
      ruta: '/documentos/demanda_caso1.pdf',
      estado: 'completado',
      casoId: caso1.id,
      usuarioId: abogado1.id,
    },
  });
  
  await prisma.documento.create({
    data: {
      nombre: 'Contestación demanda',
      tipo: 'contestacion',
      ruta: '/documentos/contestacion_caso1.pdf',
      estado: 'pendiente',
      casoId: caso1.id,
      usuarioId: abogado1.id,
    },
  });
  
  console.log('Documentos creados');

  // Crear actualizaciones de casos
  await prisma.actualizacionCaso.create({
    data: {
      descripcion: 'Se presentó la demanda inicial',
      casoId: caso1.id,
      usuarioId: abogado1.id,
    },
  });
  
  await prisma.actualizacionCaso.create({
    data: {
      descripcion: 'Se fijó fecha para audiencia preliminar',
      casoId: caso1.id,
      usuarioId: abogado1.id,
    },
  });
  
  console.log('Actualizaciones de casos creadas');

  // Crear indemnizaciones
  await prisma.indemnizacion.create({
    data: {
      tipo: 'despido',
      monto: 150000.00,
      descripcion: 'Indemnización por despido sin causa',
      casoId: caso1.id,
    },
  });
  
  console.log('Indemnizaciones creadas');

  // Crear plantillas
  await prisma.plantilla.create({
    data: {
      nombre: 'Demanda laboral',
      descripcion: 'Plantilla para demandas laborales por despido',
      contenido: 'AL SEÑOR JUEZ LABORAL DE TURNO:\n\n[NOMBRE ABOGADO], abogado, Tº [TOMO] Fº [FOLIO], constituyendo domicilio procesal en [DOMICILIO], en representación de [NOMBRE CLIENTE], con domicilio real en [DOMICILIO CLIENTE], al Sr. Juez respetuosamente me presento y digo:...',
      categoria: 'laboral',
    },
  });
  
  await prisma.plantilla.create({
    data: {
      nombre: 'Contrato de locación',
      descripcion: 'Plantilla para contratos de alquiler',
      contenido: 'CONTRATO DE LOCACIÓN\n\nEntre [NOMBRE LOCADOR], DNI [DNI], con domicilio en [DOMICILIO], en adelante "EL LOCADOR", por una parte; y [NOMBRE LOCATARIO], DNI [DNI], con domicilio en [DOMICILIO], en adelante "EL LOCATARIO", por la otra parte; convienen en celebrar el presente contrato de locación sujeto a las siguientes cláusulas y condiciones:...',
      categoria: 'contratos',
    },
  });
  
  console.log('Plantillas creadas');

  console.log('Datos de prueba creados exitosamente');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });