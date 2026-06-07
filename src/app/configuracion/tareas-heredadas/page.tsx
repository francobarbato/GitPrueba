// // src/app/configuracion/tareas-heredadas/page.tsx

// import { redirect, notFound } from "next/navigation"
// import Link from "next/link"
// import { getUserSessionServer } from "@/auth/actions/auth-actions"
// import { Sidebar } from "@/app/components/sidebar"
// import { Header } from "@/app/components/header"
// import { ArrowLeft, Inbox } from "lucide-react"
// import {
//   getTareasHeredadasAdmin,
//   getUsuariosParaDelegar,
// } from "src/lib/actions/tareas-heredadas-actions"
// import { TareasHeredadasView } from "src/app/components/TareasHeredadasView"

// export const dynamic = 'force-dynamic'

// export default async function TareasHeredadasPage() {
//   const user = await getUserSessionServer()
//   if (!user) redirect("/api/auth/signin")

//   // Solo admin entra acá
//   if (user.rol?.toUpperCase() !== 'ADMIN') notFound()

//   const [tareasResult, usuariosResult] = await Promise.all([
//     getTareasHeredadasAdmin(),
//     getUsuariosParaDelegar(),
//   ])

//   return (
//     <div className="flex h-screen bg-gray-50">
//       <Sidebar />

//       <div className="flex flex-col flex-1 overflow-hidden">
//         <Header />

//         <main className="flex-1 overflow-auto p-6">
//           <div className="max-w-6xl mx-auto">

//             {/* Breadcrumb */}
//             <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
//               <Link href="/configuracion" className="flex items-center gap-1 hover:text-slate-800 transition-colors">
//                 <ArrowLeft className="h-4 w-4" />
//                 Configuración
//               </Link>
//               <span>/</span>
//               <span className="text-slate-800 font-medium">Eventos heredados</span>
//             </nav>

//             {/* Header */}
//             <div className="mb-6 flex items-start gap-3">
//               <div className="p-3 bg-amber-100 rounded-lg text-amber-700">
//                 <Inbox className="w-6 h-6" />
//               </div>
//               <div>
//                 <h1 className="text-2xl font-bold text-slate-800">Eventos heredados</h1>
//                 <p className="text-slate-500 mt-0.5 text-sm">
//                   Eventos que quedaron asignados al administrador como fallback al desactivar usuarios.
//                   Delegalos a un abogado o asistente, o ciérralos si ya no aplican.
//                 </p>
//               </div>
//             </div>

//             <TareasHeredadasView
//               tareas={tareasResult.tareas ?? []}
//               usuarios={usuariosResult.usuarios ?? []}
//               errorCarga={tareasResult.error ?? usuariosResult.error ?? null}
//             />
//           </div>
//         </main>
//       </div>
//     </div>
//   )
// }