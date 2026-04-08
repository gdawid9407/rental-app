"use client";
import React, { useState } from 'react';
import { Header } from '../../components/Header';
import { NavTabs } from '../../components/NavTabs';
import { Plus, Edit2, Trash2, AlertCircle, ChevronDown, Info, User, Zap, Phone, Database, X, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProperties } from '../../hooks/useProperties';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { EventModal } from '../../components/EventModal';
import { PropertyKnowledgeBase } from '../../components/PropertyKnowledgeBase';
import { TenantLeaseTab } from '../../components/database/TenantLeaseTab';
import { UtilitiesMetersTab } from '../../components/database/UtilitiesMetersTab';
import { ContactsTab } from '../../components/database/ContactsTab';
import { Property, BillType } from '../../types/calendar';

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

const todayStr = () => new Date().toISOString().split('T')[0];

type TabType = 'general' | 'lease' | 'meters' | 'contacts';

export default function DatabasePage() {
  const { properties, isLoading, addProperty, updateProperty, deleteProperty } = useProperties();
  const { addEvent } = useCalendarEvents();

  // ── States ───────────────────────────────────────────────────────────────
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [newPropName, setNewPropName]   = useState('');
  const [newPropColor, setNewPropColor] = useState(COLORS[0]);
  
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editName, setEditName]     = useState('');
  const [editColor, setEditColor]   = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeTabs, setActiveTabs] = useState<Record<string, TabType>>({});

  // ── EventModal state ─────────────────────────────────────────────────────
  const [modalOpen, setModalOpen]           = useState(false);
  const [modalDate, setModalDate]           = useState(todayStr());
  const [modalPropId, setModalPropId]       = useState<string | undefined>();

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleExpanded = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
    if (!activeTabs[id]) setActiveTabs(prev => ({ ...prev, [id]: 'general' }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;
    try {
      await addProperty({ name: newPropName, color: newPropColor });
      setIsAddPropertyOpen(false);
      setNewPropName('');
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateProperty(id, { name: editName, color: editColor });
      setEditingId(null);
    } catch (err: any) { alert(err.message); }
  };

  const executeDelete = async (id: string, keepEvents: boolean) => {
    try {
      await deleteProperty(id, keepEvents);
      setDeletingId(null);
    } catch (err: any) { alert(err.message); }
  };

  const openQuickAdd = (propertyId: string) => {
    setModalDate(todayStr());
    setModalPropId(propertyId);
    setModalOpen(true);
  };

  const renderTabContent = (p: Property) => {
    const activeTab = activeTabs[p.id] || 'general';
    switch (activeTab) {
      case 'general':  return <PropertyKnowledgeBase property={p} />;
      case 'lease':    return <TenantLeaseTab property={p} />;
      case 'meters':   return <UtilitiesMetersTab property={p} />;
      case 'contacts': return <ContactsTab property={p} allProperties={properties} />;
      default: return null;
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 md:p-12 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      <div className="mx-auto max-w-6xl bg-white dark:bg-slate-900 md:rounded-2xl md:shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden relative pb-12 transition-colors duration-200">
        <Header isLoading={isLoading} />
        <NavTabs />

        <div className="p-8">
          {/* ── Page Header & Add Button ── */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight dark:text-white flex items-center gap-3">
                <Database className="text-blue-600 dark:text-amber-400" size={32} />
                Centrum danych Nieruchomości
              </h1>
              <p className="text-gray-500 dark:text-slate-400 mt-1">Kompletny rejestr Twoich mieszkań i najemców</p>
            </div>
            <button
              onClick={() => setIsAddPropertyOpen(!isAddPropertyOpen)}
              className={`font-bold px-6 py-3 rounded-xl shadow-lg transition-all flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] ${
                isAddPropertyOpen 
                  ? 'bg-slate-700 dark:bg-slate-800 text-white hover:bg-slate-800' 
                  : 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-600'
              }`}
            >
              {isAddPropertyOpen ? <ChevronUp size={20} /> : <Plus size={20} />}
              {isAddPropertyOpen ? 'ZWIŃ PANEL' : 'DODAJ NIERUCHOMOŚĆ'}
            </button>
          </div>

          {/* ── Add Form (Collapsible) ── */}
          <AnimatePresence>
            {isAddPropertyOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-8"
              >
                <div className="bg-gray-50 dark:bg-slate-800/40 border border-gray-200 dark:border-slate-700 rounded-2xl p-6">
                  <form onSubmit={handleCreate} className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-end">
                      <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Nazwa Nieruchomości</label>
                        <input
                          value={newPropName}
                          onChange={e => setNewPropName(e.target.value)}
                          placeholder="np. Apartament Widokowy, Kawalerka Centrum..."
                          className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm text-gray-900 dark:text-white"
                        />
                      </div>
                      <div className="w-full md:w-auto">
                        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">Etykieta Kolorystyczna</label>
                        <div className="flex gap-2 p-1.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl">
                          {COLORS.map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewPropColor(c)}
                              className={`w-8 h-8 rounded-lg transition-all ${newPropColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : 'hover:scale-105'}`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 justify-end">
                      <button type="button" onClick={() => setIsAddPropertyOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200">Anuluj</button>
                      <button type="submit" disabled={!newPropName.trim()} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-md">ZAPISZ NIERUCHOMOŚĆ</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Properties List ── */}
          {isLoading ? (
            <div className="text-center py-20 animate-pulse text-gray-400">Ładowanie nieruchomości...</div>
          ) : properties.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 dark:bg-slate-800/20 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-3xl">
              <Database size={64} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-600 dark:text-slate-300">Brak nieruchomości</h3>
              <p className="text-gray-400 dark:text-slate-500 mt-2">Użyj przycisku powyżej, aby dodać swoje pierwsze mieszkanie.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {properties.map(p => (
                <div key={p.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                  
                  {/* ── Edit / Delete Overlays ── */}
                  {editingId === p.id ? (
                    <div className="p-8 bg-blue-50/30 dark:bg-blue-900/10">
                      <div className="flex flex-col md:flex-row gap-4 items-end mb-6">
                        <div className="flex-1 w-full">
                          <input value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 border-2 border-blue-400 rounded-xl dark:bg-slate-800 dark:text-white outline-none" />
                        </div>
                        <div className="flex gap-2">
                          {COLORS.map(c => (
                            <button key={c} onClick={() => setEditColor(c)} className={`w-8 h-8 rounded-lg transition-transform ${editColor === c ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`} style={{ backgroundColor: c }} />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => setEditingId(null)} className="px-6 py-2 text-sm font-bold text-gray-500">Anuluj</button>
                        <button onClick={() => handleUpdate(p.id)} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md">Zapisz zmiany</button>
                      </div>
                    </div>
                  ) : deletingId === p.id ? (
                    <div className="p-8 bg-red-50 dark:bg-red-950/20">
                      <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-4 flex items-center gap-2">
                        <AlertCircle size={24} /> Czy na pewno chcesz usunąć tę nieruchomość?
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        <button onClick={() => executeDelete(p.id, true)} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-900 text-left hover:bg-red-50 transition shadow-sm">
                          <span className="block font-bold text-gray-800 dark:text-white">Tak, ale zostaw rachunki</span>
                          <span className="text-xs text-gray-500 mt-1">Kosztorysy pozostaną w kalendarzu bez przypisanej etykiety.</span>
                        </button>
                        <button onClick={() => executeDelete(p.id, false)} className="p-4 bg-red-600 text-white rounded-2xl text-left hover:bg-red-700 transition shadow-md">
                          <span className="block font-bold">Usuń wszystko całkowicie</span>
                          <span className="text-xs opacity-80 mt-1">Wszystkie dane, notatki i powiązane wpisy w kalendarzu znikną!</span>
                        </button>
                      </div>
                      <button onClick={() => setDeletingId(null)} className="w-full mt-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700">Wróć</button>
                    </div>
                  ) : (
                    <>
                      {/* ── Card Header Row ── */}
                      <div 
                        onClick={() => toggleExpanded(p.id)}
                        className="px-8 py-6 flex justify-between items-center cursor-pointer group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-5 h-5 rounded-full shadow-lg" style={{ backgroundColor: p.color }} />
                          <div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors">
                              {p.name}
                            </h2>
                            <div className="flex gap-4 mt-1">
                              <span className="text-xs text-gray-400 font-medium flex items-center gap-1"><User size={12} /> 1 Najemca</span>
                              <span className="text-xs text-gray-400 font-medium flex items-center gap-1"><Zap size={12} /> 3 Liczniki</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={(e) => { e.stopPropagation(); setEditingId(p.id); setEditName(p.name); setEditColor(p.color); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition" title="Edytuj"><Edit2 size={18} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setDeletingId(p.id); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition" title="Usuń"><Trash2 size={18} /></button>
                          <div className={`p-2 transition-transform duration-300 ${expandedId === p.id ? 'rotate-180' : ''}`}>
                            <ChevronDown size={24} className="text-gray-300" />
                          </div>
                        </div>
                      </div>

                      {/* ── Expanded Content (Tabs) ── */}
                      <AnimatePresence>
                        {expandedId === p.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-gray-100 dark:border-slate-800"
                          >
                            <div className="p-8 bg-gray-50/30 dark:bg-slate-950/20">
                              {/* Tab Navigation */}
                              <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 dark:border-slate-800 pb-2">
                                {[
                                  { id: 'general',  label: 'Ogólne & Notatki', icon: <Info size={16} /> },
                                  { id: 'lease',    label: 'Najemca i Umowa',  icon: <User size={16} /> },
                                  { id: 'meters',   label: 'Media i Liczniki', icon: <Zap size={16} /> },
                                  { id: 'contacts', label: 'Kontakty',         icon: <Phone size={16} /> },
                                ].map(tab => (
                                  <button
                                    key={tab.id}
                                    onClick={() => setActiveTabs(prev => ({ ...prev, [p.id]: tab.id as TabType }))}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
                                      (activeTabs[p.id] || 'general') === tab.id
                                        ? 'bg-blue-600 dark:bg-amber-400 text-white dark:text-slate-900 shadow-md'
                                        : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                                    }`}
                                  >
                                    {tab.icon}
                                    {tab.label}
                                  </button>
                                ))}
                              </div>

                              {/* Tab Content */}
                              <div className="min-h-[300px]">
                                {renderTabContent(p)}
                              </div>

                              {/* Action Footer (Only visible in Meters tab) */}
                              {(activeTabs[p.id] === 'meters') && (
                                <div className="mt-8 pt-8 border-t border-gray-100 dark:border-slate-800 flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300">
                                  <button
                                    onClick={() => openQuickAdd(p.id)}
                                    className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold px-6 py-2.5 rounded-xl text-sm hover:scale-[1.03] transition-transform flex items-center gap-2"
                                  >
                                    <Plus size={18} /> DODAJ RACHUNEK
                                  </button>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={modalDate}
        selectedEvent={null}
        properties={properties}
        onSave={async (_, payload, recurring) => { await addEvent(payload, recurring); setModalOpen(false); }}
        onDelete={async () => {}}
        defaultBillType="czynsz"
        defaultPropertyId={modalPropId}
        allowDelete={false}
      />
    </main>
  );
}
