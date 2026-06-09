-- CreateEnum
CREATE TYPE "TipoLiquidacion" AS ENUM ('DESPIDO', 'LRT', 'CAPITALIZACION');

-- CreateEnum
CREATE TYPE "MotivoCierreAdmin" AS ENUM ('TRASPASO_ABOGADO', 'TRASPASO_EXPEDIENTE');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('HIGH', 'NORMAL', 'LOW');

-- CreateEnum
CREATE TYPE "TipoPersona" AS ENUM ('FISICA', 'JURIDICA');

-- CreateEnum
CREATE TYPE "TipoDocumento" AS ENUM ('DNI', 'CUIT', 'CUIL', 'PASAPORTE', 'OTRO');

-- CreateEnum
CREATE TYPE "CondicionIVA" AS ENUM ('RESPONSABLE_INSCRIPTO', 'MONOTRIBUTISTA', 'EXENTO', 'CONSUMIDOR_FINAL', 'NO_CATEGORIZADO');

-- CreateEnum
CREATE TYPE "TipoCaso" AS ENUM ('LABORAL', 'CIVIL_COMERCIAL', 'FAMILIA', 'PENAL', 'SUCESIONES', 'CONTENCIOSO_ADMINISTRATIVO', 'OTRO');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'ABOGADO', 'ASISTENTE', 'CLIENTE');

-- CreateEnum
CREATE TYPE "TipoTarea" AS ENUM ('PROCESAL', 'INTERNA');

-- CreateEnum
CREATE TYPE "CategoriaTarea" AS ENUM ('PRESENTACION_ESCRITO', 'AUDIENCIA', 'NOTIFICACION_CEDULA', 'CONTROL_EXPEDIENTE', 'APELACION_RECURSO', 'PERICIA_PRUEBA', 'REUNION_CLIENTE', 'REDACCION_DOCUMENTACION', 'TRAMITE_ADMINISTRATIVO', 'REQUERIMIENTO_CLIENTE', 'GESTION_FINANCIERA', 'REUNION_EQUIPO', 'VENCIMIENTO_PLAZO');

-- CreateEnum
CREATE TYPE "AmbitoTarea" AS ENUM ('INTERNO', 'EXTERNO');

-- CreateEnum
CREATE TYPE "PrioridadTarea" AS ENUM ('BAJA', 'MEDIA', 'ALTA', 'FATAL');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'BLOQUEADA', 'COMPLETADA', 'VENCIDA');

-- CreateTable
CREATE TABLE "usuario" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nombre" TEXT,
    "apellido" TEXT,
    "password" TEXT,
    "rol" "UserRole" NOT NULL DEFAULT 'ABOGADO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "name" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "creadoPor" TEXT,
    "debeResetearPassword" BOOLEAN NOT NULL DEFAULT false,
    "ultimoAcceso" TIMESTAMP(3),
    "ultimoAccesoTareas" TIMESTAMP(3),
    "ultimoAccesoComentarios" TIMESTAMP(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "email" TEXT,
    "numeroDocumento" TEXT NOT NULL,
    "tipoDocumento" "TipoDocumento" NOT NULL DEFAULT 'DNI',
    "direccion" TEXT,
    "telefono" TEXT,
    "estado" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "abogadoId" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "condicionIva" "CondicionIVA" NOT NULL DEFAULT 'CONSUMIDOR_FINAL',
    "notasInternas" TEXT,
    "tipoPersona" "TipoPersona" NOT NULL DEFAULT 'FISICA',
    "creadoPorId" TEXT,
    "ultimoAccesoPortal" TIMESTAMP(3),
    "usuarioPortalId" TEXT,
    "tipoSociedad" TEXT,
    "representanteNombre" TEXT,
    "representanteDni" TEXT,
    "bienesEmbargables" TEXT,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caso" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "tipo" "TipoCaso" NOT NULL,
    "estado" TEXT NOT NULL,
    "fechaUltimoCambioEstado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "porcentajeAvance" INTEGER NOT NULL DEFAULT 0,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "abogadoId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "priority" "Priority" NOT NULL DEFAULT 'NORMAL',
    "fechaFin" TIMESTAMP(3),
    "contraparteDni" TEXT,
    "contraparteNombre" TEXT,
    "fuero" TEXT,
    "juzgado" TEXT,
    "montoDisputa" DECIMAL(15,2),
    "ubicacionFisica" TEXT,
    "cerradoPorId" TEXT,
    "estaCerrado" BOOLEAN NOT NULL DEFAULT false,
    "estadoAntesCierre" TEXT,
    "fechaCierre" TIMESTAMP(3),
    "montoFinal" DECIMAL(15,2),
    "motivoCierre" TEXT,
    "observacionCierre" TEXT,
    "provincia" TEXT,
    "ciudad" TEXT,
    "esTraspasado" BOOLEAN NOT NULL DEFAULT false,
    "fechaTraspaso" TIMESTAMP(3),
    "estudioDestino" TEXT,
    "motivoTraspaso" TEXT,
    "recibidoEnReasignacion" BOOLEAN NOT NULL DEFAULT false,
    "fechaReasignacion" TIMESTAMP(3),

    CONSTRAINT "caso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "requirement" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "casoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "requirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caso_colaborador" (
    "id" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "permiso" TEXT NOT NULL DEFAULT 'LECTURA',
    "asignadoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "caso_colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contraparte" (
    "id" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "tipoPersona" "TipoPersona" NOT NULL DEFAULT 'FISICA',
    "nombre" TEXT NOT NULL,
    "apellido" TEXT,
    "documento" TEXT,
    "rol" TEXT,
    "domicilio" TEXT,
    "localidad" TEXT,
    "provincia" TEXT,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contraparte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidacion" (
    "id" TEXT NOT NULL,
    "tipo" "TipoLiquidacion" NOT NULL,
    "montoTotal" DECIMAL(15,2) NOT NULL,
    "detalle" JSONB NOT NULL,
    "descripcion" TEXT,
    "casoId" TEXT,
    "creadoPorId" TEXT NOT NULL,
    "eliminadoEn" TIMESTAMP(3),
    "eliminadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarea" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "TipoTarea" NOT NULL DEFAULT 'INTERNA',
    "categoria" "CategoriaTarea" NOT NULL DEFAULT 'REUNION_CLIENTE',
    "ambito" "AmbitoTarea" NOT NULL DEFAULT 'INTERNO',
    "prioridad" "PrioridadTarea" NOT NULL DEFAULT 'MEDIA',
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "motivoBloqueo" TEXT,
    "motivoDesbloqueo" TEXT,
    "fechaVencimiento" TIMESTAMP(3),
    "fechaInicio" TIMESTAMP(3),
    "fechaCompletada" TIMESTAMP(3),
    "lugarFisico" TEXT,
    "visibleCliente" BOOLEAN NOT NULL DEFAULT false,
    "clienteId" TEXT,
    "motivoCierreVencida" TEXT,
    "vencidaCerradaEn" TIMESTAMP(3),
    "vencidaCerradaPorId" TEXT,
    "casoId" TEXT,
    "creadorId" TEXT NOT NULL,
    "responsableId" TEXT NOT NULL,
    "supervisorId" TEXT,
    "motivoCierreAdmin" "MotivoCierreAdmin",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comentario_tarea" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "citaComentarioId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comentario_tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarea_lectura" (
    "userId" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "ultimaLectura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimoUmbralVencimientoVisto" INTEGER,

    CONSTRAINT "tarea_lectura_pkey" PRIMARY KEY ("userId","tareaId")
);

-- CreateTable
CREATE TABLE "bitacora" (
    "id" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'manual',
    "usuarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accion" TEXT,
    "casoId" TEXT,
    "detalle" TEXT,
    "tareaId" TEXT,
    "estadoAnterior" TEXT,
    "estadoNuevo" TEXT,
    "documentoId" TEXT,
    "liquidacionId" TEXT,

    CONSTRAINT "bitacora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documento" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT,
    "tipo" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "tamanio" INTEGER NOT NULL,
    "descripcion" TEXT,
    "esInterno" BOOLEAN NOT NULL DEFAULT false,
    "casoId" TEXT NOT NULL,
    "carpetaId" TEXT,
    "subidoPorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "carpeta" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "casoId" TEXT NOT NULL,
    "carpetaPadreId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "carpeta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pago" (
    "id" TEXT NOT NULL,
    "concepto" TEXT NOT NULL,
    "descripcion" TEXT,
    "monto" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "comprobanteUrl" TEXT,
    "comprobanteTipo" TEXT,
    "montoPagado" DOUBLE PRECISION,
    "fechaPago" TIMESTAMP(3),
    "validadoPor" TEXT,
    "fechaValidacion" TIMESTAMP(3),
    "notaValidacion" TEXT,
    "casoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_activation_token" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_activation_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_token" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_email_key" ON "cliente"("email");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_numeroDocumento_key" ON "cliente"("numeroDocumento");

-- CreateIndex
CREATE UNIQUE INDEX "Cliente_telefono_key" ON "cliente"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_usuarioPortalId_key" ON "cliente"("usuarioPortalId");

-- CreateIndex
CREATE INDEX "cliente_usuarioPortalId_idx" ON "cliente"("usuarioPortalId");

-- CreateIndex
CREATE INDEX "cliente_creadoPorId_idx" ON "cliente"("creadoPorId");

-- CreateIndex
CREATE INDEX "cliente_numeroDocumento_idx" ON "cliente"("numeroDocumento");

-- CreateIndex
CREATE INDEX "cliente_email_idx" ON "cliente"("email");

-- CreateIndex
CREATE INDEX "cliente_abogadoId_idx" ON "cliente"("abogadoId");

-- CreateIndex
CREATE UNIQUE INDEX "Caso_numero_key" ON "caso"("numero");

-- CreateIndex
CREATE INDEX "Caso_abogadoId_fkey" ON "caso"("abogadoId");

-- CreateIndex
CREATE INDEX "Caso_clienteId_fkey" ON "caso"("clienteId");

-- CreateIndex
CREATE INDEX "caso_tipo_idx" ON "caso"("tipo");

-- CreateIndex
CREATE INDEX "caso_estado_idx" ON "caso"("estado");

-- CreateIndex
CREATE INDEX "caso_contraparteDni_idx" ON "caso"("contraparteDni");

-- CreateIndex
CREATE INDEX "caso_fechaUltimoCambioEstado_idx" ON "caso"("fechaUltimoCambioEstado");

-- CreateIndex
CREATE INDEX "requirement_casoId_idx" ON "requirement"("casoId");

-- CreateIndex
CREATE UNIQUE INDEX "caso_colaborador_casoId_userId_key" ON "caso_colaborador"("casoId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "contraparte_casoId_key" ON "contraparte"("casoId");

-- CreateIndex
CREATE INDEX "liquidacion_casoId_idx" ON "liquidacion"("casoId");

-- CreateIndex
CREATE INDEX "liquidacion_tipo_idx" ON "liquidacion"("tipo");

-- CreateIndex
CREATE INDEX "liquidacion_creadoPorId_idx" ON "liquidacion"("creadoPorId");

-- CreateIndex
CREATE INDEX "liquidacion_eliminadoEn_idx" ON "liquidacion"("eliminadoEn");

-- CreateIndex
CREATE INDEX "tarea_casoId_idx" ON "tarea"("casoId");

-- CreateIndex
CREATE INDEX "tarea_clienteId_idx" ON "tarea"("clienteId");

-- CreateIndex
CREATE INDEX "tarea_creadorId_idx" ON "tarea"("creadorId");

-- CreateIndex
CREATE INDEX "tarea_responsableId_idx" ON "tarea"("responsableId");

-- CreateIndex
CREATE INDEX "tarea_supervisorId_idx" ON "tarea"("supervisorId");

-- CreateIndex
CREATE INDEX "tarea_estado_idx" ON "tarea"("estado");

-- CreateIndex
CREATE INDEX "tarea_fechaVencimiento_idx" ON "tarea"("fechaVencimiento");

-- CreateIndex
CREATE INDEX "comentario_tarea_tareaId_idx" ON "comentario_tarea"("tareaId");

-- CreateIndex
CREATE INDEX "comentario_tarea_autorId_idx" ON "comentario_tarea"("autorId");

-- CreateIndex
CREATE INDEX "comentario_tarea_createdAt_idx" ON "comentario_tarea"("createdAt");

-- CreateIndex
CREATE INDEX "tarea_lectura_tareaId_idx" ON "tarea_lectura"("tareaId");

-- CreateIndex
CREATE INDEX "bitacora_usuarioId_idx" ON "bitacora"("usuarioId");

-- CreateIndex
CREATE INDEX "bitacora_tareaId_idx" ON "bitacora"("tareaId");

-- CreateIndex
CREATE INDEX "bitacora_casoId_idx" ON "bitacora"("casoId");

-- CreateIndex
CREATE INDEX "bitacora_createdAt_idx" ON "bitacora"("createdAt");

-- CreateIndex
CREATE INDEX "bitacora_accion_idx" ON "bitacora"("accion");

-- CreateIndex
CREATE INDEX "bitacora_documentoId_idx" ON "bitacora"("documentoId");

-- CreateIndex
CREATE INDEX "bitacora_liquidacionId_idx" ON "bitacora"("liquidacionId");

-- CreateIndex
CREATE INDEX "documento_casoId_idx" ON "documento"("casoId");

-- CreateIndex
CREATE INDEX "documento_subidoPorId_idx" ON "documento"("subidoPorId");

-- CreateIndex
CREATE INDEX "documento_carpetaId_idx" ON "documento"("carpetaId");

-- CreateIndex
CREATE INDEX "carpeta_casoId_idx" ON "carpeta"("casoId");

-- CreateIndex
CREATE INDEX "carpeta_carpetaPadreId_idx" ON "carpeta"("carpetaPadreId");

-- CreateIndex
CREATE INDEX "pago_casoId_idx" ON "pago"("casoId");

-- CreateIndex
CREATE INDEX "pago_estado_idx" ON "pago"("estado");

-- CreateIndex
CREATE INDEX "pago_validadoPor_idx" ON "pago"("validadoPor");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "account_provider_providerAccountId_key" ON "account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_token_token_key" ON "password_reset_token"("token");

-- CreateIndex
CREATE INDEX "password_reset_token_userId_idx" ON "password_reset_token"("userId");

-- CreateIndex
CREATE INDEX "password_reset_token_expiresAt_idx" ON "password_reset_token"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "account_activation_token_token_key" ON "account_activation_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "account_activation_token_userId_key" ON "account_activation_token"("userId");

-- CreateIndex
CREATE INDEX "account_activation_token_expiresAt_idx" ON "account_activation_token"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "session_sessionToken_key" ON "session"("sessionToken");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_token_key" ON "verification_token"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_token_identifier_token_key" ON "verification_token"("identifier", "token");

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_abogadoId_fkey" FOREIGN KEY ("abogadoId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente" ADD CONSTRAINT "cliente_usuarioPortalId_fkey" FOREIGN KEY ("usuarioPortalId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caso" ADD CONSTRAINT "caso_abogadoId_fkey" FOREIGN KEY ("abogadoId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caso" ADD CONSTRAINT "caso_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "requirement" ADD CONSTRAINT "requirement_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caso_colaborador" ADD CONSTRAINT "caso_colaborador_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caso_colaborador" ADD CONSTRAINT "caso_colaborador_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caso_colaborador" ADD CONSTRAINT "caso_colaborador_asignadoPorId_fkey" FOREIGN KEY ("asignadoPorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contraparte" ADD CONSTRAINT "contraparte_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidacion" ADD CONSTRAINT "liquidacion_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "caso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidacion" ADD CONSTRAINT "liquidacion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "liquidacion" ADD CONSTRAINT "liquidacion_eliminadoPorId_fkey" FOREIGN KEY ("eliminadoPorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "caso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea" ADD CONSTRAINT "tarea_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario_tarea" ADD CONSTRAINT "comentario_tarea_citaComentarioId_fkey" FOREIGN KEY ("citaComentarioId") REFERENCES "comentario_tarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario_tarea" ADD CONSTRAINT "comentario_tarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comentario_tarea" ADD CONSTRAINT "comentario_tarea_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_lectura" ADD CONSTRAINT "tarea_lectura_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarea_lectura" ADD CONSTRAINT "tarea_lectura_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "tarea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "documento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bitacora" ADD CONSTRAINT "bitacora_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "liquidacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_carpetaId_fkey" FOREIGN KEY ("carpetaId") REFERENCES "carpeta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documento" ADD CONSTRAINT "documento_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carpeta" ADD CONSTRAINT "carpeta_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "carpeta" ADD CONSTRAINT "carpeta_carpetaPadreId_fkey" FOREIGN KEY ("carpetaPadreId") REFERENCES "carpeta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_casoId_fkey" FOREIGN KEY ("casoId") REFERENCES "caso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pago" ADD CONSTRAINT "pago_validadoPor_fkey" FOREIGN KEY ("validadoPor") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_activation_token" ADD CONSTRAINT "account_activation_token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
