"use client";
import React, { useState } from 'react';
import { Phone, Mail, MessageSquare, Building2, ShieldCheck, User, Plus, Trash2, X, Check, Copy, ExternalLink } from 'lucide-react';
import { Property } from '../../types/calendar';
import { usePropertyDetails, PropertyContact } from '../../hooks/usePropertyDetails';
import { supabase } from '../../lib/supabase';

interface ContactsTabProps {
  property: Property;
  allProperties: Property[];
}

export function ContactsTab({ property, allProperties }: ContactsTabProps) {
  const { contacts, isLoading, addContact, deleteContact, refresh } = usePropertyDetails(property.id);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedContact, setSelectedContact] = useState<PropertyContact | null>(null);
  const [isEditingInModal, setIsEditingInModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', role: '', phone: '', email: '' });

  // Form state for new contact
  const [role, setRole] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([property.id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} został skopiowany do schowka!`);
  };

  const handleEditClick = (c: PropertyContact) => {
    setEditForm({
      name: c.name,
      role: c.role || '',
      phone: c.phone || '',
      email: c.email || ''
    });
    setIsEditingInModal(true);
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;

    try {
      const { error } = await supabase
        .from('property_contacts')
        .update({
          name: editForm.name.trim(),
          role: editForm.role.trim() || null,
          phone: editForm.phone.trim() || null,
          email: editForm.email.trim() || null,
        })
        .eq('id', selectedContact.id);

      if (error) throw error;

      setIsEditingInModal(false);
      setSelectedContact(null);
      refresh();
    } catch (err: any) {
      alert("Błąd podczas aktualizacji kontaktu: " + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (selectedPropertyIds.length === 0) {
      alert("Proszę wybrać co najmniej jedno mieszkanie.");
      return;
    }

    // Telefon validation
    const phoneRegex = /^[0-9+\s\-()]*$/;
    if (phone && !phoneRegex.test(phone)) {
      alert("Numer telefonu zawiera niepoprawne znaki.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Błąd autoryzacji");

      const contactData = {
        role: role.trim() || null,
        name: name.trim(),
        phone: phone.trim() || null,
        email: email.trim() || null,
        user_id: user.id
      };

      const rows = selectedPropertyIds.map(pid => ({
        ...contactData,
        property_id: pid
      }));

      const { error } = await supabase.from('property_contacts').insert(rows);
      if (error) throw error;

      setIsAdding(false);
      setRole('');
      setName('');
      setPhone('');
      setEmail('');
      setSelectedPropertyIds([property.id]);
      refresh();
    } catch (err: any) {
      alert("Błąd podczas zapisywania kontaktu: " + err.message);
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
              <input 
                type="tel"
                value={phone} 
                onChange={e => setPhone(e.target.value)} 
                placeholder="np. +48 123 456 789"
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">E-mail (opcjonalnie)</label>
              <input value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" />
            </div>
          </div>

          {/* Property Selection */}
          <div className="pt-2">
            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Przypisz do mieszkań (opcjonalnie wiele)</label>
            <div className="flex flex-wrap gap-2">
              {allProperties.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (selectedPropertyIds.includes(p.id)) {
                      setSelectedPropertyIds(selectedPropertyIds.filter(id => id !== p.id));
                    } else {
                      setSelectedPropertyIds([...selectedPropertyIds, p.id]);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
                    selectedPropertyIds.includes(p.id)
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                      : 'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:border-blue-400'
                  }`}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  {p.name}
                  {selectedPropertyIds.includes(p.id) && <Check size={12} />}
                </button>
              ))}
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
              onClick={() => {
                setSelectedContact(contact);
                setIsEditingInModal(false);
              }}
              className="group p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all duration-200 border-b-2 hover:border-b-blue-500 dark:hover:border-b-amber-500 relative cursor-pointer"
            >
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  if(confirm("Usunąć ten kontakt?")) deleteContact(contact.id);
                }}
                className="absolute top-2 right-2 p-2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <X size={14} />
              </button>

              <div className={`w-14 h-14 ${getContactColor(contact.role)} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                {getContactIcon(contact.role)}
              </div>
              <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-slate-500 tracking-wider mb-1">{contact.role || 'Kontakt'}</span>
              <h4 className="text-base font-black text-gray-800 dark:text-white mb-4 line-clamp-1 px-2">{contact.name}</h4>
              
              <div className="flex gap-2 w-full mt-auto">
                {contact.phone && (
                  <a 
                    href={`tel:${contact.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 p-2 bg-gray-50 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-900/30 text-gray-500 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-100 dark:border-slate-700"
                    title="Zadzwoń"
                  >
                    <Phone size={16} />
                  </a>
                )}
                {contact.email && (
                  <a 
                    href={`mailto:${contact.email}`}
                    onClick={(e) => e.stopPropagation()}
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

      {/* Profile Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border-2 border-blue-500/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`p-8 pb-6 flex flex-col items-center ${getContactColor(isEditingInModal ? editForm.role : selectedContact.role)} relative`}>
              <button 
                onClick={() => {
                  setSelectedContact(null);
                  setIsEditingInModal(false);
                }}
                className="absolute top-4 right-4 p-2 bg-white/50 dark:bg-black/20 rounded-full hover:bg-white dark:hover:bg-black/40 transition-colors"
              >
                <X size={20} className="text-gray-600 dark:text-white" />
              </button>
              
              <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-3xl shadow-lg flex items-center justify-center mb-4">
                {getContactIcon(isEditingInModal ? editForm.role : selectedContact.role)}
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-1">
                {isEditingInModal ? 'Edycja kontaktu' : (selectedContact.role || 'Kontakt')}
              </span>
              {!isEditingInModal && <h2 className="text-2xl font-black text-gray-800 dark:text-white text-center px-4">{selectedContact.name}</h2>}
            </div>

            {/* Profile Content */}
            <div className="p-8 pt-4 space-y-6">
              {isEditingInModal ? (
                /* EDIT FORM */
                <form onSubmit={handleUpdateContact} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1 block">Nazwa / Imię</label>
                    <input 
                      required
                      value={editForm.name} 
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1 block">Rola</label>
                    <input 
                      value={editForm.role} 
                      onChange={e => setEditForm({...editForm, role: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      placeholder="np. Najemca, Spółdzielnia"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1 block">Telefon</label>
                    <input 
                      value={editForm.phone} 
                      onChange={e => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase mb-1.5 ml-1 block">Email</label>
                    <input 
                      value={editForm.email} 
                      onChange={e => setEditForm({...editForm, email: e.target.value})}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setIsEditingInModal(false)}
                      className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 font-bold rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Anuluj
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                    >
                      <Check size={18} /> ZAPISZ
                    </button>
                  </div>
                </form>
              ) : (
                /* VIEW MODE */
                <>
                  <div className="space-y-4">
                    {/* Phone Field */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Numer telefonu</label>
                      <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-800 group">
                        <Phone size={18} className="text-blue-500" />
                        <span className="font-bold text-gray-700 dark:text-slate-200 flex-1">
                          {selectedContact.phone || 'Nie podano'}
                        </span>
                        {selectedContact.phone && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => copyToClipboard(selectedContact.phone!, 'Numer')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-blue-500 transition-colors">
                              <Copy size={16} />
                            </button>
                            <a href={`tel:${selectedContact.phone}`} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-green-500 transition-colors">
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Adres E-mail</label>
                      <div className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-800 group">
                        <Mail size={18} className="text-purple-500" />
                        <span className="font-bold text-gray-700 dark:text-slate-200 flex-1 truncate">
                          {selectedContact.email || 'Nie podano'}
                        </span>
                        {selectedContact.email && (
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => copyToClipboard(selectedContact.email!, 'Email')} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-blue-500 transition-colors">
                              <Copy size={16} />
                            </button>
                            <a href={`mailto:${selectedContact.email}`} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-400 hover:text-blue-500 transition-colors">
                              <ExternalLink size={16} />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => handleEditClick(selectedContact)}
                      className="flex-1 py-4 bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-white font-black rounded-2xl hover:bg-gray-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 border border-gray-200 dark:border-slate-700"
                    >
                      <Plus className="text-gray-400 rotate-45" size={18} />
                      EDYTUJ DANE
                    </button>
                    <button 
                      onClick={() => setSelectedContact(null)}
                      className="flex-1 py-4 bg-gray-900 dark:bg-blue-600 text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest text-xs"
                    >
                      Zamknij
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
