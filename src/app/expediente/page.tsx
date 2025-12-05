"use client";

import React, { useState, ChangeEvent, FormEvent } from "react";
import { 
  Folder, FileText, Plus, Upload, ChevronRight, 
  MoreVertical, Clock, CheckCircle2, Trash2, UserPlus, Filter 
} from "lucide-react";

// IMPORTACIONES REALES DE TU PROYECTO
import { Sidebar } from "@/app/components/sidebar";
import { Header } from "@/app/components/header";

// --- DEFINICIÓN DE TIPOS (Interfaces) PARA CORREGIR LOS ERRORES ---
interface Caso {
  id: string;
  nro: string;
  caratula: string;
  juzgado: string;
  estado: string;
}

interface Todo {
  id: number;
  text: string;
  created_at: string;
  due_date: string;
}

// --- DATOS MOCK TIPADOS ---
const MOCK_CLIENTES = [
  { id: 'c-01', nombre: 'Empresa Crisis S.A.' },
  { id: 'c-02', nombre: 'Juan Pérez' },
  { id: 'c-03', nombre: 'Maria Gomez' },
];

// Aquí definimos que las claves son strings y los valores son arrays de Casos
// Esto soluciona el error: "Element implicitly has an 'any' type..."
const MOCK_CASOS: Record<string, Caso[]> = {
  'c-01': [
    { id: 'cs-urgente', nro: 'EXP-2025-001', caratula: 'Crisis S.A. c/ Estado Nacional s/ Amparo', juzgado: 'Juzgado Civil y Com. N° 5', estado: 'A despacho' },
    { id: 'cs-vencido', nro: 'EXP-2024-888', caratula: 'Crisis S.A. c/ Proveedor X s/ Cobro ejecutivo', juzgado: 'Juzgado Com. N° 12', estado: 'Paralizado' },
  ],
  'c-02': [
    { id: 'cs-01', nro: 'EXP-2023-111', caratula: 'Perez Juan c/ Fabrica Z s/ Despido', juzgado: 'Tribunal Trabajo N° 2', estado: 'En prueba' },
  ],
  'c-03': [],
};

const MOCK_FILES = [
  { id: 1, type: 'folder', name: '01. Demanda y Contestación', date: '01/11/2025', items: 4 },
  { id: 2, type: 'folder', name: '02. Cédulas y Notificaciones', date: '15/11/2025', items: 12 },
  { id: 3, type: 'folder', name: '03. Prueba Informativa', date: '01/12/2025', items: 8 },
  { id: 4, type: 'file', name: 'Resolución_Apertura_Prueba.pdf', date: '02/12/2025' },
  { id: 5, type: 'file', name: 'Escrito_Solicita_Habilitacion.pdf', date: '05/12/2025' },
];

export default function ExpedientePage() {
  // --- ESTADOS TIPADOS ---
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [selectedCaso, setSelectedCaso] = useState<Caso | null>(null);
  
  // Estados del To-Do
  const [todos, setTodos] = useState<Todo[]>([
    { id: 101, text: "Revisar cédula de notificación", created_at: "01/12/2025", due_date: "2025-12-10" },
  ]);
  const [todoText, setTodoText] = useState("");
  const [todoDate, setTodoDate] = useState("");

  // --- HANDLERS (Aquí corregimos el "implicitly has an 'any' type") ---
  
  // 'e' ahora es un evento de cambio de un elemento Select HTML
  const handleClienteChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCliente(e.target.value);
    setSelectedCaso(null);
  };

  // 'casoId' ahora sabemos que es un string
  const handleCasoSelect = (casoId: string) => {
    // Verificamos si selectedCliente es válido antes de acceder al array
    const casosDelCliente = MOCK_CASOS[selectedCliente] || [];
    const caso = casosDelCliente.find(c => c.id === casoId);
    setSelectedCaso(caso || null);
  };

  // 'e' ahora es un evento de formulario
  const handleAddTodo = (e: FormEvent) => {
    e.preventDefault();
    if (!todoText) return;
    const newItem: Todo = {
      id: Date.now(),
      text: todoText,
      created_at: new Date().toLocaleDateString('es-AR'),
      due_date: todoDate || "Sin plazo",
    };
    setTodos([newItem, ...todos]);
    setTodoText("");
    setTodoDate("");
  };

  const handleRemoveTodo = (id: number) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  // Corrección del error de indexación
  const casosDisponibles = selectedCliente ? (MOCK_CASOS[selectedCliente] || []) : [];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* 1. SIDEBAR REAL */}
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        
        {/* 2. HEADER REAL */}
        <Header />
        
        {/* 3. CONTENIDO PRINCIPAL */}
        <main className="flex-1 flex overflow-hidden">
          
          {/* A. ZONA CENTRAL: EXPLORADOR DE ARCHIVOS */}
          <div className="flex-1 flex flex-col p-6 overflow-y-auto min-w-0">
            
            {/* SELECTORES SUPERIORES */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">1. Cliente</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-slate-800 p-2.5 outline-none"
                    value={selectedCliente}
                    onChange={handleClienteChange}
                  >
                    <option value="">Seleccionar Cliente...</option>
                    {MOCK_CLIENTES.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">2. Expediente</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-2 focus:ring-slate-800 p-2.5 outline-none disabled:opacity-50"
                    disabled={!selectedCliente}
                    onChange={(e) => handleCasoSelect(e.target.value)}
                    value={selectedCaso?.id || ''}
                  >
                    <option value="">Seleccionar Caso...</option>
                    {casosDisponibles.map(c => (
                      <option key={c.id} value={c.id}>{c.nro} - {c.caratula.substring(0, 40)}...</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* CONTENIDO DEL EXPEDIENTE */}
            {!selectedCaso ? (
              // EMPTY STATE
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl bg-white/50 text-slate-400">
                <div className="p-4 bg-slate-100 rounded-full mb-3 text-slate-300">
                  <UserPlus size={40} />
                </div>
                <h3 className="text-lg font-medium text-slate-600">Selecciona un expediente</h3>
                <p className="text-sm">Elige cliente y caso para ver documentos y tareas.</p>
              </div>
            ) : (
              // VISTA ACTIVA
              <div className="flex flex-col gap-6">
                
                {/* Header del Caso */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold border border-slate-200">
                          {selectedCaso.nro}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {selectedCaso.estado}
                        </span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 leading-tight">
                        {selectedCaso.caratula}
                      </h2>
                      <p className="text-sm text-slate-500 mt-1">{selectedCaso.juzgado}</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium transition-colors">
                         <Plus size={16} /> Carpeta
                      </button>
                      <button className="flex items-center gap-2 px-3 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 text-sm font-medium shadow-sm transition-colors">
                         <Upload size={16} /> Subir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Grid de Archivos */}
                <div className="flex-1">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <span className="font-bold text-slate-700">Archivos</span>
                        <ChevronRight size={14} />
                        <span>Raíz</span>
                      </div>
                      <button className="text-slate-400 hover:text-slate-600"><Filter size={16} /></button>
                   </div>
                   
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {MOCK_FILES.map((file) => (
                        <div key={file.id} className="group bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md p-4 rounded-xl cursor-pointer transition-all">
                           <div className="flex justify-between items-start mb-3">
                              {file.type === 'folder' ? (
                                <Folder className="text-blue-300 fill-blue-50 group-hover:text-blue-500 transition-colors" size={36} strokeWidth={1.5} />
                              ) : (
                                <div className="relative">
                                  <FileText className="text-slate-300 group-hover:text-red-500 transition-colors" size={32} strokeWidth={1.5} />
                                  <span className="absolute -bottom-1 -right-1 bg-slate-100 text-[8px] font-bold px-1 rounded text-slate-600 border border-slate-200">PDF</span>
                                </div>
                              )}
                              <button className="text-slate-300 hover:text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <MoreVertical size={16} />
                              </button>
                           </div>
                           <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900 line-clamp-2 leading-snug">
                             {file.name}
                           </p>
                           <p className="text-[10px] text-slate-400 mt-1">
                             {file.items ? `${file.items} items` : file.date}
                           </p>
                        </div>
                      ))}
                   </div>
                </div>

              </div>
            )}
          </div>

          {/* B. PANEL LATERAL: TAREAS (Solo visible si hay caso seleccionado) */}
          {selectedCaso && (
            <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-sm z-10">
              <div className="p-5 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-slate-900" />
                  Tareas y Plazos
                </h3>
                <p className="text-xs text-slate-500 mt-1">Pendientes para este expediente.</p>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                {todos.length === 0 && (
                  <div className="text-center py-10 text-slate-400 text-sm">No hay tareas pendientes.</div>
                )}
                {todos.map((t) => (
                  <div key={t.id} className="group bg-white border border-slate-200 p-3 rounded-lg shadow-sm hover:border-slate-300 transition-all relative">
                     <button 
                       onClick={() => handleRemoveTodo(t.id)}
                       className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                     >
                       <Trash2 size={14} />
                     </button>

                     <p className="text-sm font-medium text-slate-700 pr-5 leading-snug">{t.text}</p>
                     
                     <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-50">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Creado</span>
                          <span className="text-xs text-slate-600">{t.created_at}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                             <Clock size={10} /> Vence
                          </span>
                          <span className={`text-xs font-bold ${t.due_date === 'Sin plazo' ? 'text-slate-400' : 'text-red-600'}`}>
                            {t.due_date}
                          </span>
                        </div>
                     </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-white border-t border-slate-200">
                <form onSubmit={handleAddTodo} className="space-y-2">
                  <input 
                    type="text" 
                    placeholder="Nueva tarea..." 
                    className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-slate-900 outline-none transition-all"
                    value={todoText}
                    onChange={(e) => setTodoText(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <input 
                      type="date" 
                      className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-slate-600 outline-none focus:ring-1 focus:ring-slate-900"
                      value={todoDate}
                      onChange={(e) => setTodoDate(e.target.value)}
                    />
                    <button 
                      disabled={!todoText}
                      type="submit"
                      className="bg-slate-900 text-white px-3 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </form>
              </div>
            </aside>
          )}

        </main>
      </div>
    </div>
  );
}