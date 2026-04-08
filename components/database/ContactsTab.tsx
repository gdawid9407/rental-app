"use client";
import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Building2, ShieldCheck, User, Plus, Trash2, X, Check } from 'lucide-react';
import { Property } from '../../types/calendar';
import { usePropertyDetails } from '../../hooks/usePropertyDetails';

interface ContactsTabProps {
  property: Property;
}

export function ContactsTab({ property }: ContactsTabProps) {
  const { contacts, isLoading, addContact, deleteContact } = usePropertyDetails(property.id);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addContact({ 
        role: role || null, 
        name, 
        phone: phone || null, 
        email: email || null 
      });
      setIsAdding(false);
      setRole('');
      setName('');
      setPhone('');
      setEmail('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getContactIcon = (role: string | null) => {
    if (!role) return <Phone className="text-gray-500" size={24} />;
    const r = role.toLowerCase();
    if (r.includes('najemca')) return <User className="text-blue-500" size={24} />;
    if (r.includes('spółdzielnia') || r.includes('administracja')) return <Building2 className="text-amber-500" size={24} />;
    if (r.includes('ubezpieczyciel')) return <ShieldCheck className="text-green-500" size={24} />;
    return <Phone className="text-gray-500" size={24} />;
  };

  const getContactColor = (role: string | null) => {
    if (!role) return 'bg-gray-50 dark:bg-slate-800/40';
    const r = role.toLowerCase();
    if (r.includes('najemca')) return 'bg-blue-50 dark:bg-blue-900/20';
    if (r.includes('spółdzielnia')) return 'bg-amber-50 dark:bg-amber-950/20';
    if (r.includes('ubezpieczyciel')) return 'bg-green-50 dark:bg-green-950/20';
    return 'bg-gray-50 dark:bg-slate-800/40';
  };

  if (isLoading) return <div className="py-20 text-center animate-pulse text-gray-400">Ładowanie kontaktów...</div>;

  return (
    <div className="pt-4 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
          Telefony i Kontakty
        </h3>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
            isAdding 
              ? 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400' 
              : 'bg-blue-600 dark:bg-blue-500 text-white shadow-sm hover:bg-blue-700'
          }`}
        >
          {isAdding ? 'Anuluj' : <><Plus size={14} /> Dodaj Kontakt</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border-2 border-blue-500/20 p-6 rounded-3xl shadow-xl space-y-4 animate-in zoom-in-95 duration-200">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Rola (opcjonalnie)</label>
              <input value={role} onChange={e => setRole(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Imię / Nazwa firmy</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Telefon (opcjonalnie)</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-mail (opcjonalnie)</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2">
              <Check size={18} /> ZAPISZ KONTAKT
            </button>
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contacts.length === 0 ? (
          <div className="sm:col-span-2 lg:col-span-3 py-12 text-center text-gray-400 italic bg-gray-50/50 dark:bg-slate-800/20 border-2 border-dashed border-gray-100 dark:border-slate-800 rounded-3xl">
            Brak zapisanych kontaktów dla tej nieruchomości
          </div>
        ) : (
          contacts.map((contact) => (
            <div 
              key={contact.id}
              className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all duration-200 border-b-2 hover:border-b-blue-500 dark:hover:border-b-amber-500 relative"
            >
              <button 
                onClick={() => { if(confirm("Usunąć ten kontakt?")) deleteContact(contact.id); }}
                className="absolute top-2 right-2 p-2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
              >
                <X size={14} />
              </button>

              <div className={`w-14 h-14 ${getContactColor(contact.role)} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {getContactIcon(contact.role)}
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider mb-1">{contact.role}</span>
              <h4 className="text-base font-black text-gray-800 dark:text-white mb-4 line-clamp-1 px-2">{contact.name}</h4>
              
              <div className="flex gap-2 w-full mt-auto">
                {contact.phone && (
                  <a 
                    href={`tel:${contact.phone}`}
                    className="flex-1 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-100 dark:border-slate-700"
                    title="Zadzwoń"
                  >
                    <Phone size={16} />
                  </a>
                )}
                {contact.email && (
                  <a 
                    href={`mailto:${contact.email}`}
                    className="flex-1 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-100 dark:border-slate-700"
                    title="Wyślij e-mail"
                  >
                    <Mail size={16} />
                  </a>
                )}
                {!contact.phone && !contact.email && (
                  <div className="flex-1 py-1 text-xs text-gray-400 italic">Brak danych kontaktowych</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
