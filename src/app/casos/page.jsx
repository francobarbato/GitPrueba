import Link from "next/link";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";

// Esta función se ejecutará en el servidor
async function getCasos() {
  // En un entorno real, esto vendría de una API o directamente de la base de datos
  // Por ahora, usaremos datos estáticos
  return [
    {
      id: 1,
      numero: "2023-001",
      titulo: "Despido injustificado",
      tipo: "laboral",
      estado: "abierto",
      fechaInicio: "15/01/2023",
      cliente: "Carlos Rodríguez",
      abogado: "Juan Pérez"
    },
    {
      id: 2,
      numero: "2023-002",
      titulo: "Divorcio contencioso",
      tipo: "familia",
      estado: "en_proceso",
      fechaInicio: "20/02/2023",
      cliente: "Ana López",
      abogado: "María González"
    },
    {
      id: 3,
      numero: "2023-003",
      titulo: "Incumplimiento de contrato",
      tipo: "comercial",
      estado: "abierto",
      fechaInicio: "10/03/2023",
      cliente: "Ana López",
      abogado: "Juan Pérez"
    }
  ];
}

// Componente para mostrar el estado del caso
function EstadoCaso({ estado }) {
  const getColor = () => {
    switch (estado) {
      case "abierto":
        return "bg-green-100 text-green-800";
      case "en_proceso":
        return "bg-blue-100 text-blue-800";
      case "cerrado":
        return "bg-gray-100 text-gray-800";
      case "archivado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getColor()}`}>
      {estado === "en_proceso" ? "En proceso" : estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
}

export default async function CasosPage() {
  const casos = await getCasos();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Gestión de Casos</h2>
              <p className="text-gray-500">Administra los casos legales activos</p>
            </div>
            <Link 
              href="/casos/nuevo" 
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Nuevo Caso
            </Link>
          </div>

          <div className="rounded-md border">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Número
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Título
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Tipo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Fecha Inicio
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Cliente
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Abogado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {casos.map((caso) => (
                    <tr key={caso.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {caso.numero}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {caso.titulo}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {caso.tipo.charAt(0).toUpperCase() + caso.tipo.slice(1)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        <EstadoCaso estado={caso.estado} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {caso.fechaInicio}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {caso.cliente}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {caso.abogado}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                        <Link href={`/casos/${caso.id}`} className="text-blue-600 hover:text-blue-900">
                          Ver
                        </Link>
                        {" | "}
                        <Link href={`/casos/${caso.id}/editar`} className="text-blue-600 hover:text-blue-900">
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
