import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BarChart } from "lucide-react"

// Definimos la estructura de datos
interface WorkloadProps {
    data: {
        id: string;
        nombre: string;
        email: string;
        activos: number;
        enProceso: number;
        eficiencia: number;
        estadoCarga: string;
    }[]
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Libre': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'Ocupado': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'Saturado': return 'bg-rose-100 text-rose-700 border-rose-200'
    default: return 'bg-slate-100 text-slate-700'
  }
}

export function WorkloadTable({ data }: WorkloadProps) {
  return (
    <Card className="shadow-md border-slate-200 overflow-hidden">
      <CardHeader className="border-b bg-white pb-4">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <BarChart className="w-5 h-5" />
            </div>
            <div>
                <CardTitle className="text-lg font-bold text-slate-800">
                Crga de abogados y eficiencia
                </CardTitle>
                <CardDescription>
                Monitor en tiempo real para la asignación inteligente de casos.
                </CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b font-semibold">
              <tr>
                <th className="px-6 py-4">Abogado</th>
                <th className="px-6 py-4 text-center">Carga Activa</th>
                <th className="px-6 py-4 text-center">En Proceso</th>
                <th className="px-6 py-4 text-center">Resolución Histórica</th>
                <th className="px-6 py-4 text-center">Estado Operativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((abogado) => (
                <tr key={abogado.id} className="hover:bg-slate-50 transition duration-150">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{abogado.nombre}</div>
                    <div className="text-xs text-slate-500">{abogado.email}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-slate-700">{abogado.activos}</span>
                    <span className="text-xs text-slate-400 ml-1">casos</span>
                  </td>
                  <td className="px-6 py-4 text-center text-slate-600 font-medium">
                    {abogado.enProceso}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-center gap-1">
                        <div className="w-full max-w-[100px] bg-slate-100 rounded-full h-2">
                            <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500" 
                            style={{ width: `${abogado.eficiencia}%` }}
                            ></div>
                        </div>
                        <span className="text-xs font-medium text-slate-500">
                            {abogado.eficiencia}% Cerrados
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(abogado.estadoCarga)}`}>
                      {abogado.estadoCarga.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}