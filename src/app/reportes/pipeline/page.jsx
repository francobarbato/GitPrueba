"use client";

import React from "react";
import Link from "next/link";
import { Sidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/header";
import { ArrowLeft, Users, TrendingUp, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// --- DATOS MOCK: PRODUCTIVIDAD DE ABOGADOS ---
const DATA_PRODUCTIVIDAD = [
    { 
        abogado: "Franco B.", 
        fuero: "Laboral/Civil", 
        casosActivos: 15, 
        casosCerrados: 8, 
        tasaCierre: 35, 
        promedioDias: 120,
        motivosRetraso: ["Falta Contestación (Juzgado)", "Docs Cliente"], 
        etapa: "Prueba"
    },
    { 
        abogado: "Guillermo A.", 
        fuero: "Comercial/Familia", 
        casosActivos: 9, 
        casosCerrados: 12, 
        tasaCierre: 57, 
        promedioDias: 85,
        motivosRetraso: ["Al día"],
        etapa: "Sentencia"
    },
    { 
        abogado: "Luciano E.", 
        fuero: "Penal/Administrativo", 
        casosActivos: 5, 
        casosCerrados: 3, 
        tasaCierre: 25, 
        promedioDias: 180,
        motivosRetraso: ["Falta de Notificación", "Revisión Interna"],
        etapa: "Consulta"
    },
];

export default function ProductividadPage() {

    // CORRECCIÓN AQUÍ: Quitamos ": number" para que sea JS válido
    const getDaysStatus = (dias) => {
        if (dias > 150) return 'bg-red-100 text-red-700 border-red-200';
        if (dias > 100) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-green-100 text-green-700 border-green-200';
    };

    return (
        <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
            <Sidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
                <Header />
                
                <main className="flex-1 overflow-auto p-6">
                    {/* Header de Página */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <Link href="/reportes" className="p-2 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <ArrowLeft size={20} />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                                    <TrendingUp size={24} className="text-blue-600" /> Desempeño y Productividad
                                </h1>
                                <p className="text-sm text-slate-500">Análisis de eficiencia, volumen de casos y puntos de retraso por abogado.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium shadow-sm">
                                <Filter size={16} /> Filtrar por Período
                            </button>
                        </div>
                    </div>

                    {/* KPI CARDS RESUMEN */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <Card className="border-l-4 border-l-blue-600 shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase">Tasa de Cierre Promedio</p>
                                <p className="text-3xl font-bold text-blue-600 mt-1">45%</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-amber-600 shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase">Casos con Retraso Activo</p>
                                <p className="text-3xl font-bold text-amber-600 mt-1">6</p>
                            </CardContent>
                        </Card>
                        <Card className="border-l-4 border-l-emerald-600 shadow-sm">
                            <CardContent className="p-4">
                                <p className="text-xs font-bold text-slate-400 uppercase">Promedio de Cierre (Días)</p>
                                <p className="text-3xl font-bold text-emerald-600 mt-1">130</p>
                            </CardContent>
                        </Card>
                    </div>


                    {/* TABLA PRINCIPAL DE PRODUCTIVIDAD */}
                    <Card className="shadow-sm border-slate-200">
                        <CardHeader className="bg-white border-b border-slate-100 pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users size={20} className="text-slate-600" /> Rendimiento Detallado por Abogado
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-3">Abogado</th>
                                            <th className="px-6 py-3">Volumen Activo</th>
                                            <th className="px-6 py-3">Tasa de Cierre</th>
                                            <th className="px-6 py-3">Tiempo Promedio</th>
                                            <th className="px-6 py-3">Etapa Mayoría de Casos</th>
                                            <th className="px-6 py-3">Motivos Principales de Retraso</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {DATA_PRODUCTIVIDAD.map((data, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-slate-800">{data.abogado}</td>
                                                <td className="px-6 py-4 text-center">{data.casosActivos} ({data.fuero})</td>
                                                <td className="px-6 py-4">
                                                    <Badge 
                                                        className={data.tasaCierre > 50 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-blue-100 text-blue-700 border-blue-200'}
                                                    >
                                                        {data.tasaCierre}%
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                     <Badge 
                                                        className={getDaysStatus(data.promedioDias)}
                                                    >
                                                        {data.promedioDias} días
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600">{data.etapa}</td>
                                                <td className="px-6 py-4 text-xs space-x-1">
                                                    {data.motivosRetraso.map((motivo, j) => (
                                                        <Badge 
                                                            key={j} 
                                                            className={motivo.includes('Juzgado') || motivo.includes('Notificación') ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}
                                                        >
                                                            {motivo}
                                                        </Badge>
                                                    ))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* NOTA OPERATIVA */}
                    <div className="mt-8 p-4 bg-slate-100 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-600">
                            **Nota Operativa:** El "Tiempo Promedio de Caso" se mide desde la fecha de inicio hasta el cierre o la fecha actual (para casos activos). Es un indicador clave de eficiencia.
                        </p>
                    </div>

                </main>
            </div>
        </div>
    );
}