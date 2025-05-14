"use client"

import { Bell, Menu, User } from 'lucide-react'
import { useState } from "react"

export function Header() {
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-6">
      <button 
        className="lg:hidden" 
        onClick={() => setShowMobileMenu(!showMobileMenu)}
      >
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle menu</span>
      </button>
      
      <h1 className="text-xl font-semibold">Sistema de Gestión Legal</h1>
      
      <div className="ml-auto flex items-center gap-4">
        <button className="rounded-full bg-gray-100 p-2">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificaciones</span>
        </button>
        
        <button className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm">
          <User className="h-4 w-4" />
          <span>Mi Perfil</span>
        </button>
      </div>
    </header>
  )
}