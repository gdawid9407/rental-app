"use client";
import React from 'react';
import { User, Calendar, Shield, AlertCircle, Phone, CreditCard, FileText } from 'lucide-react';
import { Property, LeaseInfo } from '../../types/calendar';

interface TenantLeaseTabProps {
  property: Property;
}

export function TenantLeaseTab({ property }: TenantLeaseTabProps) {
  // Mock data for now as requested
  const lease: LeaseInfo = {
    id: 'mock-lease-1',
    property_id: property.id,
    tenant_name: 'Jan Kowalski',
    tenant_contact: '+48 123 456 789',
    lease_start: '2024-01-01',
    lease_end: '2024-12-31',
    insurance_expiry: '2026-04-15', // Close to today's date in context (2026-04-08)
    insurance_company: 'PZU S.A.',
    insurance_policy_number: 'POL/998877/2026',
    rent_amount: 2500,
  };

  const isInsuranceExpiring = () => {
    const today = new Date();
    const expiry = new Date(lease.insurance_expiry);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  return (
    <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid md:grid-cols-3 gap-6">
        {/* 1. Dane Najemcy */}
        <div className="bg-white dark:bg-slate-800/40 p-5 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <User size={14} /> Dane Najemcy
          </h3>
          <div className="space-y-5 flex-1">
            <div className="group">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Imię i Nazwisko</span>
              <span className="text-sm font-bold dark:text-white group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors">{lease.tenant_name}</span>
            </div>
            <div className="group">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Kontakt</span>
              <a href={`tel:${lease.tenant_contact}`} className="text-sm font-bold dark:text-white flex items-center gap-1.5 hover:text-green-500 transition-colors">
                <Phone size={14} className="text-green-500" /> {lease.tenant_contact}
              </a>
            </div>
            <div className="group">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Czynsz Miesięczny</span>
              <span className="text-lg font-black text-blue-600 dark:text-amber-400">{lease.rent_amount} <small className="text-[10px] font-bold">PLN</small></span>
            </div>
          </div>
        </div>

        {/* 2. Umowa Najmu */}
        <div className="bg-white dark:bg-slate-800/40 p-5 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm flex flex-col">
          <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-6">
            <FileText size={14} /> Umowa Najmu
          </h3>
          <div className="space-y-5 flex-1">
            <div className="flex justify-between items-start border-b border-gray-50 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Start Najmu</span>
                <span className="text-sm font-bold dark:text-white">{lease.lease_start}</span>
              </div>
              <Calendar size={16} className="text-gray-300" />
            </div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Koniec Najmu</span>
                <span className="text-sm font-bold dark:text-white">{lease.lease_end}</span>
              </div>
              <Calendar size={16} className="text-gray-300" />
            </div>
            <div className="mt-auto">
              <div className="px-3 py-1 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-full w-fit uppercase tracking-tighter">
                Aktywna
              </div>
            </div>
          </div>
        </div>

        {/* 3. Polisa Ubezpieczeniowa */}
        <div className={`p-5 rounded-3xl border shadow-sm transition-all duration-300 flex flex-col ${
          isInsuranceExpiring() 
            ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50 shelf-glow-amber' 
            : 'bg-white dark:bg-slate-800/40 border-gray-100 dark:border-slate-700/50'
        }`}>
          <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center justify-between mb-6 ${
            isInsuranceExpiring() ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            <span className="flex items-center gap-2">
              <Shield size={14} /> Polisa Ubezpieczeniowa
            </span>
            {isInsuranceExpiring() && <AlertCircle size={14} className="animate-pulse" />}
          </h3>
          
          <div className="space-y-5 flex-1">
            <div className="group">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Ubezpieczyciel</span>
              <span className="text-sm font-bold dark:text-white">{lease.insurance_company}</span>
            </div>
            <div className="group">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Nr Polisy</span>
              <span className="text-xs font-mono font-bold dark:text-slate-300">{lease.insurance_policy_number}</span>
            </div>
            <div className="group">
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Ważna do</span>
              <span className={`text-sm font-bold ${isInsuranceExpiring() ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-white'}`}>
                {lease.insurance_expiry}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isInsuranceExpiring() && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex items-start gap-3 animate-in zoom-in-95 duration-500">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="text-amber-600 dark:text-amber-400" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Uwaga: Polisa ubezpieczeniowa wygasa!</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1">
              Ubezpieczenie dla {property.name} wygasa za mniej niż 30 dni ({lease.insurance_expiry}). Skontaktuj się z agentem w celu przedłużenia polisy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
