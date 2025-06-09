const { PrismaClient } = require("@prisma/client")
const bcryptjs = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...")

  // Limpiar datos existentes
  await prisma.caso.deleteMany()
  await prisma.usuario.deleteMany()

  console.log("🗑️ Datos existentes eliminados")

  // Crear usuarios (abogados, clientes y admin)
  const hashedPassword = await bcryptjs.hash("123456", 10)

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

  // Clientes
  const cliente1 = await prisma.usuario.create({
    data: {
      nombre: "Pedro",
      apellido: "García",
      email: "pedro.garcia@email.com",
      password: hashedPassword,
      rol: "cliente",
    },
  })

  const cliente2 = await prisma.usuario.create({
    data: {
      nombre: "Ana",
      apellido: "López",
      email: "ana.lopez@email.com",
      password: hashedPassword,
      rol: "cliente",
    },
  })

  const cliente3 = await prisma.usuario.create({
    data: {
      nombre: "María",
      apellido: "Rodríguez",
      email: "maria.rodriguez@email.com",
      password: hashedPassword,
      rol: "cliente",
    },
  })

  const cliente4 = await prisma.usuario.create({
    data: {
      nombre: "Luis",
      apellido: "Fernández",
      email: "luis.fernandez@email.com",
      password: hashedPassword,
      rol: "cliente",
    },
  })

  console.log("👥 Usuarios creados")

  // Crear casos de ejemplo
  const casos = [
    {
      numero: "CASO-2024-001",
      titulo: "Divorcio Consensuado",
      descripcion: "Proceso de divorcio por mutuo acuerdo entre las partes.",
      tipo: "familia",
      estado: "en_proceso",
      fechaInicio: new Date("2024-01-15"),
      fechaCierre: new Date("2024-06-15"),
      porcentajeAvance: 75,
      abogadoId: abogado1.id,
      clienteId: cliente1.id,
    },
    {
      numero: "CASO-2024-002",
      titulo: "Reclamo Laboral",
      descripcion: "Demanda por despido sin causa y reclamo de indemnización.",
      tipo: "laboral",
      estado: "abierto",
      fechaInicio: new Date("2024-02-01"),
      fechaCierre: new Date("2024-08-01"),
      porcentajeAvance: 30,
      abogadoId: abogado2.id,
      clienteId: cliente2.id,
    },
    {
      numero: "CASO-2024-003",
      titulo: "Sucesión Intestada",
      descripcion: "Proceso sucesorio por fallecimiento sin testamento.",
      tipo: "civil",
      estado: "en_proceso",
      fechaInicio: new Date("2024-01-20"),
      fechaCierre: new Date("2024-12-20"),
      porcentajeAvance: 50,
      abogadoId: abogado1.id,
      clienteId: cliente3.id,
    },
    {
      numero: "CASO-2024-004",
      titulo: "Accidente de Tránsito",
      descripcion: "Reclamo por daños y perjuicios por accidente vehicular.",
      tipo: "civil",
      estado: "cerrado",
      fechaInicio: new Date("2023-11-10"),
      fechaCierre: new Date("2024-03-10"),
      porcentajeAvance: 100,
      abogadoId: abogado3.id,
      clienteId: cliente4.id,
    },
    {
      numero: "CASO-2024-005",
      titulo: "Contrato Inmobiliario",
      descripcion: "Asesoramiento en compraventa de propiedad.",
      tipo: "comercial",
      estado: "en_proceso",
      fechaInicio: new Date("2024-03-01"),
      fechaCierre: new Date("2024-05-01"),
      porcentajeAvance: 80,
      abogadoId: abogado2.id,
      clienteId: cliente1.id,
    },
    {
      numero: "CASO-2024-006",
      titulo: "Mediación Familiar",
      descripcion: "Proceso de mediación por régimen de visitas.",
      tipo: "familia",
      estado: "abierto",
      fechaInicio: new Date("2024-03-15"),
      fechaCierre: new Date("2024-07-15"),
      porcentajeAvance: 20,
      abogadoId: abogado1.id,
      clienteId: cliente2.id,
    },
  ]

  for (const casoData of casos) {
    await prisma.caso.create({
      data: casoData,
    })
  }

  console.log("📁 Casos creados")
  console.log("✅ Seed completado exitosamente!")

  console.log("\n🔑 Credenciales de prueba:")
  console.log("Admin: admin@estudio.com / 123456")
  console.log("Abogados: maria.gonzalez@estudio.com / 123456")
  console.log("Clientes: pedro.garcia@email.com / 123456")
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
