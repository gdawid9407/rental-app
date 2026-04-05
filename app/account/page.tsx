"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, AlertCircle, Zap, CalendarDays, RotateCcw, ChevronDown } from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { EventModal } from '../../components/EventModal';
import { Property, BillType, BILL_CATEGORIES } from '../../types/calendar';
import type { DeleteMode } from '../../hooks/useCalendarEvents';

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

const QUICK_BILL_TYPES: { id: BillType; label: string }[] = [
  { id: 'czynsz', label: 'Czynsz' },
  { id: 'prad',   label: 'Prąd'   },
  { id: 'woda',   label: 'Woda'   },
  { id: 'gaz',    label: 'Gaz'    },
  { id: 'smieci', label: 'Śmieci' },
  { id: 'inny',   label: 'Inny'   },
];

const todayStr = () => new Date().toISOString().split('T')[0];

export default function AccountPage() {
  const { properties, isLoading, addProperty, updateProperty, deleteProperty } = useProperties();
  const { addEvent } = useCalendarEvents();

  // ── Add-property form ────────────────────────────────────────────────────
  const [newPropName, setNewPropName]   = useState('');
  const [newPropColor, setNewPropColor] = useState(COLORS[0]);

  // ── Edit state ───────────────────────────────────────────────────────────
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editName, setEditName]     = useState('');
  const [editColor, setEditColor]   = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Quick-add modal state ────────────────────────────────────────────────
  const [modalOpen, setModalOpen]                       = useState(false);
  const [modalDate, setModalDate]                       = useState(todayStr());
  const [modalDefaultBillType, setModalDefaultBillType] = useState<BillType | undefined>();
  const [modalDefaultPropertyId, setModalDefaultPropertyId] = useState<string | undefined>();

  // ── Per-card selected date (defaults to today) ───────────────────────────
  const [cardDates, setCardDates] = useState<Record<string, string>>({});
  const getCardDate = (id: string) => cardDates[id] ?? todayStr();
  const setCardDate = (id: string, date: string) =>
    setCardDates(prev => ({ ...prev, [id]: date }));
  const resetCardDate = (id: string) =>
    setCardDates(prev => ({ ...prev, [id]: todayStr() }));
  const isCardDateToday = (id: string) => getCardDate(id) === todayStr();

  // ── Per-card quick-add panel expand state ─────────────────────────────────
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const toggleExpanded = (id: string) =>
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  const isExpanded = (id: string) => expandedCards[id] ?? false;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPropName.trim()) return;
    try {
      await addProperty({ name: newPropName, color: newPropColor });
      setNewPropName('');
      setNewPropColor(COLORS[0]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Błąd');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateProperty(id, { name: editName, color: editColor });
      setEditingId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Błąd');
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
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Błąd');
    }
  };

  const openQuickAdd = (propertyId: string, billType: BillType) => {
    setModalDate(getCardDate(propertyId));
    setModalDefaultBillType(billType);
    setModalDefaultPropertyId(propertyId);
    setModalOpen(true);
  };

  const handleModalSave = async (
    _id: string | null,
    payload: Record<string, unknown>,
    recurringMonths: number = 0
  ) => {
    await addEvent({ ...payload, start_date: modalDate }, recurringMonths);
  };

  // no-op delete — Account page never edits existing events
  const handleModalDelete = async (
    _id: string,
    _mode: DeleteMode,
    _extra?: { startDate?: string; billType?: string }
  ) => {};

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Ładowanie stanu konta...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 md:p-12 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      <div className="mx-auto max-w-4xl bg-white dark:bg-slate-900 md:rounded-2xl md:shadow-xl border border-gray-200 dark:border-slate-800 overflow-hidden relative pb-10 transition-colors duration-200">

        {/* ── Header ── */}
        <div className="px-8 py-6 border-b border-gray-100 dark:border-slate-800 flex items-center gap-4 bg-white dark:bg-slate-900 transition-colors duration-200">
          <Link href="/" className="p-2 text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-amber-400 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight dark:text-white">Moje Konto</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">Zarządzanie Nieruchomościami</p>
          </div>
        </div>

        <div className="p-8 space-y-10">

          {/* ── Dodaj Nieruchomość ── */}
          <section className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 transition-colors duration-200">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Plus size={20} className="text-blue-600 dark:text-blue-400" /> Dodaj Swoje Mieszkanie
            </h2>
            <form onSubmit={handleCreate} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Nazwa (np. Mieszkanie Zielone, Kawalerka 2)</label>
                <input
                  value={newPropName}
                  onChange={e => setNewPropName(e.target.value)}
                  placeholder="Dowolna nazwa..."
                  className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm text-gray-900 dark:text-white"
                />
              </div>
              <div className="w-full md:w-auto">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">Etykieta</label>
                <div className="flex gap-2 p-1.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl shadow-sm transition-colors duration-200">
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
                className="w-full md:w-auto mt-4 md:mt-0 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-sm whitespace-nowrap dark:bg-blue-500 dark:hover:bg-blue-600"
              >
                Dodaj
              </button>
            </form>
          </section>

          {/* ── Lista Nieruchomości ── */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Zdefiniowane Nieruchomości ({properties.length})
            </h2>

            {properties.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-2xl text-gray-500 dark:text-slate-400">
                Nie dodałeś jeszcze żadnego mieszkania.
              </div>
            ) : (
              <div className="grid gap-4">
                {properties.map(p => (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* ── Edit mode ── */}
                    {editingId === p.id ? (
                      <div className="p-5 flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 w-full">
                            <input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              className="w-full px-4 py-2 border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:border-blue-500 dark:text-white"
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
                          <button onClick={() => setEditingId(null)} className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-lg">Anuluj</button>
                          <button onClick={() => handleUpdate(p.id)} className="px-5 py-2 text-sm font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-700 dark:hover:bg-blue-600">Zapisz</button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        {/* ── Delete confirmation ── */}
                        {deletingId === p.id ? (
                          <div className="p-5 bg-orange-50 dark:bg-orange-950/30 border-b border-orange-200 dark:border-orange-900">
                            <h3 className="font-bold flex items-center gap-2 text-orange-800 dark:text-orange-400 mb-4">
                              <AlertCircle size={20} /> Co zrobić z powiązanymi rachunkami?
                            </h3>
                            <div className="space-y-3">
                              <button
                                onClick={() => executeDelete(p.id, true)}
                                className="w-full text-left p-3 bg-white dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg border border-orange-100 dark:border-orange-800/50 transition shadow-sm"
                              >
                                <span className="block font-semibold text-gray-800 dark:text-slate-100">Tylko usuń mieszkanie ✅</span>
                                <span className="block text-xs text-gray-500 dark:text-slate-400 mt-1">Rachunki i opłaty zostaną w kalendarzu (otrzymają status Etykiety: --Brak--)</span>
                              </button>
                              <button
                                onClick={() => executeDelete(p.id, false)}
                                className="w-full text-left p-3 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50 transition shadow-sm group"
                              >
                                <span className="block font-semibold text-red-600 dark:text-red-400 group-hover:text-red-700">Usuń całkowicie z rachunkami 🗑</span>
                                <span className="block text-xs text-red-400 dark:text-red-500/80 mt-1">Powiązane wpisy w kalendarzu zostaną skasowane. Działania nie da się cofnąć!</span>
                              </button>
                            </div>
                            <button onClick={() => setDeletingId(null)} className="w-full mt-3 p-2 text-sm text-gray-600 dark:text-slate-300 font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg">
                              Odrzuć i wróć
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* ── Card top row ── */}
                            <div className="px-5 pt-5 pb-4 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0"
                                  style={{ backgroundColor: p.color }}
                                />
                                <span className="font-bold text-lg text-gray-800 dark:text-slate-100">{p.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Toggle quick-add panel */}
                                <button
                                  onClick={() => toggleExpanded(p.id)}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                                    isExpanded(p.id)
                                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-700/50 text-amber-700 dark:text-amber-400'
                                      : 'border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300'
                                  }`}
                                  title="Szybkie dodawanie rachunku"
                                >
                                  <Zap size={13} className={isExpanded(p.id) ? 'text-amber-500' : 'text-slate-400'} />
                                  Dodaj rachunek
                                  <ChevronDown
                                    size={13}
                                    className={`transition-transform duration-200 ${isExpanded(p.id) ? 'rotate-180' : ''}`}
                                  />
                                </button>
                                <button
                                  onClick={() => startEdit(p)}
                                  className="p-2 text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                                  title="Edytuj"
                                >
                                  <Edit2 size={17} />
                                </button>
                                <button
                                  onClick={() => setDeletingId(p.id)}
                                  className="p-2 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                                  title="Usuń"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            </div>

                            {/* ── Quick-add section (collapsible) ── */}
                            {isExpanded(p.id) && (
                              <div className="px-5 pb-5 pt-3 border-t border-gray-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                    <Zap size={12} className="text-amber-400" />
                                    Szybkie dodawanie rachunku
                                  </p>
                                  {/* Per-card date picker + reset */}
                                  <div className="flex items-center gap-1">
                                    <CalendarDays size={13} className="text-slate-400" />
                                    <input
                                      type="date"
                                      value={getCardDate(p.id)}
                                      onChange={e => setCardDate(p.id, e.target.value)}
                                      className="bg-transparent border-none outline-none text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                    />
                                    {!isCardDateToday(p.id) && (
                                      <button
                                        onClick={() => resetCardDate(p.id)}
                                        title="Resetuj do dzisiaj"
                                        className="p-1 rounded-md text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                                      >
                                        <RotateCcw size={12} />
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {QUICK_BILL_TYPES.map(bt => {
                                    const cat = BILL_CATEGORIES.find(c => c.id === bt.id);
                                    return (
                                      <button
                                        key={bt.id}
                                        onClick={() => openQuickAdd(p.id, bt.id)}
                                        className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-500 transition-all duration-150 flex items-center gap-1.5"
                                      >
                                        <span className="text-base leading-none">{cat?.icon}</span>
                                        {bt.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </>
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

      {/* ── Shared EventModal — opened from Quick-Add buttons ── */}
      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedDate={modalDate}
        selectedEvent={null}
        properties={properties}
        onSave={handleModalSave}
        onDelete={handleModalDelete}
        defaultBillType={modalDefaultBillType}
        defaultPropertyId={modalDefaultPropertyId}
        allowDelete={false}
      />
    </main>
  );
}
