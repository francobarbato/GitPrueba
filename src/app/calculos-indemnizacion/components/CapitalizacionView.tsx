"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCcw, Info, Scale } from 'lucide-react';
// Tipos
interface CalculatorViewProps {
    setCalculoResult: (result: any | null) => void;
    handleClear: () => void; 
}

// MOCK: Resultados del cálculo
const MOCK_RESULTADOS = {
    vuotto: 2500000,
    mendez: 2800000,
    vergara: 2650000,
    intereses: 550000,
    totalFinal: 3350000,
};

export default function CapitalizacionView({ setCalculoResult, handleClear }: CalculatorViewProps) {
    const [hasCalculated, setHasCalculated] = useState(false);

    const [formData, setFormData] = useState({
        remuneracion: 300000,
        edadDano: 40,
        porcentajeIncapacidad: 30,
        factorTasa: 0.06,
    });

    const handleCalculate = () => {
        // MOCK: Simular el cálculo exitoso
        setCalculoResult({
            indemnizacionBase: MOCK_RESULTADOS.vuotto,
            multas: 0, 
            intereses: MOCK_RESULTADOS.intereses, 
            total: MOCK_RESULTADOS.totalFinal,
        });
        setHasCalculated(true);
    };

    // Función de limpieza local que resetea el estado de cálculo
    const handleClearLocal = () => {
        handleClear(); // Llama a la función de limpieza del padre
        setHasCalculated(false);
    };

    const montosFicticios = [
        { formula: 'VUOTTO', capital: MOCK_RESULTADOS.vuotto },
        { formula: 'MENDEZ', capital: MOCK_RESULTADOS.mendez },
        { formula: 'VERGARA', capital: MOCK_RESULTADOS.vergara },
    ];


    return (
        <div className="space-y-6">
            <Card className="shadow-sm border-slate-200">
                <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                         <Scale size={18} className="text-slate-600" /> Ingreso de Datos (Fórmulas Capitalización)
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                    
                    <h4 className="font-bold text-sm text-blue-600 border-b border-blue-100 pb-1 uppercase">Variables Base</h4>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1 col-span-3">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Remuneración Mensual ($)</label>
                            <Input type="number" value={formData.remuneracion} onChange={() => {}} placeholder="Ej: 300000" />
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Edad al momento del daño</label>
                            <Input type="number" value={formData.edadDano} onChange={() => {}} placeholder="Ej: 40" />
                        </div>
                        <div className="space-y-1 col-span-2">
                            <label className="block text-xs font-bold text-slate-500 uppercase">Porcentaje de Incapacidad (%)</label>
                            <Input type="number" value={formData.porcentajeIncapacidad} onChange={() => {}} placeholder="Ej: 30" />
                        </div>
                    </div>

                    <h4 className="font-bold text-sm text-red-600 border-b border-red-100 pb-1 uppercase pt-4">Comparación de Fórmulas</h4>
                    
                    <div className="grid grid-cols-3 gap-4 border border-slate-200 p-4 rounded-lg bg-slate-50">
                        {montosFicticios.map(({ formula, capital }) => (
                            <div key={formula} className="border border-slate-300 p-3 rounded-lg flex flex-col justify-between bg-white">
                                <h4 className="font-bold text-sm text-slate-800 mb-2">{formula}</h4>
                                <div className="text-xs text-slate-500 space-y-1">
                                    <p>Capital Estimado:</p>
                                    <p className="text-sm font-bold text-blue-600">${capital.toLocaleString('es-AR')}</p>
                                    <p className="flex items-center">Info: <Info size={14} className="text-slate-400 ml-1" /></p>
                                </div>
                            </div>
                        ))}
                    </div>
                
                    <div className="pt-4 flex gap-2">
                        <Button onClick={handleCalculate} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                            Comparar y Calcular
                        </Button>
                        <Button onClick={handleClearLocal} variant="outline" className="text-slate-600 border-slate-300" size="icon">
                            <RotateCcw size={16} />
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* MOCK DE RESULTADOS */}
            {hasCalculated && (
                <div className="mt-6">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Resultado de Capitalización</h3>
                    <div className="rounded-lg border border-slate-200 overflow-hidden shadow-sm bg-white">
                        <table className="w-full text-sm text-left">
                            <tbody className="divide-y divide-slate-100">
                                <tr className="bg-blue-50 border-t-2 border-blue-200">
                                    <td className="px-4 py-4 font-bold text-blue-800 text-lg">TOTAL ESTIMADO</td>
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