import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Calendar, ChevronRight, CheckCircle2, Siren, Zap } from "lucide-react"
import Link from "next/link"

interface AlertProps {
    data: {
        id: string;
        abogado: string;
        mensaje: string;
        subtitulo: string;
        tiempo: string;
        gravedad: string;
        tipo: string;
        link: string;
    }[]
}

export function InactivityAlerts({ data }: AlertProps) {
  return (
    <Card className="shadow-md border-slate-200 bg-white h-full">
      <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-white pb-4">
        <div className="flex items-center gap-2 text-slate-800">
          <Siren className="w-5 h-5 text-red-600" />
          <CardTitle className="text-lg font-bold">Ranking de Prioridades</CardTitle>
        </div>
        <p className="text-sm text-slate-500">
          Tareas ordenadas por urgencia e importancia del caso.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {data.length === 0 ? (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-48">
                <CheckCircle2 className="w-12 h-12 mb-3 text-green-500" />
                <p className="font-medium text-slate-800 text-lg">¡Bandeja Limpia!</p>
                <p className="text-sm">Estás al día con todas las prioridades.</p>
            </div>
          ) : (
            data.map((item, index) => (
            <Link href={item.link} key={item.id}>
                <div className="flex items-start p-4 hover:bg-slate-50 transition group cursor-pointer relative">
                  
                  {/* Número de Ranking (1, 2, 3...) */}
                  <div className="absolute left-1 top-4 text-[10px] font-black text-slate-200 w-4 text-center">
                    {index + 1}
                  </div>

                  {/* Icono según Tipo */}
                  <div className={`mt-1 p-2 rounded-full mr-3 flex-shrink-0 z-10
                    ${item.gravedad === 'Critico' 
                        ? 'bg-red-50 text-red-600 border border-red-100' 
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                     {item.tipo === 'Vencido' ? <AlertCircle className="w-4 h-4"/> 
                      : item.tipo === 'Urgente' ? <Zap className="w-4 h-4"/> 
                      : <Calendar className="w-4 h-4"/>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                        {/* Badges de Estado */}
                        <div className="flex gap-2">
                             {item.tipo === 'Vencido' && <Badge variant="destructive" className="h-4 text-[9px] px-1">VENCIDO</Badge>}
                             {item.tipo === 'Urgente' && <Badge className="h-4 text-[9px] px-1 bg-orange-500 hover:bg-orange-600">URGENTE</Badge>}
                             {item.tipo === 'Abandono' && <Badge variant="secondary" className="h-4 text-[9px] px-1">INACTIVO</Badge>}
                        </div>
                        <span className={`text-xs font-bold ${item.gravedad === 'Critico' ? 'text-red-600' : 'text-slate-500'}`}>
                            {item.tiempo}
                        </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 line-clamp-1">
                        {item.mensaje}
                    </p>
                    
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                       {item.subtitulo} • <span className="text-blue-600 font-medium">{item.abogado}</span>
                    </p>
                  </div>

                  <div className="ml-2 self-center text-slate-300 group-hover:text-blue-600 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>

                </div>
            </Link>
          )))}
        </div>
      </CardContent>
    </Card>
  )
}