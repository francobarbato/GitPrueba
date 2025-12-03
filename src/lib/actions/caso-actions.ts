// 'use server'

// import { getUserSessionServer } from "@/auth/actions/auth-actions"
// import { CasoService } from "@/lib/aplication/services/caso.service"
// import { revalidatePath } from "next/cache"
// import { redirect } from "next/navigation"

// const casoService = new CasoService()

// export type State = {
//   error?: string | null
//   message?: string | null
// }

// export async function crearCasoAction(prevState: State, formData: FormData): Promise<State> {
//   const user = await getUserSessionServer()
  
//   if (!user || !user.id) {
//     return { error: "No autorizado" }
//   }

//   const rawData = {
//     numero: formData.get("numero") as string, // Ej: EXP-2024-001
//     titulo: formData.get("titulo") as string,
//     descripcion: formData.get("descripcion") as string,
//     tipo: formData.get("tipo") as string, // Laboral, Penal, etc.
//     clienteId: formData.get("clienteId") as string, // ID del cliente seleccionado
//   }

//   // Validaciones básicas
//   if (!rawData.clienteId) {
//     return { error: "Debes seleccionar un cliente" }
//   }

//   try {
//     await casoService.createCaso(rawData, user.id)
//   } catch (error: any) {
//     console.error("Error creando caso:", error)
//     // Manejo de error de duplicados (ej: número de expediente)
//     if (error.code === 'P2002') {
//         return { error: "El número de expediente ya existe." }
//     }
//     return { error: "Error al crear el caso. Intenta nuevamente." }
//   }

//   revalidatePath("/casos")
//   redirect("/casos")
// }