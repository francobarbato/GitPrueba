const { PrismaClient } = require("@prisma/client")
const bcryptjs = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...")

  // Limpiar datos existentes (En orden inverso de dependencia)
  await prisma.caso.deleteMany()
  await prisma.cliente.deleteMany() // <--  Limpiar la tabla Cliente
  await prisma.usuario.deleteMany()

  console.log("🗑️ Datos existentes eliminados")

  const hashedPassword = await bcryptjs.hash("123456", 10)

  // 1. CREAR USUARIOS (Admin y Abogados) - Solo en la tabla 'usuario'
  
  // Admin
  const admin = await prisma.usuario.create({
    data: {
      nombre: "Juan Carlos",
      apellido: "Administrador",
      email: "admin@estudio.com",
      password: hashedPassword,
      rol: "admin",
    },
  })

  // Abogados
  const abogado1 = await prisma.usuario.create({
    data: {
      nombre: "María",
      apellido: "González",
      email: "maria.gonzalez@estudio.com",
      password: hashedPassword,
      rol: "abogado",
    },
  })

  const abogado2 = await prisma.usuario.create({
    data: {
      nombre: "Juan",
      apellido: "Martínez",
      email: "juan.martinez@estudio.com",
      password: hashedPassword,
      rol: "abogado",
    },
  })

  const abogado3 = await prisma.usuario.create({
    data: {
      nombre: "Carlos",
      apellido: "López",
      email: "carlos.lopez@estudio.com",
      password: hashedPassword,
      rol: "abogado",
    },
  })

  console.log("👥 Usuarios (Admin/Abogados) creados")
  
  
//   // 2. CREAR CLIENTES - En la nueva tabla 'cliente'
//   
//   const cliente1 = await prisma.cliente.create({ // <-- CAMBIO CLAVE: prisma.cliente.create
//     data: {
//       nombre: "Pedro",
//       apellido: "García",
//       email: "pedro.garcia@email.com",
//       numeroDocumento: "44111222",
//       tipoDocumento: "DNI",
//       direccion: "Av. Siempre Viva 123",
//       telefono: "1155551111",
//       estado: "activo",
//     },
//   })

//   const cliente2 = await prisma.cliente.create({ // <-- CAMBIO CLAVE: prisma.cliente.create
//     data: {
//       nombre: "Ana",
//       apellido: "López",
//       email: "ana.lopez@email.com",
//       numeroDocumento: "33222111",
//       tipoDocumento: "DNI",
//       direccion: "Calle Falsa 456",
//       telefono: "1155552222",
//       estado: "activo",
//     },
//   })

//   const cliente3 = await prisma.cliente.create({ // <-- CAMBIO CLAVE: prisma.cliente.create
//     data: {
//       nombre: "María",
//       apellido: "Rodríguez",
//       email: "maria.rodriguez@email.com",
//       numeroDocumento: "22333444",
//       tipoDocumento: "LC",
//       direccion: "Bv. Oro 789",
//       telefono: "1155553333",
//       estado: "activo",
//     },
//   })

//   const cliente4 = await prisma.cliente.create({ // <-- CAMBIO CLAVE: prisma.cliente.create
//     data: {
//       nombre: "Luis",
//       apellido: "Fernández",
//       email: "luis.fernandez@email.com",
//       numeroDocumento: "11444555",
//       tipoDocumento: "LE",
//       direccion: "Ruta 20 km 5",
//       telefono: "1155554444",
//       estado: "activo",
//     },
//   })

//   console.log("👨‍👩‍👧‍👦 Clientes creados")

  // 3. CREAR CASOS DE EJEMPLO
  // Ahora usamos los IDs de los objetos creados arriba.
//   const casos = [
//     {
//       numero: "CASO-2024-001",
//       titulo: "Divorcio Consensuado",
//       descripcion: "Proceso de divorcio por mutuo acuerdo entre las partes.",
//       tipo: "familia",
//       estado: "en_proceso",
//       fechaInicio: new Date("2024-01-15"),
//       fechaCierre: new Date("2024-06-15"),
//       porcentajeAvance: 75,
//       abogadoId: abogado1.id, // ID de la tabla 'usuario'
//       clienteId: cliente1.id, // ID de la tabla 'cliente'
//     },
//     {
//       numero: "CASO-2024-002",
//       titulo: "Reclamo Laboral",
//       descripcion: "Demanda por despido sin causa y reclamo de indemnización.",
//       tipo: "laboral",
//       estado: "abierto",
//       fechaInicio: new Date("2024-02-01"),
//       fechaCierre: new Date("2024-08-01"),
//       porcentajeAvance: 30,
//       abogadoId: abogado2.id,
//       clienteId: cliente2.id,
//     },
//     {
//       numero: "CASO-2024-003",
//       titulo: "Sucesión Intestada",
//       descripcion: "Proceso sucesorio por fallecimiento sin testamento.",
//       tipo: "civil",
//       estado: "en_proceso",
//       fechaInicio: new Date("2024-01-20"),
//       fechaCierre: new Date("2024-12-20"),
//       porcentajeAvance: 50,
//       abogadoId: abogado1.id,
//       clienteId: cliente3.id,
//     },
//     {
//       numero: "CASO-2024-004",
//       titulo: "Accidente de Tránsito",
//       descripcion: "Reclamo por daños y perjuicios por accidente vehicular.",
//       tipo: "civil",
//       estado: "cerrado",
//       fechaInicio: new Date("2023-11-10"),
//       fechaCierre: new Date("2024-03-10"),
//       porcentajeAvance: 100,
//       abogadoId: abogado3.id,
//       clienteId: cliente4.id,
//     },
//     {
//       numero: "CASO-2024-005",
//       titulo: "Contrato Inmobiliario",
//       descripcion: "Asesoramiento en compraventa de propiedad.",
//       tipo: "comercial",
//       estado: "en_proceso",
//       fechaInicio: new Date("2024-03-01"),
//       fechaCierre: new Date("2024-05-01"),
//       porcentajeAvance: 80,
//       abogadoId: abogado2.id,
//       clienteId: cliente1.id,
//     },
//     {
//       numero: "CASO-2024-006",
//       titulo: "Mediación Familiar",
//       descripcion: "Proceso de mediación por régimen de visitas.",
//       tipo: "familia",
//       estado: "abierto",
//       fechaInicio: new Date("2024-03-15"),
//       fechaCierre: new Date("2024-07-15"),
//       porcentajeAvance: 20,
//       abogadoId: abogado1.id,
//       clienteId: cliente2.id,
//     },
//   ]

//   for (const casoData of casos) {
//     await prisma.caso.create({
//       data: casoData,
//     })
//   }

//   console.log("📁 Casos creados")
  console.log("✅ Seed completado exitosamente!")

  console.log("\n🔑 Credenciales de prueba:")
  console.log("Admin: admin@estudio.com / 123456")
  console.log("Abogados: maria.gonzalez@estudio.com / 123456")
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })