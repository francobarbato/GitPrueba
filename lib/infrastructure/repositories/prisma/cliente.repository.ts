// /lib/infrastructure/repositories/prisma/cliente.repository.ts

import { prisma } from "@/lib/db/prisma"
import type { IClienteRepository } from "@/lib/domain/repositories/cliente.repository"
import type { Cliente, CrearClienteDto, ActualizarClienteDto } from "@/lib/types"

export class PrismaClienteRepository implements IClienteRepository {
    async obtenerTodos(filtros?: any): Promise<Cliente[]> {
        const where: any = {}

        if (filtros?.estado) {
            where.estado = filtros.estado
        }

        if (filtros?.tipoDocumento) {
            where.tipoDocumento = filtros.tipoDocumento
        }

        if (filtros?.buscar) {
            where.OR = [
                { nombre: { contains: filtros.buscar, mode: "insensitive" } },
                { apellido: { contains: filtros.buscar, mode: "insensitive" } },
                { email: { contains: filtros.buscar, mode: "insensitive" } },
                { numeroDocumento: { contains: filtros.buscar, mode: "insensitive" } },
            ]
        }

        // === CAMBIO CLAVE: Usamos prisma.cliente y ya no filtramos por rol ===
        return (await prisma.cliente.findMany({
            where, // Aquí se usan los filtros
            orderBy: {
                createdAt: "desc",
            },
        })) as Cliente[]
    }

    async obtenerPorId(id: number): Promise<Cliente | null> {
        // === CAMBIO CLAVE: Usamos prisma.cliente ===
        return (await prisma.cliente.findUnique({
            where: { id },
        })) as Cliente | null
    }

    // **MÉTODO CREAR (LIMPIO Y CORREGIDO)**
    async crear(datos: CrearClienteDto): Promise<Cliente> {
        const { 
            nombre, 
            apellido, 
            email, 
            numeroDocumento, 
            tipoDocumento, 
            direccion, 
            telefono, 
            estado 
        } = datos;

        const numeroDocumentoString = numeroDocumento ? String(numeroDocumento) : undefined;

        // === CAMBIO CLAVE: Ahora creamos en la nueva tabla 'cliente' ===
        return (await prisma.cliente.create({
            data: {
                nombre,
                apellido,
                email,
                numeroDocumento: numeroDocumentoString,
                tipoDocumento, 
                direccion,
                telefono,
                estado,
                // ¡Ya no se necesitan rol ni password!
            },
        })) as Cliente
    }

    // **MÉTODO ACTUALIZAR (CORREGIDO Y FILTRADO)**
    async actualizar(id: number, datos: ActualizarClienteDto): Promise<Cliente> {
        // Filtramos los campos undefined/nulos para que Prisma no se queje
        const datosActualizables = {
            nombre: datos.nombre,
            apellido: datos.apellido,
            email: datos.email,
            numeroDocumento: datos.numeroDocumento,
            tipoDocumento: datos.tipoDocumento,
            direccion: datos.direccion,
            telefono: datos.telefono,
            estado: datos.estado,
        };

        // Eliminamos las propiedades que tengan valor 'undefined' para que Prisma las ignore
        const datosValidos = Object.fromEntries(
            Object.entries(datosActualizables).filter(([, value]) => value !== undefined)
        );

        // === CAMBIO CLAVE: Usamos prisma.cliente ===
        return (await prisma.cliente.update({
            where: { id },
            data: datosValidos,
        })) as Cliente
    }

    async eliminar(id: number): Promise<void> {
        // === CAMBIO CLAVE: Usamos prisma.cliente ===
        await prisma.cliente.delete({
            where: { id },
        })
    }

    async verificarEmailExistente(email: string, idExcluir?: number): Promise<boolean> {
        // === CAMBIO CLAVE: Buscamos en la nueva tabla 'cliente' ===
        const cliente = await prisma.cliente.findFirst({
            where: {
                email,
                ...(idExcluir && { id: { not: idExcluir } }),
            },
        })
        return !!cliente
    }

    async contarTotal(): Promise<number> {
        // === CAMBIO CLAVE: Contamos en la nueva tabla 'cliente' ===
        return await prisma.cliente.count({})
    }
}