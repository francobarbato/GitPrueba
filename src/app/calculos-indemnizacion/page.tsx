"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Calculator, Printer, ArrowLeft, Briefcase, Truck, Scale, RotateCcw
} from 'lucide-react';

// IMPORTACIONES REALES
import { Sidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Componentes de VISTA (Deben estar en la carpeta _components)
import DespidoView from "./components/DespidosView";
import LrtView from "./components/LrtView";
import CapitalizacionView from "./components/CapitalizacionView";
import CalculadoraSucesionPage from "./sucesiones/page";

// Tipos para asegurar la consistencia del cálculo
interface CalculoResult {
  indemnizacionBase: number;
  multas: number;
  intereses: number;
  total: number;
}

// Definición de las pestañas de navegación
const TABS = [
  { id: 'despido', name: 'Despido', icon: Briefcase, component: DespidoView },
  { id: 'lrt', name: 'Accidente - LRT', icon: Truck, component: LrtView },
  { id: 'capitalizacion', name: 'Accidente - Capitalización', icon: Scale, component: CapitalizacionView },
  // { id: 'sucesiones', name: 'Calculo de sucesiones', icon: Scale, component: CalculadoraSucesionPage },
];

export default function CalculadoraIndemnizacionesPage() {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  // Estado tipado para el resultado
  const [calculoResult, setCalculoResult] = useState<CalculoResult | null>(null);

  const ActiveComponent = TABS.find(tab => tab.id === activeTab)?.component || DespidoView;

  // Función de limpieza global
  const handleClearGlobal = () => {
     setCalculoResult(null);
  }

  // Función de descarga que usa el resultado global del cálculo
  const handleDescargarPDF = () => {
    if (calculoResult) {
      alert(`Generando PDF para ${activeTab}. Total: $${calculoResult.total.toLocaleString('es-AR')}`);
    } else {
      alert("Realice un cálculo primero.");
    }
  };


  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        
        <Header />

        <main className="flex-1 overflow-auto p-6">
          
          {/* HEADER DE LA PÁGINA */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <div className="flex items-center gap-4">
              <Link href="/reportes" className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <ArrowLeft size={20} />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-blue-600" />
                  Calculadora de Liquidaciones
                </h1>
                <p className="text-slate-500 text-sm">Despido, accidentes y multas (Art. 8, 9, 15).</p>
              </div>
            </div>
            {/* Botón de Limpieza Global */}
            <Button onClick={handleClearGlobal} variant="outline" className="gap-2 text-slate-600 border-slate-300">
                <RotateCcw className="w-4 h-4" /> Limpiar Todo
            </Button>
          </div>

          {/* NAVEGACIÓN POR PESTAÑAS (TABS) - MEJORA DE UX */}
          <div className="flex border-b border-slate-200 mb-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setCalculoResult(null); }}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors border-b-2 
                  ${activeTab === tab.id
                    ? 'border-slate-900 text-slate-900 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
              >
                <tab.icon size={16} />
                {tab.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* IZQUIERDA: ÁREA DE CÁLCULO (Componente Activo) */}
            <div className="lg:col-span-2">
              {/* Le pasamos el setter del resultado y el clear global */}
              <ActiveComponent 
                setCalculoResult={setCalculoResult}
                handleClear={handleClearGlobal}              />
            </div>

            {/* DERECHA: PANEL DE RESULTADOS Y DESCARGA */}
            <div className="lg:col-span-1">
              <Card className="border-slate-200 shadow-sm h-full sticky top-0">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                  <CardTitle className="text-lg text-slate-700">
                    Resultado Final
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  {calculoResult ? (
                    <>
                      {/* Tarjeta de Resumen Final */}
                      <div className="bg-slate-900 p-4 rounded-lg shadow-md">
                        <p className="text-xs text-slate-300 font-bold uppercase mb-1">Total a Reclamar</p>
                        <p className="text-2xl font-bold text-white">
                          ${calculoResult.total.toLocaleString('es-AR', { maximumFractionDigits: 2 })}
                        </p>
                      </div>

                      {/* Desglose de Componentes */}
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600">
                            <span>Indemnización Base:</span>
                            <span className="font-medium">${calculoResult.indemnizacionBase.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                            <span>Multas / Adicionales:</span>
                            <span className="font-medium">${calculoResult.multas.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                        </div>
                         <div className="flex justify-between text-red-600 font-semibold">
                            <span>Intereses Estimados:</span>
                            <span>+ ${calculoResult.intereses.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      <div className="pt-4">
                        <Button
                          onClick={handleDescargarPDF}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm"
                        >
                          <Printer size={18} /> Generar PDF Final
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-10 text-slate-400">
                      <Calculator size={40} className="mx-auto mb-3" />
                      <p className="text-sm">Seleccione una pestaña e ingrese los datos para liquidar.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}