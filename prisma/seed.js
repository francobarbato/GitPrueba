const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed...");

  // LIMPIAR BD COMPLETA
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.caso.deleteMany();
  await prisma.cliente.deleteMany();
  await prisma.user.deleteMany();

  console.log("🗑️ Tablas limpiadas");

  const password = await bcrypt.hash("123456", 10);

  // ============================================================
  // ADMIN
  // ============================================================
  const admin = await prisma.user.create({
    data: {
      nombre: "Administrador",
      apellido: "General",
      email: "admin@estudio.com",
      password,
      rol: "admin",
      isActive: true,
    },
  });

  console.log("👑 Admin creado:", admin.email);

  // ============================================================
  // ABOGADO DE PRUEBA
  // ============================================================
  const abogado = await prisma.user.create({
    data: {
      nombre: "María",
      apellido: "González",
      email: "maria@estudio.com",
      password,
      rol: "abogado",
      isActive: true,
    },
  });

  console.log("⚖️ Abogado creado:", abogado.email);

  // ============================================================
  // CLIENTES DEL ABOGADO
  // ============================================================

  const cliente1 = await prisma.cliente.create({
    data: {
      nombre: "Ana",
      apellido: "Pérez",
      email: "ana.perez@gmail.com",
      tipoDocumento: "DNI",
      numeroDocumento: "12345678",
      telefono: "3512345678",
      abogadoId: abogado.id,
    },
  });

  const cliente2 = await prisma.cliente.create({
    data: {
      nombre: "Luis",
      apellido: "Ramírez",
      email: "luis.ramirez@gmail.com",
      tipoDocumento: "DNI",
      numeroDocumento: "34567891",
      telefono: "3512341111",
      abogadoId: abogado.id,
    },
  });

  console.log("🧑‍💼 Clientes creados");

  // ============================================================
  // CASOS DEL ABOGADO
  // ============================================================

  await prisma.caso.create({
    data: {
      numero: "EXP-001",
      titulo: "Despido sin causa",
      descripcion: "Cliente despedido sin causa",
      tipo: "Laboral",
      estado: "En proceso",
      fechaInicio: new Date("2024-01-10"),
      abogadoId: abogado.id,
      clienteId: cliente1.id,
    },
  });

  console.log("📂 Casos creados");

  console.log("✅ Seed completado");

  console.log(`
Credenciales:
--------------------------------
Admin:
  - admin@estudio.com / 123456
Abogado:
  - maria@estudio.com / 123456
`);
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
