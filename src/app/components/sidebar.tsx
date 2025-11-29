"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FileText, PieChart, Users, Calendar, FileCheck, Calculator, UserPlus, Home, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "../../components/ui/sheet"
import { useState } from "react"

const menuItems = [
  { name: "Inicio", href: "/", icon: Home },
  { name: "Reportes Power BI", href: "/reportes", icon: PieChart },
  { name: "Gestión de casos", href: "/casos", icon: FileText },
  { name: "Gestión de clientes", href: "/clientes", icon: Users },
  { name: "Seguimiento y plazos", href: "/seguimiento-plazos", icon: Calendar },
  { name: "Plantillas de documentos", href: "/plantilla-documentos", icon: FileCheck },
  { name: "Cálculos de indemnización", href: "/calculos-indemnizacion", icon: Calculator },
  { name: "Formulario de toma de casos", href: "/formulario-toma-casos", icon: UserPlus },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 bg-card border-r min-h-screen flex-col">
        {/* <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Sistema Legval</h2>
          <p className="text-sm text-muted-foreground">Gestión de Casos</p>
        </div> */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
        <div className="p-4 border-t">
          <div className="text-xs text-muted-foreground">
            <p>v1.0.0</p>
            <p>© 2025 Estudio Jurídico</p>
          </div>
        </div>
      </aside>
    </>
  )
}

export function MobileSidebar() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Abrir menú</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Sistema Legal</h2>
          <p className="text-sm text-muted-foreground">Gestión de Casos</p>
        </div>
        <nav className="p-4">
          <div className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
