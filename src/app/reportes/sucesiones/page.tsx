"use client";

import React, { useState } from 'react';
import Link from "next/link";
import { 
  Calculator, Printer, Building2, Scale, ArrowLeft, Trash2, Plus 
} from 'lucide-react';

// IMPORTACIONES REALES
import { Sidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/header";
import { Button } from '@/components/ui/button';

// 1. DEFINICIÓN DE TIPOS PARA SOLUCIONAR ERRORES
interface Bien {
  id: number;
  tipo: string;
  valor: number | string; // Puede ser número o texto mientras se escribe
  descripcion: string;
}

export default function CalculadoraSucesionPage() {
  // --- ESTADOS TIPADOS ---
  const [bienes, setBienes] = useState<Bien[]>([
    { id: 1, tipo: 'Inmueble', valor: 0, descripcion: '' }
  ]);
  const [honorariosPorcentaje, setHonorariosPorcentaje] = useState<number>(10);
  const [tasaJusticiaPorcentaje, setTasaJusticiaPorcentaje] = useState<number>(1.5);

  // --- LÓGICA DE CÁLCULO ---
  const totalBienes = bienes.reduce((acc, item) => {
    // Usamos Number() para evitar el error de "number not assignable to string" en parseFloat
    const val = Number(item.valor) || 0; 
    return acc + val;
  }, 0);

  const costoTasaJusticia = totalBienes * (tasaJusticiaPorcentaje / 100);
  const costoHonorarios = totalBienes * (honorariosPorcentaje / 100);
  const costoCaja = costoHonorarios * 0.10; 
  const gastosFijos = 50000; 

  const costoTotal = costoTasaJusticia + costoHonorarios + costoCaja + gastosFijos;

  // --- HANDLERS CORREGIDOS ---
  const addBien = () => {
    setBienes([...bienes, { id: Date.now(), tipo: 'Inmueble', valor: 0, descripcion: '' }]);
  };

  // Aquí solucionamos los errores de 'any' definiendo los tipos de los parámetros
  const updateBien = (id: number, field: keyof Bien, value: string | number) => {
    setBienes(bienes.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBien = (id: number) => {
    setBienes(bienes.filter(b => b.id !== id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* 1. SIDEBAR REAL */}
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* 2. HEADER REAL */}
        <Header />

        {/* 3. CONTENIDO PRINCIPAL */}
        <main className="flex-1 overflow-auto p-6">
          
          {/* TÍTULO Y BOTONES */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 print:hidden">
            <div className="flex items-center gap-4">
              <div>
                <Link href="/reportes">
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-800 pl-0 gap-2">
                        <ArrowLeft className="w-4 h-4" />
                        Volver al Tablero Principal
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-blue-600" />
                  Calculadora de Costos Sucesorios
                </h1>
                <p className="text-slate-500 text-sm">Estimación rápida para entregar al cliente.</p>

              </div>

            </div>
            
            <button 
              onClick={handlePrint}
              className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium shadow-sm transition-colors"
            >
              <Printer size={18} /> Imprimir Presupuesto
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 h-auto min-h-[calc(100%-80px)]">
            
            {/* IZQUIERDA: PANEL DE CARGA */}
            <div className="w-full lg:w-1/3 bg-white border border-slate-200 rounded-xl p-6 overflow-y-auto shadow-sm print:hidden">
              
              <section className="mb-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                  <Building2 size={16} /> Acervo Hereditario
                </h3>
                
                <div className="space-y-4">
                  {bienes.map((bien, index) => (
                    <div key={bien.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 group">
                      <div className="flex justify-between mb-3">
                        <span className="text-xs font-bold text-slate-400 uppercase">Item #{index + 1}</span>
                        <button onClick={() => removeBien(bien.id)} className="text-slate-400 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-3">
                        <input 
                          type="text" 
                          placeholder="Descripción (Ej: Casa Centro)"
                          className="w-full bg-white border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={bien.descripcion}
                          onChange={(e) => updateBien(bien.id, 'descripcion', e.target.value)}
                        />
                        <div className="flex gap-2">
                          <select 
                            className="bg-white border border-slate-300 rounded-md p-2 text-sm w-1/3 outline-none"
                            value={bien.tipo}
                            onChange={(e) => updateBien(bien.id, 'tipo', e.target.value)}
                          >
                            <option>Inmueble</option>
                            <option>Automóvil</option>
                            <option>Dinero</option>
                            <option>Otros</option>
                          </select>
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-2 text-slate-400">$</span>
                            <input 
                              type="number" 
                              placeholder="0.00"
                              className="w-full bg-white border border-slate-300 rounded-md p-2 pl-6 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                              value={bien.valor || ''}
                              onChange={(e) => updateBien(bien.id, 'valor', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={addBien}
                    className="w-full py-2.5 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-medium hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Agregar Bien
                  </button>
                </div>
              </section>

              <hr className="border-slate-100 my-6" />

              <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                  <Scale size={16} /> Configuración Legal
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <label className="text-slate-700 font-medium">Honorarios Estudio</label>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2 rounded">{honorariosPorcentaje}%</span>
                    </div>
                    <input 
                      type="range" min="5" max="25" step="0.5"
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      value={honorariosPorcentaje}
                      onChange={(e) => setHonorariosPorcentaje(parseFloat(e.target.value))}
                    />
                    <p className="text-xs text-slate-400 mt-1">Regulación usual: 7% a 15%</p>
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <label className="text-slate-700 font-medium">Tasa de Justicia</label>
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 rounded">{tasaJusticiaPorcentaje}%</span>
                    </div>
                    <input 
                      type="number" 
                      className="w-full border border-slate-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={tasaJusticiaPorcentaje}
                      onChange={(e) => setTasaJusticiaPorcentaje(parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* DERECHA: DOCUMENTO A4 (OUTPUT) */}
            <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 p-8 overflow-y-auto flex justify-center print:p-0 print:bg-white print:border-none print:overflow-visible">
              
              <div className="w-full max-w-[210mm] bg-white shadow-lg min-h-[297mm] p-12 flex flex-col relative print:w-full print:shadow-none print:min-h-0">
                
                {/* MEMBRETE */}
                <div className="flex justify-between items-end border-b-2 border-slate-800 pb-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-serif font-bold text-slate-900">Estudio Jurídico</h2>
                    <p className="text-sm text-slate-500 mt-1">Asesoramiento Integral & Litigios</p>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p className="font-medium text-slate-600">Presupuesto Estimativo</p>
                    <p>{new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* CUERPO */}
                <div className="flex-1 space-y-8">
                  
                  <div className="bg-slate-50 border-l-4 border-slate-600 p-4">
                    <h3 className="font-bold text-slate-800 mb-1">Estimación de Costos de Sucesión</h3>
                    <p className="text-sm text-slate-600">
                      Detalle preliminar basado en la valuación de bienes declarada.
                    </p>
                  </div>

                  {/* Tabla 1: Bienes */}
                  <div>
                    <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2 text-sm uppercase tracking-wide">1. Base de Cálculo (Acervo)</h4>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-100">
                          <th className="py-2 text-left font-medium w-1/2">Descripción</th>
                          <th className="py-2 text-left font-medium">Tipo</th>
                          <th className="py-2 text-right font-medium">Valuación</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {bienes.map((b) => (
                          <tr key={b.id}>
                            <td className="py-3 text-slate-700">{b.descripcion || '-'}</td>
                            <td className="py-3 text-slate-500">{b.tipo}</td>
                            <td className="py-3 text-right font-mono text-slate-900">
                              {/* Conversión segura a número para el display */}
                              ${Number(b.valor).toLocaleString('es-AR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-slate-200">
                          <td colSpan={2} className="py-4 font-bold text-right text-slate-600">Total Bienes:</td>
                          <td className="py-4 font-bold text-right text-slate-900 text-lg font-mono">
                            ${totalBienes.toLocaleString('es-AR')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Tabla 2: Gastos */}
                  <div>
                    <h4 className="font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2 text-sm uppercase tracking-wide">2. Liquidación de Gastos</h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Tasa de Justicia ({tasaJusticiaPorcentaje}%)</span>
                        <span className="font-mono text-slate-900">${costoTasaJusticia.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-slate-600">Gastos fijos estimados (Edictos, oficios)</span>
                        <span className="font-mono text-slate-900">${gastosFijos.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between py-2 bg-slate-50 px-3 rounded font-medium border border-slate-100">
                        <span className="text-slate-800">Honorarios Profesionales ({honorariosPorcentaje}%)</span>
                        <span className="font-mono text-slate-900">${costoHonorarios.toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex justify-between py-1 px-3">
                        <span className="text-slate-500 text-xs">Aportes Caja Forense (10% s/ Hon.)</span>
                        <span className="font-mono text-slate-500 text-xs">${costoCaja.toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Total */}
                  <div className="mt-8 pt-6 border-t-2 border-slate-900 flex justify-between items-end">
                    <p className="text-[10px] text-slate-400 max-w-xs italic">
                      * Valores no vinculantes. Sujetos a regulación judicial definitiva.
                    </p>
                    <div className="text-right">
                      <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Costo Total Estimado</span>
                      <span className="block text-4xl font-bold text-slate-900 font-mono">
                        ${costoTotal.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Footer Documento */}
                <div className="mt-auto pt-8 border-t border-slate-100 text-center text-[10px] text-slate-400">
                  <p>Córdoba, Argentina • Tel: 0351-555-0000</p>
                </div>

              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}