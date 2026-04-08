"use client";
import React, { useState } from 'react';
import { User, Calendar, Shield, AlertCircle, Phone, FileText, Edit2, Check, X, ShieldAlert } from 'lucide-react';
import { Property, LeaseInfo } from '../../types/calendar';
import { usePropertyDetails } from '../../hooks/usePropertyDetails';

interface TenantLeaseTabProps {
  property: Property;
}

export function TenantLeaseTab({ property }: TenantLeaseTabProps) {
  const { lease, isLoading, saveLease } = usePropertyDetails(property.id);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [tenantName, setTenantName] = useState('');
  const [tenantContact, setTenantContact] = useState('');
  const [leaseStart, setLeaseStart] = useState('');
  const [leaseEnd, setLeaseEnd] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [insuranceCompany, setInsuranceCompany] = useState('');
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState('');
  const [rentAmount, setRentAmount] = useState('');

  // Sync internal state when lease is loaded or editing starts
  const startEditing = () => {
    if (lease) {
      setTenantName(lease.tenant_name || '');
      setTenantContact(lease.tenant_contact || '');
      setLeaseStart(lease.lease_start || '');
      setLeaseEnd(lease.lease_end || '');
      setInsuranceExpiry(lease.insurance_expiry || '');
      setInsuranceCompany(lease.insurance_company || '');
      setInsurancePolicyNumber(lease.insurance_policy_number || '');
      setRentAmount(lease.rent_amount?.toString() || '');
    }
    setIsEditing(true);
  };

  const handleSave = async () => {
    // Phone validation
    const phoneRegex = /^[0-9+\s\-()]*$/;
    if (tenantContact && !phoneRegex.test(tenantContact)) {
      alert("Numer telefonu najemcy zawiera niepoprawne znaki.");
      return;
    }

    try {
      await saveLease({
        tenant_name: tenantName.trim() || null,
        tenant_contact: tenantContact.trim() || null,
        lease_start: leaseStart || null,
        lease_end: leaseEnd || null,
        insurance_expiry: insuranceExpiry || null,
        insurance_company: insuranceCompany.trim() || null,
        insurance_policy_number: insurancePolicyNumber.trim() || null,
        rent_amount: rentAmount ? parseFloat(rentAmount) : 0,
      });
      setIsEditing(false);
    } catch (err: any) {
      alert("Błąd podczas aktualizacji umowy: " + err.message);
    }
  };

  if (isLoading) return <div className="py-20 text-center animate-pulse text-gray-400">Pobieranie danych umowy...</div>;

  const insuranceValid = lease?.insurance_expiry;
  const isInsuranceExpiring = () => {
    if (!lease?.insurance_expiry) return false;
    const today = new Date();
    const expiry = new Date(lease.insurance_expiry);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  };

  const expiringAlert = isInsuranceExpiring();

  return (
    <div className="space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {!isEditing && (
        <div className="flex justify-end mb-2">
          <button 
            onClick={startEditing}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all border border-gray-200 dark:border-slate-700 shadow-sm"
          >
            <Edit2 size={14} /> EDYTUJ DANE UMOWY
          </button>
        </div>
      )}

      {isEditing ? (
        <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/30 rounded-3xl p-8 shadow-2xl space-y-8 animate-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-black dark:text-white flex items-center gap-3">
              <User className="text-blue-500" size={24} /> Edycja Najemcy i Umowy
            </h3>
            <div className="flex gap-2">
              <button onClick={() => setIsEditing(false)} className="p-2 text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Sekcja 1: Najemca */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500">I. Dane Najemcy</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Najemca / Firma</label>
                  <input value={tenantName} onChange={e => setTenantName(e.target.value)} placeholder="np. Jan Kowalski" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Numer Telefonu (opcjonalnie)</label>
                  <input 
                    type="tel"
                    value={tenantContact} 
                    onChange={e => setTenantContact(e.target.value)} 
                    placeholder="+48 000 000 000" 
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Czynsz (opcjonalnie)</label>
                  <input type="number" value={rentAmount} onChange={e => setRentAmount(e.target.value)} placeholder="2500" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition font-bold" />
                </div>
              </div>
            </div>

            {/* Sekcja 2: Terminy */}
            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">II. Czas Trwania</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Start Najmu</label>
                  <input type="date" value={leaseStart} onChange={e => setLeaseStart(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Koniec Najmu</label>
                  <input type="date" value={leaseEnd} onChange={e => setLeaseEnd(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition" />
                </div>
              </div>
            </div>

            {/* Sekcja 3: Ubezpieczenie */}
            <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500">III. Polisa OC Najemcy</h4>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Ubezpieczyciel (opcjonalnie)</label>
                  <input value={insuranceCompany} onChange={e => setInsuranceCompany(e.target.value)} placeholder="np. PZU, Warta..." className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Numer Polisy (opcjonalnie)</label>
                  <input value={insurancePolicyNumber} onChange={e => setInsurancePolicyNumber(e.target.value)} placeholder="Nr polisy" className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5 ml-1">Wygasa Dnia (opcjonalnie)</label>
                  <input type="date" value={insuranceExpiry} onChange={e => setInsuranceExpiry(e.target.value)} className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button onClick={() => setIsEditing(false)} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700">Odrzuć</button>
            <button onClick={handleSave} className="px-10 py-3 bg-blue-600 dark:bg-blue-500 text-white font-black rounded-xl shadow-lg hover:shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
              <Check size={18} /> ZAPISZ INFORMACJE
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {/* 1. Dane Najemcy */}
          <div className="bg-white dark:bg-slate-800/40 p-5 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm flex flex-col items-start min-h-[160px]">
            <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <User size={14} /> Dane Najemcy
            </h3>
            {lease ? (
              <div className="space-y-5 flex-1 w-full">
                <div className="group">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Imię i Nazwisko</span>
                  <span className="text-sm font-bold dark:text-white transition-colors">
                    {lease.tenant_name || '—'}
                  </span>
                </div>
                <div className="group">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Kontakt</span>
                  {lease.tenant_contact ? (
                    <a href={`tel:${lease.tenant_contact}`} className="text-sm font-bold dark:text-white flex items-center gap-1.5 hover:text-green-500 transition-colors">
                      <Phone size={14} className="text-green-500" /> {lease.tenant_contact}
                    </a>
                  ) : '—'}
                </div>
                <div className="group">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Czynsz Miesięczny</span>
                  <span className="text-lg font-black text-blue-600 dark:text-amber-400">{lease.rent_amount || 0} <small className="text-[10px] font-bold">PLN</small></span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center w-full text-center">
                <p className="text-xs text-gray-400 italic">Brak danych najemcy</p>
              </div>
            )}
          </div>

          {/* 2. Umowa Najmu */}
          <div className="bg-white dark:bg-slate-800/40 p-5 rounded-3xl border border-gray-100 dark:border-slate-700/50 shadow-sm flex flex-col items-start min-h-[160px]">
            <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <FileText size={14} /> Umowa Najmu
            </h3>
            {lease?.lease_start ? (
              <div className="space-y-5 flex-1 w-full">
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
                    <span className="text-sm font-bold dark:text-white">{lease.lease_end || 'Nieokreślony'}</span>
                  </div>
                  <Calendar size={16} className="text-gray-300" />
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center w-full text-center">
                <p className="text-xs text-gray-400 italic">Brak danych o umowie</p>
              </div>
            )}
          </div>

          {/* 3. Polisa Ubezpieczeniowa */}
          <div className={`p-5 rounded-3xl border shadow-sm transition-all duration-300 flex flex-col items-start min-h-[160px] ${
            expiringAlert 
              ? 'bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/50 shelf-glow-amber' 
              : 'bg-white dark:bg-slate-800/40 border-gray-100 dark:border-slate-700/50'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-widest flex items-center justify-between w-full mb-6 ${
              expiringAlert ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              <span className="flex items-center gap-2">
                <Shield size={14} /> Polisa Najemcy
              </span>
              {expiringAlert && <AlertCircle size={14} className="animate-pulse" />}
            </h3>
            
            {lease?.insurance_expiry ? (
              <div className="space-y-5 flex-1 w-full text-left">
                <div className="group">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Ubezpieczyciel</span>
                  <span className="text-sm font-bold dark:text-white">{lease.insurance_company || '—'}</span>
                </div>
                <div className="group">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Nr Polisy</span>
                  <span className="text-xs font-mono font-bold dark:text-slate-300">{lease.insurance_policy_number || '—'}</span>
                </div>
                <div className="group">
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase block mb-1">Ważna do</span>
                  <span className={`text-sm font-bold ${expiringAlert ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {lease.insurance_expiry}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-center items-center w-full text-center">
                <p className="text-xs text-gray-400 italic">Brak danych o ubezpieczeniu</p>
              </div>
            )}
          </div>
        </div>
      )}

      {expiringAlert && !isEditing && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl flex items-start gap-3 animate-in zoom-in-95 duration-500">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <ShieldAlert className="text-amber-600 dark:text-amber-400" size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-400">Uwaga: Polisa ubezpieczeniowa wygasa!</p>
            <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1">
              Ubezpieczenie dla {property.name} wygasa za mniej niż 30 dni ({lease?.insurance_expiry}). Skontaktuj się z najemcą w celu aktualizacji polisy.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
