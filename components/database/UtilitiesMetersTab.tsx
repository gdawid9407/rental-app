"use client";
import React, { useState } from 'react';
import { Gauge, Plus, Calendar, ArrowUpRight, ArrowDownRight, History, Zap, Droplets, Flame } from 'lucide-react';
import { Property, MeterReading } from '../../types/calendar';

interface UtilitiesMetersTabProps {
  property: Property;
}

const MOCK_READINGS: MeterReading[] = [
  { id: '1', property_id: 'any', type: 'prad', value: 12450.5, date: '2026-04-01', previous_value: 12380.2 },
  { id: '2', property_id: 'any', type: 'woda', value: 452.3, date: '2026-03-28', previous_value: 448.1 },
  { id: '3', property_id: 'any', type: 'gaz', value: 890.1, date: '2026-03-25', previous_value: 895.4 },
];

export function UtilitiesMetersTab({ property }: UtilitiesMetersTabProps) {
  const [readings, setReadings] = useState<MeterReading[]>(MOCK_READINGS);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form state
  const [type, setType] = useState<'prad' | 'gaz' | 'woda' | 'cieplo'>('prad');
  const [value, setValue] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReading: MeterReading = {
      id: Math.random().toString(36).substr(2, 9),
      property_id: property.id,
      type,
      value: parseFloat(value),
      date,
      previous_value: readings.find(r => r.type === type)?.value
    };
    setReadings([newReading, ...readings]);
    setIsAdding(false);
    setValue('');
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'prad': return <Zap size={14} className="text-amber-500" />;
      case 'woda': return <Droplets size={14} className="text-blue-500" />;
      case 'gaz': return <Flame size={14} className="text-red-500" />;
      default: return <Gauge size={14} className="text-gray-500" />;
    }
  };

  const getLabel = (type: string) => {
    switch(type) {
      case 'prad': return 'Energia elektryczna';
      case 'woda': return 'Woda';
      case 'gaz': return 'Gaz';
      case 'cieplo': return 'Ciepło';
      default: return type;
    }
  };

  const getTrend = (reading: MeterReading) => {
    if (!reading.previous_value) return null;
    const diff = reading.value - reading.previous_value;
    if (diff > 0) return <ArrowUpRight size={14} className="text-red-500" />;
    if (diff < 0) return <ArrowDownRight size={14} className="text-green-500" />;
    return <span className="text-gray-400 text-xs">-</span>;
  };

  return (
    <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header with Add Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          <History size={16} className="text-blue-500" /> Historia Odczytów
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            isAdding 
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400' 
              : 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm hover:bg-blue-700'
          }`}
        >
          {isAdding ? 'Anuluj' : <><Plus size={14} /> Dodaj Odczyt</>}
        </button>
      </div>

      {/* Add Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1.5 ml-1">Typ Licznika</label>
              <select 
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="prad">Prąd (kWh)</option>
                <option value="woda">Woda (m³)</option>
                <option value="gaz">Gaz (m³)</option>
                <option value="cieplo">Ciepło (GJ)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1.5 ml-1">Wartość</label>
              <input 
                type="number"
                step="0.01"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-1.5 ml-1">Data Odczytu</label>
              <input 
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-500"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition shadow-md">
              Zapisz Odczyt
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="overflow-hidden border border-gray-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900/40">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/60 border-b border-gray-100 dark:border-slate-700">
              <th className="px-4 py-3 font-bold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Typ</th>
              <th className="px-4 py-3 font-bold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider">Data</th>
              <th className="px-4 py-3 font-bold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider text-right">Wartość</th>
              <th className="px-4 py-3 font-bold text-gray-500 dark:text-slate-400 text-xs uppercase tracking-wider text-center">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
            {readings.map(reading => (
              <tr key={reading.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getIcon(reading.type)}
                    <span className="font-semibold dark:text-slate-200">{getLabel(reading.type)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Calendar size={12} /> {reading.date}
                </td>
                <td className="px-4 py-3 text-right font-bold dark:text-white">
                  {reading.value.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center">
                    {getTrend(reading)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
