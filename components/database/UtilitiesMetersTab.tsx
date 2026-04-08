"use client";
import React, { useState } from 'react';
import { Gauge, Plus, Calendar, ArrowUpRight, ArrowDownRight, Zap, Droplets, Flame, Trash2, Receipt, Clock, CheckCircle2, AlertCircle, ChevronDown, ChevronRight, Filter } from 'lucide-react';
import { Property, MeterReading, BILL_CATEGORIES, BillType } from '../../types/calendar';
import { usePropertyDetails } from '../../hooks/usePropertyDetails';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { useBillCategories } from '../../hooks/useBillCategories';
import { supabase } from '../../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';

interface UtilitiesMetersTabProps {
  property: Property;
}

type TimeFilter = 'all' | 'past' | 'current' | 'future';
type StatusFilter = 'all' | 'opłacone' | 'pending';
type ViewMode = 'bills' | 'meters';

export function UtilitiesMetersTab({ property }: UtilitiesMetersTabProps) {
  const { readings, isLoading: isDetailsLoading, addReading, refresh } = usePropertyDetails(property.id);
  const { events, isLoading: isEventsLoading } = useCalendarEvents();
  const { allCategories, isLoading: isCategoriesLoading } = useBillCategories();
  const [viewMode, setViewMode] = useState<ViewMode>('bills');
  const [isAddingReading, setIsAddingReading] = useState(false);
  
  // Open states for filters
  const [openFilter, setOpenFilter] = useState<'status' | 'time' | 'category' | 'meter' | null>(null);

  // Filters - Bills
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [billTypeFilter, setBillTypeFilter] = useState<BillType | 'all'>('all');

  // Filters - Meters
  const [meterTypeFilter, setMeterTypeFilter] = useState<MeterReading['type'] | 'all'>('all');

  // Form state for readings
  const [type, setType] = useState<'prad' | 'gaz' | 'woda' | 'cieplo'>('prad');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If no value, we could either alert or allow it depending on DB schema.
    // Given the user wants to leave it empty, we treat as no-op or handle appropriately.
    if (!value) {
      alert("Proszę podać stan licznika lub dane nie zostaną zapisane.");
      return;
    }

    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      alert("Stan licznika musi być liczbą.");
      return;
    }

    try {
      await addReading({
        type,
        value: numericValue,
        date
      });
      setIsAddingReading(false);
      setValue('');
    } catch (err: any) {
      alert("Wystąpił błąd podczas dodawania odczytu: " + err.message);
    }
  };

  const handleDeleteReading = async (id: string) => {
    if (!confirm("Czy na pewno chcesz usunąć ten odczyt?")) return;
    const { error } = await supabase.from('meter_readings').delete().eq('id', id);
    if (error) alert(error.message);
    else refresh();
  };

  const getMeterIcon = (type: string) => {
    switch(type) {
      case 'prad': return <Zap size={14} className="text-amber-500" />;
      case 'woda': return <Droplets size={14} className="text-blue-500" />;
      case 'gaz': return <Flame size={14} className="text-red-500" />;
      default: return <Gauge size={14} className="text-gray-500" />;
    }
  };

  const getMeterLabel = (type: string) => {
    switch(type) {
      case 'prad': return 'Energia elektryczna';
      case 'woda': return 'Woda';
      case 'gaz': return 'Gaz';
      case 'cieplo': return 'Ciepło';
      default: return type;
    }
  };

  const getTrend = (reading: MeterReading) => {
    if (!reading.previous_value) return <span className="text-gray-300 text-[10px]">—</span>;
    const diff = reading.value - reading.previous_value;
    const isActuallyMore = diff > 0;
    
    return (
      <div className="flex items-center gap-1">
        {isActuallyMore ? <ArrowUpRight size={14} className="text-red-400" /> : <ArrowDownRight size={14} className="text-green-500" />}
        <span className={`text-[10px] font-bold ${isActuallyMore ? 'text-red-400' : 'text-green-500'}`}>
          {Math.abs(diff).toLocaleString(undefined, { minimumFractionDigits: 1 })}
        </span>
      </div>
    );
  };

  // Filter bills for this property
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const filteredBills = events
    .filter(e => e.extendedProps.propertyId === property.id && e.extendedProps.type === 'payment')
    .filter(bill => {
      // Status filter
      if (statusFilter === 'opłacone' && bill.extendedProps.status !== 'opłacone') return false;
      if (statusFilter === 'pending' && bill.extendedProps.status === 'opłacone') return false;

      // Type filter
      if (billTypeFilter !== 'all' && bill.extendedProps.billType !== billTypeFilter) return false;

      // Time filter
      const billDate = new Date(bill.start);
      if (timeFilter === 'past') {
        const lastDayOfLastMonth = new Date(currentYear, currentMonth, 0);
        if (billDate > lastDayOfLastMonth) return false;
      }
      if (timeFilter === 'future') {
        const firstDayOfNextMonth = new Date(currentYear, currentMonth + 1, 1);
        if (billDate < firstDayOfNextMonth) return false;
      }
      if (timeFilter === 'current') {
        if (billDate.getMonth() !== currentMonth || billDate.getFullYear() !== currentYear) return false;
      }

      return true;
    })
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

  // Filter readings
  const filteredReadings = readings
    .filter(r => meterTypeFilter === 'all' || r.type === meterTypeFilter);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'opłacone':
        return <span className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-lg uppercase tracking-wider"><CheckCircle2 size={12} /> Opłacone</span>;
      case 'do_zapłaty':
        return <span className="flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[10px] font-bold rounded-lg uppercase tracking-wider"><AlertCircle size={12} /> Do zapłaty</span>;
      case 'planowany':
        return <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-bold rounded-lg uppercase tracking-wider"><Clock size={12} /> Planowany</span>;
      default:
        return null;
    }
  };

  const getBillCategoryIcon = (billType: string) => {
    const cat = allCategories.find(c => c.id === billType);
    return cat ? cat.icon : '📄';
  };

  if (isDetailsLoading || isEventsLoading || isCategoriesLoading) return <div className="py-20 text-center animate-pulse text-gray-400">Ładowanie danych...</div>;

  const activeBillCategory = billTypeFilter === 'all' ? 'Wszystkie Kategorie' : allCategories.find(c => c.id === billTypeFilter)?.label;
  const activeStatus = statusFilter === 'all' ? 'Wszystkie Statusy' : statusFilter === 'opłacone' ? 'Opłacone' : 'Oczekujące';
  const activeTime = timeFilter === 'all' ? 'Kiedykolwiek' : timeFilter === 'past' ? 'Przeszłość' : timeFilter === 'current' ? 'Ten miesiąc' : 'Przyszłość';
  const activeMeter = meterTypeFilter === 'all' ? 'Wszystkie Liczniki' : getMeterLabel(meterTypeFilter);

  return (
    <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300 font-sans">
      
      {/* ── VIEW MULTIPLEXER ── */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-gray-100 dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
          <button
            onClick={() => { setViewMode('bills'); setOpenFilter(null); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${
              viewMode === 'bills' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-amber-400 shadow-md transform scale-[1.02]' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
            }`}
          >
            <Receipt size={16} /> Historia Rachunków
          </button>
          <button
            onClick={() => { setViewMode('meters'); setOpenFilter(null); }}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase flex items-center gap-2 transition-all ${
              viewMode === 'meters' 
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-amber-400 shadow-md transform scale-[1.02]' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-200'
            }`}
          >
            <Gauge size={16} /> Historia Odczytów
          </button>
        </div>
      </div>

      <div className="min-h-[400px]">
        {viewMode === 'meters' ? (
          /* ── SECTION 1: METER READINGS ── */
          <section className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-slate-800/50 pb-4">
              <h3 className="text-xl font-black text-gray-800 dark:text-slate-100 flex items-center gap-3">
                <Gauge size={24} className="text-blue-500" /> Odczyty Liczników
              </h3>
              
              <div className="flex flex-row items-center gap-3">
                {/* Meter Expandable Filter (SIDEWAYS) */}
                <div className="relative flex items-center bg-gray-100 dark:bg-slate-800/50 rounded-xl p-0.5 border border-gray-200 dark:border-slate-700 shadow-inner overflow-hidden">
                  <button 
                    onClick={() => setOpenFilter(openFilter === 'meter' ? null : 'meter')}
                    className={`px-4 py-2 text-[10px] font-black uppercase rounded-lg transition-all flex items-center gap-2 ${
                      openFilter === 'meter' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-blue-600 dark:text-slate-400'
                    }`}
                  >
                    <Filter size={12} /> {activeMeter}
                    <motion.div animate={{ rotate: openFilter === 'meter' ? 90 : 0 }}>
                      <ChevronRight size={14} />
                    </motion.div>
                  </button>
                  
                  <AnimatePresence>
                    {openFilter === 'meter' && (
                      <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 'auto', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="flex items-center gap-1 px-2 border-l border-gray-200 dark:border-slate-700 ml-1 overflow-hidden"
                      >
                        {([ 'all', 'prad', 'gaz', 'woda', 'cieplo'] as const).map(f => (
                          <button
                            key={f}
                            onClick={() => { setMeterTypeFilter(f); setOpenFilter(null); }}
                            className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all whitespace-nowrap ${
                              meterTypeFilter === f 
                                ? 'text-blue-600 dark:text-amber-400' 
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {f === 'all' ? 'Wszystkie' : f === 'prad' ? 'Prąd' : f === 'gaz' ? 'Gaz' : f === 'woda' ? 'Woda' : 'Ciepło'}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button 
                  onClick={() => setIsAddingReading(!isAddingReading)}
                  className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
                    isAddingReading 
                      ? 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400' 
                      : 'bg-blue-600 dark:bg-blue-500 text-white shadow-lg hover:bg-blue-700'
                  }`}
                >
                  {isAddingReading ? 'Anuluj' : <><Plus size={16} /> Dodaj Odczyt</>}
                </button>
              </div>
            </div>

            {isAddingReading && (
              <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-2 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">Typ Licznika</label>
                    <select 
                      value={type}
                      onChange={(e) => setType(e.target.value as any)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-white"
                    >
                      <option value="prad">⚡ Prąd (kWh)</option>
                      <option value="woda">💧 Woda (m³)</option>
                      <option value="gaz">🔥 Gaz (m³)</option>
                      <option value="cieplo">🌡️ Ciepło (GJ)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">Stan Licznika</label>
                    <input 
                      type="number"
                      step="any"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-white shadow-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 ml-1">Data Odczytu</label>
                    <input 
                      type="date"
                      required
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-white shadow-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" className="px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white text-sm font-black rounded-xl hover:bg-blue-700 transition shadow-xl transform active:scale-95">
                    ZAPISZ ODCZYT
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-hidden border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm bg-white dark:bg-slate-900/40">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
                    <th className="px-6 py-4 font-bold text-gray-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">Typ</th>
                    <th className="px-6 py-4 font-bold text-gray-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">Data</th>
                    <th className="px-6 py-4 font-bold text-gray-400 dark:text-slate-500 text-[10px] uppercase tracking-wider text-right">Stan</th>
                    <th className="px-6 py-4 font-bold text-gray-400 dark:text-slate-500 text-[10px] uppercase tracking-wider text-center">Zużycie</th>
                    <th className="px-6 py-4 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filteredReadings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400 italic">Brak zapisanych odczytów</td>
                    </tr>
                  ) : (
                    filteredReadings.map(reading => (
                      <tr key={reading.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group animate-in fade-in duration-300">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             {getMeterIcon(reading.type)}
                             <span className="font-bold dark:text-slate-200">{getMeterLabel(reading.type)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500 dark:text-slate-400 font-medium font-medium">
                          <Calendar size={12} className="inline mr-1.5 opacity-40" /> {reading.date}
                        </td>
                        <td className="px-6 py-4 text-right font-black dark:text-white text-base font-black dark:text-white text-base">
                          {reading.value.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center">
                            {getTrend(reading)}
                          </div>
                        </td>
                        <td className="px-3 py-4">
                          <button onClick={() => handleDeleteReading(reading.id)} className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        ) : (
          /* ── SECTION 2: BILL HISTORY ── */
          <section className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col gap-6">
              <h3 className="text-xl font-black text-gray-800 dark:text-slate-100 flex items-center gap-3">
                <Receipt size={24} className="text-emerald-500" /> Rachunki i Opłaty
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* 1. Category Dropdown */}
                <div className="relative group">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Kategoria</label>
                  <button 
                    onClick={() => setOpenFilter(openFilter === 'category' ? null : 'category')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-700 dark:text-slate-200 hover:border-emerald-500 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Filter size={14} className="text-emerald-500" />
                      {activeBillCategory}
                    </div>
                    <motion.div animate={{ rotate: openFilter === 'category' ? 180 : 0 }}>
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFilter === 'category' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto scrollbar-hide"
                      >
                        <button
                          onClick={() => { setBillTypeFilter('all'); setOpenFilter(null); }}
                          className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-600 dark:text-slate-400 transition-colors font-black uppercase tracking-wider"
                        >
                          Wszystkie kategorie
                        </button>
                        {allCategories.map(cat => (
                          <button
                            key={cat.id}
                            onClick={() => { setBillTypeFilter(cat.id); setOpenFilter(null); }}
                            className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-600 dark:text-slate-300 flex items-center gap-3 transition-colors font-black uppercase tracking-wider"
                          >
                            <span>{cat.icon}</span> {cat.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2. Status Dropdown */}
                <div className="relative group">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Status Płatności</label>
                  <button 
                    onClick={() => setOpenFilter(openFilter === 'status' ? null : 'status')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-700 dark:text-slate-200 hover:border-emerald-500 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      {activeStatus}
                    </div>
                    <motion.div animate={{ rotate: openFilter === 'status' ? 180 : 0 }}>
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFilter === 'status' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden py-1"
                      >
                        {(['all', 'opłacone', 'pending'] as StatusFilter[]).map(f => (
                          <button
                            key={f}
                            onClick={() => { setStatusFilter(f); setOpenFilter(null); }}
                            className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-gray-600 dark:text-slate-300 transition-colors font-black uppercase tracking-wider"
                          >
                            {f === 'all' ? 'Wszystkie statusy' : f === 'opłacone' ? 'Zapłacone' : 'Oczekujące'}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 3. Time Dropdown */}
                <div className="relative group">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Okres Czasowy</label>
                  <button 
                    onClick={() => setOpenFilter(openFilter === 'time' ? null : 'time')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-gray-700 dark:text-slate-200 hover:border-blue-500 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-blue-500" />
                      {activeTime}
                    </div>
                    <motion.div animate={{ rotate: openFilter === 'time' ? 180 : 0 }}>
                      <ChevronDown size={16} />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {openFilter === 'time' && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute z-50 mt-2 w-full bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden py-1"
                      >
                        {(['all', 'past', 'current', 'future'] as TimeFilter[]).map(f => (
                          <button
                            key={f}
                            onClick={() => { setTimeFilter(f); setOpenFilter(null); }}
                            className="w-full px-4 py-3 text-left text-xs font-bold hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-600 dark:text-slate-300 transition-colors font-black uppercase tracking-wider"
                          >
                            {f === 'all' ? 'Kiedykolwiek' : f === 'past' ? 'Przeszłość' : f === 'current' ? 'Ten miesiąc' : 'Przyszłość'}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            </div>

            <div className="overflow-hidden border border-gray-100 dark:border-slate-800 rounded-3xl shadow-lg bg-white dark:bg-slate-900/40 mt-4">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-emerald-50/30 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
                    <th className="px-6 py-4 font-bold text-gray-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">Miesiąc / Data</th>
                    <th className="px-6 py-4 font-bold text-gray-400 dark:text-slate-500 text-[10px] uppercase tracking-wider">Kategoria / Tytuł</th>
                    <th className="px-6 py-4 font-bold text-gray-400 dark:text-slate-500 text-[10px] uppercase tracking-wider text-right">Kwota</th>
                    <th className="px-6 py-4 font-bold text-gray-400 dark:text-slate-500 text-[10px] uppercase tracking-wider text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
                  {filteredBills.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-20 text-center text-gray-400 italic font-medium">Brak rachunków spełniających kryteria filtrowania</td>
                    </tr>
                  ) : (
                    filteredBills.map(bill => (
                      <tr key={bill.id} className="hover:bg-emerald-50/20 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in duration-300 group">
                        <td className="px-6 py-4 font-bold dark:text-slate-200">
                          <div className="flex items-center gap-2">
                             <Clock size={14} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                             {new Date(bill.start).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                             <span className="text-[10px] font-normal text-gray-400 ml-1">({bill.start})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-lg shadow-sm border border-gray-100 dark:border-slate-700">
                              {getBillCategoryIcon(bill.extendedProps.billType || 'inny')}
                            </div>
                            <div>
                              <span className="font-bold block dark:text-white leading-tight">
                                {allCategories.find(c => c.id === bill.extendedProps.billType)?.label || 'Inny'}
                              </span>
                              {bill.extendedProps.rawTitle && bill.extendedProps.rawTitle !== allCategories.find(c => c.id === bill.extendedProps.billType)?.label && (
                                <span className="text-[10px] text-gray-400 dark:text-slate-500 italic block mt-0.5 font-black uppercase tracking-wider text-[8px]">{bill.extendedProps.rawTitle}</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {bill.extendedProps.amount !== null ? (
                            <span className="font-black dark:text-white text-base">
                              {bill.extendedProps.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <small className="text-[10px] opacity-60">PLN</small>
                            </span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">Do ustalenia</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            {getStatusBadge(bill.extendedProps.status)}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
