"use client";
import React, { useState } from 'react';
import { Gauge, Plus, Calendar, ArrowUpRight, ArrowDownRight, History, Zap, Droplets, Flame, Trash2, Receipt, Clock, Wallet, CheckCircle2, AlertCircle, Filter, Search } from 'lucide-react';
import { Property, MeterReading, BILL_CATEGORIES } from '../../types/calendar';
import { usePropertyDetails } from '../../hooks/usePropertyDetails';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';
import { supabase } from '../../lib/supabase';

interface UtilitiesMetersTabProps {
  property: Property;
}

type TimeFilter = 'all' | 'past' | 'current' | 'future';
type StatusFilter = 'all' | 'opłacone' | 'pending';

export function UtilitiesMetersTab({ property }: UtilitiesMetersTabProps) {
  const { readings, isLoading: isDetailsLoading, addReading, refresh } = usePropertyDetails(property.id);
  const { events, isLoading: isEventsLoading } = useCalendarEvents();
  const [isAddingReading, setIsAddingReading] = useState(false);
  
  // Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Form state for readings
  const [type, setType] = useState<'prad' | 'gaz' | 'woda' | 'cieplo'>('prad');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addReading({
        type,
        value: parseFloat(value),
        date
      });
      setIsAddingReading(false);
      setValue('');
    } catch (err: any) {
      alert(err.message);
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
    const cat = BILL_CATEGORIES.find(c => c.id === billType);
    return cat ? cat.icon : '📄';
  };

  if (isDetailsLoading || isEventsLoading) return <div className="py-20 text-center animate-pulse text-gray-400">Ładowanie historii mediów...</div>;

  return (
    <div className="space-y-12 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* ── SECTION 1: METER READINGS ── */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Gauge size={20} className="text-blue-500" /> Historia Odczytów Liczników
          </h3>
          <button 
            onClick={() => setIsAddingReading(!isAddingReading)}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              isAddingReading 
                ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400' 
                : 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm hover:bg-blue-700'
            }`}
          >
            {isAddingReading ? 'Anuluj' : <><Plus size={14} /> Dodaj Odczyt</>}
          </button>
        </div>

        {isAddingReading && (
          <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Typ Licznika</label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-white"
                >
                  <option value="prad">⚡ Prąd (kWh)</option>
                  <option value="woda">💧 Woda (m³)</option>
                  <option value="gaz">🔥 Gaz (m³)</option>
                  <option value="cieplo">🌡️ Ciepło (GJ)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Stan Licznika</label>
                <input 
                  type="number"
                  step="0.01"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 ml-1">Data Odczytu</label>
                <input 
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="px-8 py-2.5 bg-blue-600 dark:bg-blue-500 text-white text-sm font-black rounded-xl hover:bg-blue-700 transition shadow-lg">
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
              {readings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400 italic">Brak zapisanych odczytów</td>
                </tr>
              ) : (
                readings.map(reading => (
                  <tr key={reading.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getMeterIcon(reading.type)}
                        <span className="font-bold dark:text-slate-200">{getMeterLabel(reading.type)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 align-middle font-medium">
                        <Calendar size={12} className="opacity-40" /> {reading.date}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-black dark:text-white text-base">
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

      {/* ── SECTION 2: BILL HISTORY ── */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="text-base font-black text-gray-800 dark:text-slate-100 flex items-center gap-2">
            <Receipt size={20} className="text-emerald-500" /> Historia Rachunków i Opłat
          </h3>
          
          <div className="flex flex-wrap gap-2">
            {/* Time Filter */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['all', 'past', 'current', 'future'] as TimeFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    timeFilter === f 
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-amber-400 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {f === 'all' ? 'Wszystkie' : f === 'past' ? 'Przeszłe' : f === 'current' ? 'Ten miesiąc' : 'Przyszłe'}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
              {(['all', 'opłacone', 'pending'] as StatusFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${
                    statusFilter === f 
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {f === 'all' ? 'Wszystkie' : f === 'opłacone' ? 'Zapłacone' : 'Oczekujące'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-hidden border border-gray-100 dark:border-slate-800 rounded-3xl shadow-sm bg-white dark:bg-slate-900/40">
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
                  <td colSpan={4} className="py-12 text-center text-gray-400 italic font-medium">Brak rachunków spełniających kryteria filtrowania</td>
                </tr>
              ) : (
                filteredBills.map(bill => (
                  <tr key={bill.id} className="hover:bg-emerald-50/20 dark:hover:bg-slate-800/30 transition-colors animate-in fade-in duration-300">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-bold dark:text-slate-200">
                        <Clock size={14} className="text-gray-400" />
                        {new Date(bill.start).toLocaleDateString('pl-PL', { month: 'long', year: 'numeric' })}
                        <span className="text-[10px] font-normal text-gray-400 ml-1">({bill.start})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-lg shadow-sm border border-gray-100 dark:border-slate-700">
                          {getBillCategoryIcon(bill.extendedProps.billType)}
                        </div>
                        <div>
                          <span className="font-bold block dark:text-white leading-tight">
                            {BILL_CATEGORIES.find(c => c.id === bill.extendedProps.billType)?.label || 'Inny'}
                          </span>
                          {bill.extendedProps.rawTitle && bill.extendedProps.rawTitle !== BILL_CATEGORIES.find(c => c.id === bill.extendedProps.billType)?.label && (
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 italic block">{bill.extendedProps.rawTitle}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {bill.extendedProps.amount !== null ? (
                        <span className="font-black dark:text-white text-base">
                          {bill.extendedProps.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <small className="text-[10px]">PLN</small>
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
        
        <div className="flex justify-center">
          <button 
            onClick={() => { setTimeFilter('all'); setStatusFilter('all'); }}
            className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-blue-500 transition-colors"
          >
            Wyczyść filtry
          </button>
        </div>
      </section>

    </div>
  );
}
