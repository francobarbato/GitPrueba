import { getUserSessionServer } from "@/auth/actions/auth-actions"
import { redirect } from "next/navigation"
import prisma from "src/lib/db/prisma"
import { TareasView } from "./components/tareas-view" 
import { Sidebar } from "@/app/components/sidebar"
import { Header } from "@/app/components/header"

export default async function GestionTareasPage() {
  const user = await getUserSessionServer()
  if (!user) redirect("/api/auth/signin")

  // 1. Obtener Tareas
  const tareas = await prisma.tarea.findMany({
    where: { usuarioId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { caso: { select: { titulo: true } } } 
  })

  // 2. Obtener Casos (Para el select)
  const casos = await prisma.caso.findMany({
    where: { abogadoId: user.id },
    select: { id: true, titulo: true }
  })

  // 3. NUEVO: Obtener Bitácora Real
  const bitacora = await prisma.bitacora.findMany({
    // Traemos mensajes míos O mensajes automáticos generales (si quisieras)
    // Por ahora solo los míos para probar
    where: { usuarioId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 20, // Últimos 20 mensajes
    include: { usuario: { select: { nombre: true, apellido: true } } }
  })

  // Formatear para la vista
  const feedInicial = bitacora.map(b => ({
    id: b.id, // Usamos el ID real string
    autor: `${b.usuario.nombre} ${b.usuario.apellido}`,
    tipo: b.tipo,
    texto: b.texto,
    tiempo: b.createdAt.toLocaleDateString() + ' ' + b.createdAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
  }))

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
            <TareasView 
                initialTareas={tareas} 
                casosDisponibles={casos} 
                initialFeed={feedInicial} // Pasamos el feed real
                userNombre={user.nombre || "Abogado"}
            />
        </main>
      </div>
    </div>
  )
}