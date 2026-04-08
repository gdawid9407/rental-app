"use client";
import React from 'react';
import { Phone, Mail, MessageSquare, Building2, ShieldCheck, User } from 'lucide-react';
import { Property } from '../../types/calendar';

interface ContactsTabProps {
  property: Property;
}

export function ContactsTab({ property }: ContactsTabProps) {
  const contacts = [
    {
      role: 'Najemca',
      name: 'Jan Kowalski',
      phone: '+48 123 456 789',
      email: 'jan.kowalski@email.com',
      icon: <User className="text-blue-500" size={24} />,
      color: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      role: 'Spółdzielnia / Administracja',
      name: 'SM Przyszłość',
      phone: '+48 22 555 12 34',
      email: 'biuro@smprzyszlosc.pl',
      icon: <Building2 className="text-amber-500" size={24} />,
      color: 'bg-amber-50 dark:bg-amber-950/20'
    },
    {
      role: 'Ubezpieczyciel',
      name: 'PZU Pomoc',
      phone: '801 102 102',
      email: 'kontakt@pzu.pl',
      icon: <ShieldCheck className="text-green-500" size={24} />,
      color: 'bg-green-50 dark:bg-green-950/20'
    }
  ];

  return (
    <div className="pt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {contacts.map((contact, index) => (
        <div 
          key={index}
          className="p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center text-center group hover:shadow-md transition-all duration-200 border-b-2 hover:border-b-blue-500 dark:hover:border-b-amber-500"
        >
          <div className={`w-14 h-14 ${contact.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
            {contact.icon}
          </div>
          <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider mb-1">{contact.role}</span>
          <h4 className="text-base font-bold text-gray-800 dark:text-white mb-4">{contact.name}</h4>
          
          <div className="flex gap-2 w-full mt-auto">
            <a 
              href={`tel:${contact.phone}`}
              className="flex-1 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-100 dark:border-slate-700"
              title="Zadzwoń"
            >
              <Phone size={16} />
            </a>
            <a 
              href={`mailto:${contact.email}`}
              className="flex-1 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-100 dark:border-slate-700"
              title="Wyślij e-mail"
            >
              <Mail size={16} />
            </a>
            <button 
              className="flex-1 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-100 dark:border-slate-700"
              title="Wyślij wiadomość"
            >
              <MessageSquare size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
