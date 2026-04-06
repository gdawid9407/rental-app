"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, AlertCircle, Zap, CalendarDays, RotateCcw, ChevronDown, User, Mail, Lock, CheckCircle2, Info, X } from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { EventModal } from '../../components/EventModal';
import { PropertyKnowledgeBase } from '../../components/PropertyKnowledgeBase';
import { supabase } from '../../lib/supabase';
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

  // ── Current user ────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<{ email?: string; user_metadata?: Record<string, string> } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Edit-profile state ───────────────────────────────────────────────────
  const [editNick, setEditNick]               = useState('');
  const [editEmail, setEditEmail]             = useState('');
  const [editPass, setEditPass]               = useState('');
  const [editPassConfirm, setEditPassConfirm] = useState('');
  const [profileMsg, setProfileMsg]           = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setProfileMsg({ type, text });
    setTimeout(() => setProfileMsg(null), 4000);
  };

  const handleUpdateNick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNick.trim()) return;
    const { error } = await supabase.auth.updateUser({ data: { username: editNick.trim() } });
    if (error) showMsg('err', error.message);
    else {
      showMsg('ok', 'Nick został zaktualizowany!');
      setCurrentUser(prev => prev ? { ...prev, user_metadata: { ...(prev.user_metadata ?? {}), username: editNick.trim() } } : prev);
      setEditNick('');
    }
  };

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editEmail.trim()) return;
    const { error } = await supabase.auth.updateUser({ email: editEmail.trim() });
    if (error) showMsg('err', error.message);
    else { showMsg('ok', 'Wysłano link weryfikacyjny na nowy adres e-mail.'); setEditEmail(''); }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editPass.length < 6) { showMsg('err', 'Hasło musi mieć co najmniej 6 znaków.'); return; }
    if (editPass !== editPassConfirm) { showMsg('err', 'Hasła nie są identyczne.'); return; }
    const { error } = await supabase.auth.updateUser({ password: editPass });
    if (error) showMsg('err', error.message);
    else { showMsg('ok', 'Hasło zostało zmienione!'); setEditPass(''); setEditPassConfirm(''); }
  };


  // ── Edit-profile panel toggle ─────────────────────────────────────────────
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // ── Add-property panel toggle + newly-created tracking ────────────────────
  const [isAddPropertyOpen, setIsAddPropertyOpen] = useState(false);
  const [newlyCreatedProperty, setNewlyCreatedProperty] = useState<Property | null>(null);
  const [showPropSuccess, setShowPropSuccess] = useState(false);

  // ── Add-property form ────────────────────────────────────────────────────
  const [newPropName, setNewPropName]   = useState('');
  const [newPropColor, setNewPropColor] = useState(COLORS[0]);
  const [newPropSelectedBills, setNewPropSelectedBills] = useState<string[]>([]);
  const [newPropBillsDate, setNewPropBillsDate]         = useState(todayStr());

  const toggleNewPropBill = (id: string) => {
    setNewPropSelectedBills(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

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
      const created = await addProperty({ name: newPropName, color: newPropColor });
      
      // If bills selected, add them one by one
      if (newPropSelectedBills.length > 0) {
        for (const billId of newPropSelectedBills) {
          const cat = BILL_CATEGORIES.find(c => c.id === billId);
          await addEvent({
            title: cat?.label ?? 'Rachunek', // Added title to avoid DB NOT-NULL error
            entry_type: 'payment',
            bill_type: billId,
            property_id: created.id,
            start_date: newPropBillsDate,
            status: 'do_zapa\u0142ty',
            amount: null,
            is_planned: true
          });
        }
      }

      setNewlyCreatedProperty(created);
      setShowPropSuccess(true);
      setNewPropName('');
      setNewPropColor(COLORS[0]);
      setNewPropSelectedBills([]); // Reset selection
      setTimeout(() => setShowPropSuccess(false), 2500);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'B\u0142\u0105d');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    try {
      await updateProperty(id, { name: editName, color: editColor });
      setEditingId(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'B\u0142\u0105d');
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
      alert(err instanceof Error ? err.message : 'B\u0142\u0105d');
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
        <div className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">\u0141adowanie stanu konta...</div>
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
            <p className="text-sm text-gray-500 dark:text-slate-400">Zarz\u0105dzanie Nieruchomo\u015bciami</p>
          </div>
        </div>

        {/* ── Welcome banner ── */}
        {currentUser && (
          <div className="mx-8 mt-6 flex items-center gap-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl px-6 py-4">
            <div className="w-11 h-11 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <span className="text-white font-bold text-lg">
                {(currentUser.user_metadata?.username ?? currentUser.email ?? '?')[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-bold text-gray-900 dark:text-white">
                Cze\u015b\u0107, {currentUser.user_metadata?.username ?? 'u\u017cytkowniku'}! \ud83d\udc4b
              </p>
              <p className="text-sm text-gray-500 dark:text-slate-400">
                Zalogowany jako: <span className="font-medium text-gray-700 dark:text-slate-300">{currentUser.email}</span>
              </p>
            </div>
          </div>
        )}

        <div className="p-8 space-y-10">

          {/* ── Edycja konta (collapsible) ── */}
          <section className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-colors duration-200">
            {/* Clickable header */}
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors duration-150"
            >
              <span className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <User size={20} className="text-blue-600 dark:text-blue-400" /> Edycja konta
              </span>
              <ChevronDown
                size={18}
                className={`text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isEditProfileOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Collapsible body */}
            {isEditProfileOpen && (
              <div className="px-6 pb-6 space-y-6 border-t border-gray-200 dark:border-slate-700 pt-5">
                {/* Global feedback */}
                {profileMsg && (
                  <div className={`flex items-center gap-2 p-3 rounded-xl text-sm font-medium border ${
                    profileMsg.type === 'ok'
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                      : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
                  }`}>
                    <CheckCircle2 size={16} />
                    {profileMsg.text}
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-6">
                  {/* Nick */}
                  <form onSubmit={handleUpdateNick} className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300">
                      <User size={14} className="text-blue-500" /> Nick
                    </label>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      Aktualny: <span className="font-medium text-gray-600 dark:text-slate-400">{currentUser?.user_metadata?.username ?? '\u2014'}</span>
                    </p>
                    <input
                      type="text"
                      value={editNick}
                      onChange={e => setEditNick(e.target.value)}
                      placeholder="Nowy nick..."
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white text-sm"
                    />
                    <button type="submit" disabled={!editNick.trim()} className="w-full py-2 text-sm font-semibold bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40 transition">
                      Zapisz nick
                    </button>
                  </form>

                  {/* E-mail */}
                  <form onSubmit={handleUpdateEmail} className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300">
                      <Mail size={14} className="text-blue-500" /> Adres e-mail
                    </label>
                    <p className="text-xs text-gray-400 dark:text-slate-500">
                      Aktualny: <span className="font-medium text-gray-600 dark:text-slate-400">{currentUser?.email ?? '\u2014'}</span>
                    </p>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={e => setEditEmail(e.target.value)}
                      placeholder="Nowy e-mail..."
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white text-sm"
                    />
                    <button type="submit" disabled={!editEmail.trim()} className="w-full py-2 text-sm font-semibold bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40 transition">
                      Zapisz e-mail
                    </button>
                  </form>

                  {/* Password */}
                  <form onSubmit={handleUpdatePassword} className="space-y-2">
                    <label className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-slate-300">
                      <Lock size={14} className="text-blue-500" /> Has\u0142o
                    </label>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Ustaw nowe has\u0142o (min. 6 znak\u00f3w)</p>
                    <input
                      type="password"
                      value={editPass}
                      onChange={e => setEditPass(e.target.value)}
                      placeholder="Nowe has\u0142o..."
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white text-sm"
                    />
                    <input
                      type="password"
                      value={editPassConfirm}
                      onChange={e => setEditPassConfirm(e.target.value)}
                      placeholder="Powt\u00f3rz has\u0142o..."
                      className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-gray-900 dark:text-white text-sm"
                    />
                    <button type="submit" disabled={!editPass || !editPassConfirm} className="w-full py-2 text-sm font-semibold bg-blue-600 dark:bg-blue-500 text-white rounded-xl hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-40 transition">
                      Zmie\u0144 has\u0142o
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>

          {/* ── Dodaj Swoje Mieszkanie (collapsible) ── */}
          <section className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden transition-colors duration-200">
            {/* Clickable header */}
            <button
              type="button"
              onClick={() => { setIsAddPropertyOpen(prev => !prev); setNewlyCreatedProperty(null); }}
              className="w-full flex items-center justify-between px-6 py-5 hover:bg-gray-100 dark:hover:bg-slate-800/60 transition-colors duration-150"
            >
              <span className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Plus size={20} className="text-blue-600 dark:text-blue-400" /> Dodaj Swoje Mieszkanie
              </span>
              <ChevronDown
                size={18}
                className={`text-gray-400 dark:text-slate-500 transition-transform duration-200 ${isAddPropertyOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Collapsible body */}
            {isAddPropertyOpen && (
              <div className="px-6 pb-6 border-t border-gray-200 dark:border-slate-700 pt-5 space-y-5">

                {/* Property form — hidden once a property was just created */}
                {!newlyCreatedProperty ? (
                  <form onSubmit={handleCreate} className="space-y-6">
                    {/* Basic details */}
                    <div className="flex flex-col md:flex-row gap-4 items-end">
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
                        <div className="flex gap-2 p-1.5 border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-xl shadow-sm">
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
                    </div>

                    {/* Integrated Quick Bills Section */}
                    <div className="bg-white/50 dark:bg-black/20 border border-gray-200 dark:border-slate-700 rounded-2xl p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Zap size={14} className="text-amber-400" />
                          Rachunki na start (opcjonalnie)
                        </p>
                        <div className="flex items-center gap-2">
                          <CalendarDays size={14} className="text-slate-400" />
                          <input
                            type="date"
                            value={newPropBillsDate}
                            onChange={e => setNewPropBillsDate(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          />
                          {newPropBillsDate !== todayStr() && (
                            <button
                              type="button"
                              onClick={() => setNewPropBillsDate(todayStr())}
                              title="Resetuj do dzisiaj"
                              className="p-1 rounded-md text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            >
                              <RotateCcw size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {BILL_CATEGORIES.map(cat => {
                          const isSelected = newPropSelectedBills.includes(cat.id);
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => toggleNewPropBill(cat.id)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all duration-150 flex items-center gap-1.5 shadow-sm ${
                                isSelected
                                  ? 'bg-blue-600 dark:bg-blue-500 text-white border-blue-600 dark:border-blue-400 scale-105'
                                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                              }`}
                            >
                              <span className="text-base leading-none">{cat.icon}</span>
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-slate-500 italic">
                        * Zaznaczone rachunki zostan\u0105 automatycznie dodane do kalendarza na powy\u017csz\u0105 dat\u0119.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={!newPropName.trim()}
                      className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition shadow-lg dark:bg-blue-500 dark:hover:bg-blue-600"
                    >
                      DODAJ MIESZKANIE {newPropSelectedBills.length > 0 && `(+ ${newPropSelectedBills.length} RACHUNKI)`}
                    </button>
                  </form>
                ) : (
                  /* ── Quick-add for newly created property ── */
                  <div className="space-y-4">
                    {/* Success banner — fades out after 2.5 seconds */}
                    <div className={`transition-all duration-1000 ease-in-out overflow-hidden ${
                      showPropSuccess ? 'max-h-20 opacity-100 mb-4 translate-y-0' : 'max-h-0 opacity-0 mb-0 -translate-y-2'
                    }`}>
                      <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-xl">
                        <span
                          className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: newlyCreatedProperty.color }}
                        />
                        <p className="text-sm font-semibold text-green-800 dark:text-green-400">
                          Dodano: {newlyCreatedProperty.name} \u2705
                        </p>
                      </div>
                    </div>

                    {/* Quick-add strip */}
                    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                          <Zap size={12} className="text-amber-400" />
                          Szybkie dodawanie rachunku
                        </p>
                        <div className="flex items-center gap-1">
                          <CalendarDays size={13} className="text-slate-400" />
                          <input
                            type="date"
                            value={getCardDate(newlyCreatedProperty.id)}
                            onChange={e => setCardDate(newlyCreatedProperty.id, e.target.value)}
                            className="bg-transparent border-none outline-none text-xs text-slate-600 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          />
                          {!isCardDateToday(newlyCreatedProperty.id) && (
                            <button
                              onClick={() => resetCardDate(newlyCreatedProperty.id)}
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
                              onClick={() => openQuickAdd(newlyCreatedProperty.id, bt.id)}
                              className="px-3 py-1.5 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all duration-150 flex items-center gap-1.5"
                            >
                              <span className="text-base leading-none">{cat?.icon}</span>
                              {bt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Add another */}
                    <button
                      type="button"
                      onClick={() => setNewlyCreatedProperty(null)}
                      className="w-full py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 transition"
                    >
                      + Dodaj kolejne mieszkanie
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* ── Lista Nieruchomości ── */}
          <section>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4">
              Zdefiniowane Nieruchomo\u015bci ({properties.length})
            </h2>

            {properties.length === 0 ? (
              <div className="text-center p-8 bg-gray-50 dark:bg-slate-800/50 border border-dashed border-gray-300 dark:border-slate-700 rounded-2xl text-gray-500 dark:text-slate-400">
                Nie doda\u0142e\u015b jeszcze \u017cadnego mieszkania.
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
                              <AlertCircle size={20} /> Co zrobi\u0107 z powi\u0105zanymi rachunkami?
                            </h3>
                            <div className="space-y-3">
                              <button
                                onClick={() => executeDelete(p.id, true)}
                                className="w-full text-left p-3 bg-white dark:bg-slate-800 hover:bg-orange-100 dark:hover:bg-orange-900/50 rounded-lg border border-orange-100 dark:border-orange-800/50 transition shadow-sm"
                              >
                                <span className="block font-semibold text-gray-800 dark:text-slate-100">Tylko usu\u0144 mieszkanie \u2705</span>
                                <span className="block text-xs text-gray-500 dark:text-slate-400 mt-1">Rachunki i op\u0142aty zostan\u0105 w kalendarzu (otrzymaj\u0105 status Etykiety: --Brak--)</span>
                              </button>
                              <button
                                onClick={() => executeDelete(p.id, false)}
                                className="w-full text-left p-3 bg-white dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50 transition shadow-sm group"
                              >
                                <span className="block font-semibold text-red-600 dark:text-red-400 group-hover:text-red-700">Usu\u0144 ca\u0142kowicie z rachunkami \ud83d\uddd1</span>
                                <span className="block text-xs text-red-400 dark:text-red-500/80 mt-1">Powi\u0105zane wpisy w kalendarzu zostan\u0105 skasowane. Dzia\u0142ania nie da si\u0119 cofn\u0105\u0107!</span>
                              </button>
                            </div>
                            <button onClick={() => setDeletingId(null)} className="w-full mt-3 p-2 text-sm text-gray-600 dark:text-slate-300 font-medium hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg">
                              Odrzu\u0107 i wr\u00f3\u0107
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* ── Card top row ── */}
                            <div 
                              onClick={() => toggleExpanded(p.id)}
                              className="px-5 pt-5 pb-4 flex justify-between items-center cursor-pointer transition-colors duration-200 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-t-2xl group/row"
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className="w-3.5 h-3.5 rounded-full shadow-sm flex-shrink-0 transition-transform group-hover/row:scale-110"
                                  style={{ backgroundColor: p.color }}
                                />
                                <span className="font-bold text-lg text-gray-800 dark:text-slate-100 transition-colors group-hover/row:text-blue-600 dark:group-hover/row:text-blue-400">
                                  {p.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {/* Only show Edit/Delete, Zamknij removed as requested */}
                                <button
                                  onClick={(e) => { e.stopPropagation(); startEdit(p); }}
                                  className="p-2 text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition"
                                  title="Edytuj"
                                >
                                  <Edit2 size={17} />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setDeletingId(p.id); }}
                                  className="p-2 text-gray-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition"
                                  title="Usu\u0144"
                                >
                                  <Trash2 size={17} />
                                </button>
                              </div>
                            </div>

                            {/* ── Expanded Section (Accordion Style) ── */}
                            <div 
                              className={`grid transition-all duration-500 ease-in-out ${
                                isExpanded(p.id) ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                              }`}
                            >
                              <div className="min-h-0 overflow-hidden">
                                <div className="px-5 pb-6 border-t border-gray-100 dark:border-slate-700/50 space-y-8">
                                  
                                  {/* 1. Knowledge Base Section */}
                                  <div className="pt-6">
                                    <PropertyKnowledgeBase property={p} />
                                  </div>

                                  <div className="h-px bg-slate-100 dark:bg-slate-800/80 mx-2" />

                                  {/* 2. Quick Add Section (Existing) */}
                                  <div>
                                    <div className="flex items-center justify-between mb-4">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                        <Zap size={12} className="text-amber-400" />
                                        Szybkie dodawanie rachunku
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <CalendarDays size={13} className="text-slate-400" />
                                        <input
                                          type="date"
                                          value={getCardDate(p.id)}
                                          onChange={e => setCardDate(p.id, e.target.value)}
                                          className="bg-transparent border-none outline-none text-[11px] font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                        />
                                        {!isCardDateToday(p.id) && (
                                          <button
                                            onClick={(e) => { e.stopPropagation(); resetCardDate(p.id); }}
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
                                            onClick={(e) => { e.stopPropagation(); openQuickAdd(p.id, bt.id); }}
                                            className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150 flex items-center gap-1.5 shadow-sm"
                                          >
                                            <span className="text-base leading-none">{cat?.icon}</span>
                                            {bt.label}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
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
