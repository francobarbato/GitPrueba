import Link from "next/link";
import { Sidebar } from "../../components/sidebar";
import { Header } from "../../components/header";

// Esta función se ejecutará en el servidor
async function getCasoById(id) {
  // En un entorno real, esto vendría de una API o directamente de la base de datos
  // Por ahora, usaremos datos estáticos
  const casos = [
    {
      id: 1,
      numero: "2023-001",
      titulo: "Despido injustificado",
      descripcion: "Caso de despido sin causa justificada de un empleado con 5 años de antigüedad.",
      tipo: "laboral",
      estado: "abierto",
      fechaInicio: "15/01/2023",
      fechaCierre: null,
      cliente: {
        nombre: "Carlos",
        apellido: "Rodríguez",
        email: "carlos@example.com",
        telefono: "11-1234-5678"
      },
      abogado: {
        nombre: "Juan",
        apellido: "Pérez",
        email: "juan@example.com"
      },
      documentos: [
        { id: 1, nombre: "Demanda inicial", tipo: "demanda", fecha: "15/01/2023", estado: "completado" },
        { id: 2, nombre: "Contestación demanda", tipo: "contestacion", fecha: "30/01/2023", estado: "pendiente" }
      ],
      actualizaciones: [
        { id: 1, descripcion: "Se presentó la demanda inicial", fecha: "15/01/2023", usuario: "Juan Pérez" },
        { id: 2, descripcion: "Se fijó fecha para audiencia preliminar", fecha: "01/02/2023", usuario: "Juan Pérez" }
      ],
      alertas: [
        { id: 1, titulo: "Audiencia preliminar", fecha: "15/03/2023", prioridad: "alta", estado: "pendiente" }
      ]
    },
    {
      id: 2,
      numero: "2023-002",
      titulo: "Divorcio contencioso",
      descripcion: "Proceso de divorcio con disputa de bienes y custodia de hijos.",
      tipo: "familia",
      estado: "en_proceso",
      fechaInicio: "20/02/2023",
      fechaCierre: null,
      cliente: {
        nombre: "Ana",
        apellido: "López",
        email: "ana@example.com",
        telefono: "11-8765-4321"
      },
      abogado: {
        nombre: "María",
        apellido: "González",
        email: "maria@example.com"
      },
      documentos: [
        { id: 3, nombre: "Demanda de divorcio", tipo: "demanda", fecha: "20/02/2023", estado: "completado" }
      ],
      actualizaciones: [
        { id: 3, descripcion: "Se presentó la demanda de divorcio", fecha: "20/02/2023", usuario: "María González" }
      ],
      alertas: [
        { id: 2, titulo: "Audiencia de conciliación", fecha: "25/03/2023", prioridad: "media", estado: "pendiente" }
      ]
    },
    {
      id: 3,
      numero: "2023-003",
      titulo: "Incumplimiento de contrato",
      descripcion: "Demanda por incumplimiento de contrato comercial entre empresas.",
      tipo: "comercial",
      estado: "abierto",
      fechaInicio: "10/03/2023",
      fechaCierre: null,
      cliente: {
        nombre: "Ana",
        apellido: "López",
        email: "ana@example.com",
        telefono: "11-8765-4321"
      },
      abogado: {
        nombre: "Juan",
        apellido: "Pérez",
        email: "juan@example.com"
      },
      documentos: [
        { id: 4, nombre: "Contrato comercial", tipo: "contrato", fecha: "01/01/2023", estado: "completado" },
        { id: 5, nombre: "Demanda por incumplimiento", tipo: "demanda", fecha: "10/03/2023", estado: "completado" }
      ],
      actualizaciones: [
        { id: 4, descripcion: "Se presentó la demanda por incumplimiento", fecha: "10/03/2023", usuario: "Juan Pérez" }
      ],
      alertas: [
        { id: 3, titulo: "Presentación de pruebas", fecha: "05/04/2023", prioridad: "media", estado: "pendiente" }
      ]
    }
  ];

  return casos.find(caso => caso.id === parseInt(id)) || null;
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

// Componente para mostrar la prioridad de una alerta
function PrioridadAlerta({ prioridad }) {
  const getColor = () => {
    switch (prioridad) {
      case "alta":
        return "bg-red-100 text-red-800";
      case "media":
        return "bg-yellow-100 text-yellow-800";
      case "baja":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getColor()}`}>
      {prioridad.charAt(0).toUpperCase() + prioridad.slice(1)}
    </span>
  );
}

export default async function CasoDetailPage({ params }) {
  const caso = await getCasoById(params.id);

  if (!caso) {
    return (
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6">
            <div className="rounded-md border bg-red-50 p-4 text-red-800">
              <h2 className="text-xl font-bold">Error</h2>
              <p>El caso solicitado no existe.</p>
              <Link href="/casos" className="mt-4 inline-block text-blue-600 hover:underline">
                Volver a la lista de casos
              </Link>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{caso.titulo}</h2>
                <EstadoCaso estado={caso.estado} />
              </div>
              <p className="text-gray-500">Caso #{caso.numero}</p>
            </div>
            <div className="flex gap-2">
              <Link 
                href={`/casos/${caso.id}/editar`} 
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Editar Caso
              </Link>
              <button 
                className="rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                Cerrar Caso
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Información general */}
            <div className="col-span-2 rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium">Información General</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-500">Tipo de caso</p>
                  <p>{caso.tipo.charAt(0).toUpperCase() + caso.tipo.slice(1)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Estado</p>
                  <EstadoCaso estado={caso.estado} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de inicio</p>
                  <p>{caso.fechaInicio}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fecha de cierre</p>
                  <p>{caso.fechaCierre || "No cerrado"}</p>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-500">Descripción</p>
                <p className="mt-1">{caso.descripcion}</p>
              </div>
            </div>

            {/* Información del cliente */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium">Cliente</h3>
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre</p>
                <p>{`${caso.cliente.nombre} ${caso.cliente.apellido}`}</p>
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{caso.cliente.email}</p>
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-500">Teléfono</p>
                <p>{caso.cliente.telefono}</p>
              </div>
              <div className="mt-4">
                <Link 
                  href={`/clientes/${caso.cliente.id}`} 
                  className="text-sm text-blue-600 hover:underline"
                >
                  Ver perfil completo
                </Link>
              </div>
            </div>

            {/* Abogado asignado */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-medium">Abogado Asignado</h3>
              <div>
                <p className="text-sm font-medium text-gray-500">Nombre</p>
                <p>{`${caso.abogado.nombre} ${caso.abogado.apellido}`}</p>
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-500">Email</p>
                <p>{caso.abogado.email}</p>
              </div>
            </div>

            {/* Documentos */}
            <div className="col-span-2 rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Documentos</h3>
                <button className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700">
                  Añadir Documento
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Nombre
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Tipo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Estado
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {caso.documentos.map((doc) => (
                      <tr key={doc.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {doc.nombre}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {doc.tipo.charAt(0).toUpperCase() + doc.tipo.slice(1)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {doc.fecha}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {doc.estado.charAt(0).toUpperCase() + doc.estado.slice(1)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                          <a href="#" className="text-blue-600 hover:text-blue-900">
                            Ver
                          </a>
                          {" | "}
                          <a href="#" className="text-blue-600 hover:text-blue-900">
                            Descargar
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alertas */}
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Alertas</h3>
                <button className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700">
                  Nueva Alerta
                </button>
              </div>
              <div className="space-y-4">
                {caso.alertas.map((alerta) => (
                  <div key={alerta.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{alerta.titulo}</h4>
                      <PrioridadAlerta prioridad={alerta.prioridad} />
                    </div>
                    <p className="mt-1 text-sm text-gray-500">Fecha: {alerta.fecha}</p>
                    <p className="text-sm text-gray-500">Estado: {alerta.estado.charAt(0).toUpperCase() + alerta.estado.slice(1)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actualizaciones */}
            <div className="col-span-3 rounded-lg border bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-medium">Actualizaciones</h3>
                <button className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700">
                  Nueva Actualización
                </button>
              </div>
              <div className="space-y-4">
                {caso.actualizaciones.map((act) => (
                  <div key={act.id} className="rounded-md border-l-4 border-blue-500 bg-blue-50 p-4">
                    <p>{act.descripcion}</p>
                    <p className="mt-1 text-sm text-gray-500">
                      {act.fecha} - {act.usuario}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}