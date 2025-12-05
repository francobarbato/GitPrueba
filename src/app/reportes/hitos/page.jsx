"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/header";
import { ArrowLeft, Flag, Gavel, AlertOctagon, FileCheck, Calendar } from "lucide-react";

// DATOS MOCK
const hitos = [
  { fecha: "10 Dic", dia: "Martes", titulo: "Audiencia Vista de Causa", caso: "Pérez c/ Coca Cola", tipo: "Audiencia", color: "bg-purple-100 text-purple-700 border-purple-200", icon: Gavel },
  { fecha: "12 Dic", dia: "Jueves", titulo: "Vencimiento Fatal Contestación", caso: "Sucesión Gómez", tipo: "Vencimiento", color: "bg-red-100 text-red-700 border-red-200", icon: AlertOctagon },
  { fecha: "15 Dic", dia: "Domingo", titulo: "Caducidad de Instancia (Alerta)", caso: "Ramirez c/ Banco", tipo: "Alerta", color: "bg-orange-100 text-orange-700 border-orange-200", icon: Flag },
  { fecha: "20 Dic", dia: "Viernes", titulo: "Sentencia Esperada", caso: "Constructora Norte", tipo: "Hito", color: "bg-green-100 text-green-700 border-green-200", icon: FileCheck },
];

export default function HitosPage() {
  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/reportes" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
              <ArrowLeft size={20} />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Hitos Críticos</h1>
              <p className="text-sm text-slate-500">Eventos de alto impacto y fechas fatales para el próximo mes.</p>
            </div>
          </div>

          {/* ALERTA DE DENSIDAD */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-4 shadow-sm">
            <div className="bg-amber-100 p-2 rounded-full text-amber-600 mt-1">
              <Calendar size={24} />
            </div>
            <div>
              <h3 className="font-bold text-amber-900 text-lg">Semana Crítica Detectada</h3>
              <p className="text-sm text-amber-800 mt-1">
                La semana del <strong>10 al 15 de Diciembre</strong> tiene una saturación alta: 
                <strong> 1 Audiencia y 2 Vencimientos Fatales</strong>.
              </p>
              <div className="mt-3 flex gap-2">
                 <button className="text-xs bg-amber-200 hover:bg-amber-300 text-amber-900 px-3 py-1.5 rounded-md font-bold transition-colors">
                    Ver Agenda
                 </button>
                 <button className="text-xs border border-amber-300 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-md font-medium transition-colors">
                    Solicitar Ayuda / Derivar
                 </button>
              </div>
            </div>
          </div>

          {/* TIMELINE VERTICAL */}
          <div className="max-w-4xl">
            <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pl-8 py-2">
                
                {hitos.map((hito, i) => (
                <div key={i} className="relative group">
                    {/* Punto en la línea (Bola visual) */}
                    <div className={`absolute -left-[43px] top-6 w-6 h-6 rounded-full border-4 border-white shadow-sm flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${hito.tipo === 'Vencimiento' ? 'bg-red-500' : 'bg-slate-400'}`}>
                    </div>
                    
                    {/* Tarjeta del Hito */}
                    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-slate-400 hover:shadow-md transition-all cursor-pointer">
                    
                        {/* Fecha Grande */}
                        <div className="flex-shrink-0 text-center min-w-[80px] border-r border-slate-100 pr-4 md:border-none md:pr-0">
                            <span className="block text-2xl font-bold text-slate-800">{hito.fecha.split(" ")[0]}</span>
                            <span className="block text-xs uppercase font-bold text-slate-500">{hito.fecha.split(" ")[1]}</span>
                            <span className="block text-xs text-slate-400 mt-1 font-medium">{hito.dia}</span>
                        </div>

                        {/* Contenido */}
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${hito.color} flex items-center gap-1`}>
                                <hito.icon size={12} /> {hito.tipo}
                            </span>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">{hito.titulo}</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Expediente: <span className="font-medium text-slate-700">{hito.caso}</span>
                            </p>
                        </div>

                        {/* Botón Acción */}
                        <div className="w-full md:w-auto mt-2 md:mt-0">
                            <button className="w-full md:w-auto px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-sm font-medium rounded-lg border border-slate-200 transition-colors">
                            Ver Detalles
                            </button>
                        </div>
                    </div>
                </div>
                ))}

            </div>
          </div>

        </main>
      </div>
    </div>
  );
}