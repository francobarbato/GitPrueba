"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Info, Download, Briefcase } from 'lucide-react';
// import { CalculatorViewProps } from "../types"; // Asumiendo que types.ts está cerca

// Usamos any temporalmente para el tipo del componente, si no se importa types.ts
interface CalculatorViewProps {
    setCalculoResult: (result: any | null) => void;
    handleCalculate: () => void; 
    handleClear: () => void;
}

// MOCK: Resultados del cálculo de despido
const MOCK_RESULTADOS = {
    antiguedad: 1050000,
    sacProporcional: 83000,
    vacacionesProporcionales: 125000,
    subtotal: 1258000,
    multa24013: 450000,
    multa25323: 180000,
    totalFinal: 1888000,
};

const Checkbox = ({ label }: { label: string }) => (
    <div className="flex items-center space-x-2">
        <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500 border-slate-300" id={label} />
        <label htmlFor={label} className="text-sm text-slate-700">{label}</label>
    </div>
);


export default function DespidoView({ setCalculoResult, handleClear }: CalculatorViewProps) {
    const [formData, setFormData] = useState({
        salarioBruto: 350000,
        fechaIngreso: '2015-01-01',
        fechaEgreso: '2025-11-30',
        preaviso: 'CON_PREAVISO',
    });

    const handleCalculate = () => {
        // En un proyecto real, aquí se llamaría a la API o función de cálculo
        // MOCK: Simular el cálculo exitoso y establecer el resultado
        setCalculoResult({
            indemnizacionBase: MOCK_RESULTADOS.subtotal,
            multas: MOCK_RESULTADOS.multa24013 + MOCK_RESULTADOS.multa25323,
            intereses: 150000, // Mock de intereses
            total: MOCK_RESULTADOS.totalFinal + 150000,
        });
    };
    
    // Lista de rubros para la tabla
    const rubros = [
        { name: 'Indemnización por Antigüedad', amount: MOCK_RESULTADOS.antiguedad },
        { name: 'SAC Proporcional', amount: MOCK_RESULTADOS.sacProporcional },
        { name: 'Vacaciones Proporcionales', amount: MOCK_RESULTADOS.vacacionesProporcionales },
    ];


    return (
        <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Briefcase size={18} className="text-slate-600" /> Ingreso de Datos (LCT)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    
                    {/* Datos del Empleo */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Mejor Salario Bruto ($)</label>
                            <Input type="number" value={formData.salarioBruto} onChange={(e) => setFormData({...formData, salarioBruto: Number(e.target.value)})} placeholder="Ej: 350000" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Fecha de Ingreso</label>
                            <Input type="date" value={formData.fechaIngreso} onChange={(e) => setFormData({...formData, fechaIngreso: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Fecha de Egreso</label>
                            <Input type="date" value={formData.fechaEgreso} onChange={(e) => setFormData({...formData, fechaEgreso: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Preaviso</label>
                            <select className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white">
                                <option>Sin Preaviso</option>
                                <option>1 Mes</option>
                                <option>2 Meses</option>
                            </select>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Multas LCT */}
                    <h4 className="font-bold text-sm text-red-600 border-b border-red-100 pb-1 uppercase">Multas Ley 24013 & 25323</h4>
                    <div className="border border-slate-200 p-4 rounded-lg bg-slate-50 space-y-3">
                        <div className="space-y-2">
                            <h5 className="font-bold text-xs text-slate-700">Ley 24013 (Empleo no registrado)</h5>
                            <div className="grid grid-cols-2 gap-4">
                                {['art8', 'art10', 'art15'].map((art) => (
                                    <div key={art} className="flex items-center justify-between">
                                        <Checkbox label={`Aplica art. ${art.replace('art', '')}`} />
                                        <Input type="text" placeholder="Monto" className="w-1/3 h-8 text-right bg-white" disabled />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <h5 className="font-bold text-xs text-slate-700">Ley 25323</h5>
                            <div className="grid grid-cols-2 gap-4">
                                {['art1 (80 LCT)', 'art2'].map((art) => (
                                    <div key={art} className="flex items-center justify-between">
                                        <Checkbox label={`Aplica ${art}`} />
                                        <Input type="text" placeholder="Monto" className="w-1/3 h-8 text-right bg-white" disabled />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex gap-2">
                        <Button onClick={handleCalculate} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                            Calcular Liquidación
                        </Button>
                        <Button onClick={handleClear} variant="outline" className="text-slate-600 border-slate-300" size="icon">
                            <RotateCcw size={16} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Resultados (Solo visual) */}
            <div className="mt-6">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Desglose (Previsualización)</h3>
                <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium">
                            <tr>
                                <th className="px-4 py-3">Rubro</th>
                                <th className="px-4 py-3 text-right">Monto Estimado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {rubros.map((rubro, i) => (
                                <tr key={i} className={i === rubros.length - 1 ? 'bg-slate-50/50 font-bold' : ''}>
                                    <td className="px-4 py-3 font-medium text-slate-700">{rubro.name}</td>
                                    <td className="px-4 py-3 text-right">${rubro.amount.toLocaleString('es-AR')}</td>
                                </tr>
                            ))}
                            <tr className="bg-red-50 text-red-600">
                                <td className="px-4 py-3 font-bold">Total Multas</td>
                                <td className="px-4 py-3 text-right font-bold">${MOCK_RESULTADOS.multa24013 + MOCK_RESULTADOS.multa25323}</td>
                            </tr>
                            <tr className="bg-blue-50 border-t-2 border-blue-200">
                                <td className="px-4 py-4 font-bold text-blue-800 text-lg">TOTAL ESTIMADO</td>
                                <td className="px-4 py-4 text-right font-bold text-blue-800 text-lg">${MOCK_RESULTADOS.totalFinal}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}