"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, Calendar, FileCheck, Calculator, UserPlus, Users, BarChart3, LogOut, PieChart } from 'lucide-react'

const menuItems = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Gestión de Casos", href: "/casos", icon: FileText },
  { name: "Reportes", href: "/dashboard", icon: PieChart }, 
  { name: "Seguimiento y Plazos", href: "/seguimiento", icon: Calendar },
  { name: "Plantillas de Documentos", href: "/plantillas", icon: FileCheck },
  { name: "Cálculos de Indemnización", href: "/indemnizaciones", icon: Calculator },
  { name: "Formulario de Toma de Casos", href: "/formulario-casos", icon: UserPlus },
  { name: "Gestión de Clientes", href: "/clientes", icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 border-r bg-gray-50 lg:block">
      <div className="flex h-16 items-center border-b px-6">
        <h2 className="text-lg font-semibold">Estudio Jurídico</h2>
      </div>
      <nav className="flex flex-col gap-2 p-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 transition-colors ${
                isActive 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          )
        })}
        <div className="mt-auto pt-4">
          <button className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-gray-700 hover:bg-gray-100">
            <LogOut className="h-4 w-4" />
            Cerrar Sesión
          </button>
        </div>
      </nav>
    </aside>
  )
}