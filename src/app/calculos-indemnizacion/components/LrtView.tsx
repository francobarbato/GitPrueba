"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Info, Truck } from 'lucide-react';
// Tipos
interface CalculatorViewProps {
    setCalculoResult: (result: any | null) => void;
    handleClear: () => void; 
}

// MOCK: Resultados del cálculo LRT
const MOCK_RESULTADOS = {
    art14_2a: 500000,
    art14_2b: 300000,
    art15: 150000,
    multa26773: 50000,
    totalFinal: 1000000,
};

export default function LrtView({ setCalculoResult, handleClear }: CalculatorViewProps) {
    const [hasCalculated, setHasCalculated] = useState(false);
    
    const [formData, setFormData] = useState({
        ibm: 150000, 
        fechaAccidente: '2025-01-01',
        edad: 35,
        porcentajeIncapacidad: 15,
    });

    const handleCalculate = () => {
        // MOCK: Simular el cálculo exitoso
        setCalculoResult({
            indemnizacionBase: MOCK_RESULTADOS.art14_2a + MOCK_RESULTADOS.art14_2b + MOCK_RESULTADOS.art15,
            multas: MOCK_RESULTADOS.multa26773,
            intereses: 150000, 
            total: MOCK_RESULTADOS.totalFinal + 150000,
        });
        setHasCalculated(true);
    };
    
    // Función de limpieza local que resetea el estado de cálculo
    const handleClearLocal = () => {
        handleClear(); // Llama a la función de limpieza del padre
        setHasCalculated(false);
    };

    const rubros = [
        { name: 'Art. 14° "2A" Ley 24557', amount: MOCK_RESULTADOS.art14_2a },
        { name: 'Art. 14° "2B" Ley 24557', amount: MOCK_RESULTADOS.art14_2b },
        { name: 'Art. 15° Ley 24557', amount: MOCK_RESULTADOS.art15 },
        { name: 'Art. 3° Ley 26773 (Multa)', amount: MOCK_RESULTADOS.multa26773, isMulta: true },
    ];

    return (
        <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Truck size={18} className="text-slate-600" /> Ingreso de Datos (Accidente LRT)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    
                    <h4 className="font-bold text-sm text-blue-600 border-b border-blue-100 pb-1 uppercase">Parámetros de Cálculo</h4>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Ingreso Base Mensual (IBM)</label>
                            <Input type="number" value={formData.ibm} onChange={() => {}} placeholder="Ej: 150000" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Fecha Accidente</label>
                            <Input type="date" value={formData.fechaAccidente} onChange={() => {}} />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Edad al accidentarse</label>
                            <Input type="number" value={formData.edad} onChange={() => {}} placeholder="Ej: 35" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Porcentaje Incapacidad</label>
                            <Input type="number" value={formData.porcentajeIncapacidad} onChange={() => {}} placeholder="Ej: 15" />
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Tipo de Accidente</label>
                            <select className="w-full border border-slate-300 rounded-md p-2 text-sm bg-white">
                                <option>En Ocasión</option>
                                <option>In Itinere</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="pt-4 flex gap-2">
                        <Button onClick={handleCalculate} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                            Calcular Indemnización
                        </Button>
                        <Button onClick={handleClearLocal} variant="outline" className="text-slate-600 border-slate-300" size="icon">
                            <RotateCcw size={16} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* MOCK DE RESULTADOS - Solo visible si hasCalculated es true */}
            {hasCalculated && (
                <div className="mt-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Desglose LRT (Previsualización)</h3>
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
                                    <tr key={i} className={rubro.isMulta ? 'bg-red-50 text-red-600' : ''}>
                                        <td className="px-4 py-3 font-medium">{rubro.name}</td>
                                        <td className="px-4 py-3 text-right">${rubro.amount.toLocaleString('es-AR')}</td>
                                    </tr>
                                ))}
                                <tr className="bg-blue-50 border-t-2 border-blue-200">
                                    <td className="px-4 py-4 font-bold text-blue-800 text-lg">TOTAL LRT ESTIMADO</td>
                                    <td className="px-4 py-4 text-right font-bold text-blue-800 text-lg">${MOCK_RESULTADOS.totalFinal.toLocaleString('es-AR')}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}