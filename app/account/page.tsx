"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { Property } from '../../types/calendar';

const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // yellow
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
  '#64748b'  // slate
];

export default function AccountPage() {
  const { properties, isLoading, addProperty, updateProperty, deleteProperty } = useProperties();
  
  const [newPropName, setNewPropName] = useState('');
  const [newPropColor, setNewPropColor] = useState(COLORS[0]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;
    try {
      await addProperty({ name: newPropName, color: newPropColor });
      setNewPropName('');
      setNewPropColor(COLORS[0]);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateProperty(id, { name: editName, color: editColor });
      setEditingId(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const startEdit = (p: Property) => {
    setEditingId(p.id);
    setEditName(p.name);
    setEditColor(p.color);
    setDeletingId(null);
  };

  const executeDelete = async (id: string, keepEvents: boolean) => {
    try {
      await deleteProperty(id, keepEvents);
      setDeletingId(null);
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 font-medium animate-pulse">Ładowanie stanu konta...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 md:p-12 text-gray-900">
      <div className="mx-auto max-w-4xl bg-white md:rounded-2xl md:shadow-xl border border-gray-200 overflow-hidden relative pb-10">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4 bg-white">
          <Link href="/" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Moje Konto</h1>
            <p className="text-sm text-gray-500">Zarządzanie Nieruchomościami</p>
          </div>
        </div>

        <div className="p-8 space-y-10">
          
          {/* Dodaj Nieruchomość */}
          <section className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-blue-600" /> Dodaj Moduł Mieszkania
            </h2>
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nazwa (np. Mieszkanie Zielone, Kawalerka 2)</label>
                <input 
                  value={newPropName}
                  onChange={e => setNewPropName(e.target.value)}
                  placeholder="Dowolna nazwa..."
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm text-gray-900"
                />
              </div>
              <div className="w-full md:w-auto">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Etykieta</label>
                <div className="flex gap-2 p-1.5 border border-gray-300 bg-white rounded-xl shadow-sm">
                  {COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewPropColor(c)}
                      className={`w-8 h-8 rounded-lg outline-none transition-all ${newPropColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <button 
                type="submit"
                disabled={!newPropName.trim()}
                className="w-full md:w-auto mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-sm whitespace-nowrap"
              >
                Dodaj
              </button>
            </form>
          </section>

          {/* Lista Nieruchomości */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 mb-4">Zdefiniowane Nieruchomości ({properties.length})</h2>
            
            {properties.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 border border-dashed border-gray-300 rounded-2xl text-gray-500">
                Nie dodałeś jeszcze żadnego mieszkania.
              </div>
            ) : (
              <div className="grid gap-4">
                {properties.map(p => (
                  <div key={p.id} className="bg-white border text-gray-900 border-gray-200 rounded-2xl p-5 shadow-sm transition hover:shadow-md">
                    
                    {/* TRYB EDYCJI */}
                    {editingId === p.id ? (
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 w-full">
                            <input 
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full px-4 py-2 border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div className="flex gap-2">
                            {COLORS.map(c => (
                              <button
                                key={c}
                                onClick={() => setEditColor(c)}
                                className={`w-8 h-8 rounded-lg transition-transform ${editColor === c ? 'ring-2 ring-offset-1 ring-blue-500 scale-110' : ''}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-2">
                          <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-lg">Anuluj</button>
                          <button onClick={() => handleUpdate(p.id)} className="px-5 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg shadow-sm hover:bg-blue-700">Zapisz</button>
                        </div>
                      </div>
                    ) : (
                      // TRYB WIDOKU + USUWANIA
                      <div>
                        {deletingId === p.id ? (
                           <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl">
                            <h3 className="font-bold flex items-center gap-2 text-orange-800 mb-4">
                              <AlertCircle size={20} /> Co zrobić z powiązanymi rachunkami?
                            </h3>
                            <div className="space-y-3">
                              <button 
                                onClick={() => executeDelete(p.id, true)} 
                                className="w-full text-left p-3 bg-white hover:bg-orange-100 rounded-lg border border-orange-100 transition shadow-sm"
                              >
                                <span className="block font-semibold text-gray-800">Tylko usuń mieszkanie ✅</span>
                                <span className="block text-xs text-gray-500 mt-1">Rachunki i opłaty zostaną w kalendarzu (otrzymają status Etykiety: --Brak--)</span>
                              </button>
                              <button 
                                onClick={() => executeDelete(p.id, false)} 
                                className="w-full text-left p-3 bg-white hover:bg-red-50 rounded-lg border border-red-100 transition shadow-sm group"
                              >
                                <span className="block font-semibold text-red-600 group-hover:text-red-700">Usuń całkowicie z rachunkami 🗑</span>
                                <span className="block text-xs text-red-400 mt-1">Powiązane wpisy w kalendarzu zostaną skasowane. Działania nie da się cofnąć!</span>
                              </button>
                            </div>
                            <button onClick={() => setDeletingId(null)} className="w-full mt-3 p-2 text-sm text-gray-600 font-medium hover:bg-orange-100 rounded-lg">
                              Odrzuć i wróć
                            </button>
                           </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <span className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: p.color }}></span>
                              <span className="font-bold text-lg text-gray-800">{p.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => startEdit(p)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => setDeletingId(p.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </main>
  );
}
