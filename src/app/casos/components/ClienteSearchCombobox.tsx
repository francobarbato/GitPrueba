'use client'

import { useState } from "react"
import { Check, ChevronsUpDown, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "../../../components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "../../../lib/utils"
import Link from "next/link"

type Cliente = {
  id: string
  nombre: string
  apellido: string | null
  numeroDocumento: string
}

export function ClienteSearchCombobox({ 
  clientes, 
  onSelect,
  defaultValue 
}: { 
  clientes: Cliente[]
  onSelect: (clienteId: string) => void
  defaultValue?: string 
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(defaultValue || "")

  const clienteSeleccionado = clientes.find((c) => c.id === value)

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="flex-1 justify-between"
          >
            {clienteSeleccionado
              ? `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido || ''} (${clienteSeleccionado.numeroDocumento})`
              : "Buscar cliente por DNI/Nombre..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0">
          <Command>
            <CommandInput placeholder="Escriba DNI o nombre..." />
            <CommandEmpty>
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-3">Cliente no encontrado</p>
                <Link href="/clientes/nuevo">
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear Cliente Nuevo
                  </Button>
                </Link>
              </div>
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {clientes.map((cliente) => (
                <CommandItem
                  key={cliente.id}
                  value={`${cliente.nombre} ${cliente.apellido || ''} ${cliente.numeroDocumento}`}
                  onSelect={() => {
                    setValue(cliente.id)
                    onSelect(cliente.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === cliente.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {cliente.nombre} {cliente.apellido || ''}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      DNI: {cliente.numeroDocumento}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      
      <Link href="/clientes/nuevo">
        <Button variant="outline" size="icon" title="Crear cliente nuevo">
          <UserPlus className="h-4 w-4" />
        </Button>
      </Link>
      
      {/* Input oculto para el form */}
      <input type="hidden" name="clienteId" value={value} />
    </div>
  )
}