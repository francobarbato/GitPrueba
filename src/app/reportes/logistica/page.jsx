"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/header";
import { ArrowLeft, MapPin, Car, Briefcase, ChevronRight, Navigation } from "lucide-react";

// DATOS MOCK
const zonas = [
  { 
    id: 1,
    nombre: "Córdoba Capital - Tribunales I", 
    tipo: "Centro",
    estado: "Crítico",
    pendientes: 12,
    accion: "Procurar masivamente el martes",
    color: "border-l-red-500",
    badge: "bg-red-100 text-red-700",
    distancia: "1.5 km"
  },
  { 
    id: 2,
    nombre: "Villa Carlos Paz", 
    tipo: "Interior (Viaje)",
    estado: "Activo",
    pendientes: 4,
    accion: "Llevar cédulas el jueves (Audiencia)",
    color: "border-l-orange-500",
    badge: "bg-orange-100 text-orange-700",
    distancia: "35 km"
  },
  { 
    id: 3,
    nombre: "Río Segundo", 
    tipo: "Interior (Viaje)",
    estado: "Baja Actividad",
    pendientes: 1,
    accion: "Enviar escrito digital (No viajar)",
    color: "border-l-green-500",
    badge: "bg-green-100 text-green-700",
    distancia: "45 km"
  },
  { 
    id: 4,
    nombre: "Jesús María", 
    tipo: "Interior (Viaje)",
    estado: "Sin Actividad",
    pendientes: 0,
    accion: "Ninguna acción requerida",
    color: "border-l-slate-300",
    badge: "bg-slate-100 text-slate-500",
    distancia: "50 km"
  },
];

export default function LogisticaPage() {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Link href="/reportes" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="text-orange-500" /> Logística Judicial
                </h1>
                <p className="text-sm text-slate-500">Planificación inteligente de traslados y procuración.</p>
              </div>
            </div>
            
            <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2">
                <Navigation size={16} /> Optimizar Ruta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {zonas.map((zona) => (
              <div key={zona.id} className={`bg-white border border-slate-200 rounded-xl p-5 shadow-sm border-l-4 ${zona.color} flex flex-col justify-between h-full transition-transform hover:-translate-y-1 hover:shadow-md cursor-pointer`}>
                
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
                      {zona.tipo.includes("Viaje") ? <Car size={20} /> : <Briefcase size={20} />}
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${zona.badge}`}>
                      {zona.estado}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">{zona.nombre}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mb-5">
                    <span>{zona.tipo}</span>
                    <span>•</span>
                    <span>{zona.distancia}</span>
                  </div>

                  <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Pendientes en zona</p>
                    <div className="flex items-baseline gap-1">
                        <p className="text-3xl font-bold text-slate-800">{zona.pendientes}</p>
                        <span className="text-sm font-medium text-slate-500">expedientes</span>
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Acción Sugerida</p>
                    <p className="text-sm text-slate-700 font-medium bg-yellow-50 p-2 rounded border border-yellow-100 inline-block w-full">
                        {zona.accion}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-blue-600 font-medium text-sm group">
                  <span>Ver listado</span>
                  <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>

              </div>
            ))}
          </div>

        </main>
      </div>
    </div>
  );
}