"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { 
  User, Calendar, Shield, AlertCircle, Phone, FileText, 
  Edit2, Check, X, ShieldAlert, Plus, MoreVertical, 
  Trash2, Banknote, FileSignature, Info, Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Property, LeaseInfo, WidgetConfig, WidgetType } from '../../types/calendar';
import { usePropertyDetails } from '../../hooks/usePropertyDetails';
import { useCalendarEvents } from '../../hooks/useCalendarEvents';

interface TenantLeaseTabProps {
  property: Property;
}

const WIDGET_LABELS: Record<WidgetType, { label: string; icon: any; color: string }> = {
  tenant: { label: 'Najemca', icon: User, color: 'text-blue-500' },
  lease: { label: 'Umowa Najmu', icon: FileSignature, color: 'text-indigo-500' },
  insurance: { label: 'Polisa OC', icon: Shield, color: 'text-emerald-500' },
  deposit: { label: 'Kaucja', icon: Banknote, color: 'text-amber-500' },
  documents: { label: 'Dokumenty', icon: FileText, color: 'text-purple-500' },
  notes: { label: 'Notatki', icon: Info, color: 'text-gray-500' }
};

export function TenantLeaseTab({ property }: TenantLeaseTabProps) {
  const { lease, contacts, isLoading, saveLease } = usePropertyDetails(property.id);
  const { addEvent } = useCalendarEvents();
  
  const [activeModal, setActiveModal] = useState<WidgetType | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [showCalendarPrompt, setShowCalendarPrompt] = useState(false);

  // Form states (Temporary for modals)
  const [tempLease, setTempLease] = useState<Partial<LeaseInfo>>({});
  const [tempContact, setTempContact] = useState({ name: '', phone: '', email: '' });

  const currentWidgets = useMemo(() => {
    return lease?.widgets_config || [
      { id: 'def-tenant', type: 'tenant', title: 'Najemca' },
      { id: 'def-lease', type: 'lease', title: 'Umowa Najmu' }
    ];
  }, [lease?.widgets_config]);

  const handleOpenModal = (type: WidgetType) => {
    if (lease) {
      setTempLease(lease);
      // If it's tenant, find the contact
      if (type === 'tenant' && lease.tenant_contact_id) {
        const contact = contacts.find(c => c.id === lease.tenant_contact_id);
        if (contact) setTempContact({ name: contact.name, phone: contact.phone || '', email: contact.email || '' });
        else setTempContact({ name: lease.tenant_name || '', phone: lease.tenant_contact || '', email: '' });
      } else {
        setTempContact({ name: lease.tenant_name || '', phone: lease.tenant_contact || '', email: '' });
      }
    } else {
      setTempLease({ property_id: property.id, rent_amount: 0 });
    }
    setActiveModal(type);
  };

  const handleSaveWidget = async () => {
    try {
      // Sync tenant name/contact to lease if it's the tenant widget
      const finalLeasePayload = { ...tempLease };
      if (activeModal === 'tenant') {
        finalLeasePayload.tenant_name = tempContact.name;
        finalLeasePayload.tenant_contact = tempContact.phone;
      }

      await saveLease(finalLeasePayload, activeModal === 'tenant' ? tempContact : undefined);
      
      // If lease widget saved and we have dates + amount, show calendar prompt
      if (activeModal === 'lease' && tempLease.lease_start && tempLease.rent_amount) {
        setShowCalendarPrompt(true);
      }

      setActiveModal(null);
    } catch (err: any) {
      alert("Błąd zapisu: " + err.message);
    }
  };

  const addWidget = async (type: WidgetType, title?: string) => {
    const newWidget: WidgetConfig = {
      id: crypto.randomUUID(),
      type,
      title: title || WIDGET_LABELS[type].label
    };
    const newConfig = [...currentWidgets, newWidget];
    await saveLease({ widgets_config: newConfig });
    setIsAddingModule(false);
    setIsCreatingCustom(false);
    setCustomTitle('');
  };

  const removeWidget = async (type: WidgetType) => {
    const confirmDelete = window.confirm(`Czy na pewno chcesz usunąć sekcję "${WIDGET_LABELS[type].label}"? Dane zostaną zachowane w bazie, ale karta zniknie z widoku.`);
    if (!confirmDelete) return;

    const newConfig = currentWidgets.filter(w => w.type !== type);
    await saveLease({ widgets_config: newConfig });
    setActiveModal(null);
  };

  const handleCreateCalendarEvents = async () => {
    if (!lease?.lease_start || !lease.rent_amount) return;
    
    try {
      const start = new Date(lease.lease_start);
      const end = lease.lease_end ? new Date(lease.lease_end) : null;
      
      // Calculate months
      let months = 12; // default
      if (end) {
        months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      }

      await addEvent({
        title: `Czynsz - ${lease.tenant_name || property.name}`,
        entry_type: 'payment',
        amount: lease.rent_amount,
        status: 'do_zapłaty',
        bill_type: 'czynsz',
        property_id: property.id,
        start_date: lease.lease_start,
        is_planned: true
      }, months);

      setShowCalendarPrompt(false);
      alert(`Utworzono harmonogram płatności na ${months} miesięcy.`);
    } catch (err: any) {
      alert("Błąd kalendarza: " + err.message);
    }
  };

  if (isLoading) return <div className="py-20 text-center animate-pulse text-gray-400">Pobieranie modułów...</div>;

  return (
    <div className="space-y-6 pt-4 pb-12">
      {/* Header z przyciskiem dodawania */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest">Dashboard Nieruchomości</h2>
        <button 
          onClick={() => setIsAddingModule(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={16} /> DODAJ SEKCJĘ
        </button>
      </div>

      {/* Grid Widgetów */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {currentWidgets.map((widget) => (
            <WidgetCard 
              key={widget.id} 
              widget={widget} 
              lease={lease} 
              contact={contacts.find(c => c.id === lease?.tenant_contact_id)}
              onEdit={() => handleOpenModal(widget.type)}
              onRemove={() => removeWidget(widget.type)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Modal Biblioteki Modułów */}
      {isAddingModule && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-slate-800"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black dark:text-white">Wybierz Moduł</h3>
              <button onClick={() => setIsAddingModule(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>
            
            {!isCreatingCustom ? (
              <div className="grid grid-cols-2 gap-4">
                {(Object.keys(WIDGET_LABELS) as WidgetType[]).map(type => {
                  const config = WIDGET_LABELS[type];
                  const Icon = config.icon;
                  return (
                    <button 
                      key={type}
                      onClick={() => addWidget(type)}
                      className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 transition-all group text-center"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gray-50 dark:bg-slate-800 flex items-center justify-center ${config.color} group-hover:scale-110 transition-transform`}>
                        <Icon size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-700 dark:text-slate-300 uppercase tracking-tighter">{config.label}</span>
                    </button>
                  );
                })}
                <button 
                  onClick={() => setIsCreatingCustom(true)}
                  className="col-span-2 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                >
                  <Plus size={20} className="text-gray-400 group-hover:text-blue-500" />
                  <span className="text-xs font-bold text-gray-500 group-hover:text-blue-600">Własny...</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input label="Nazwa nowej sekcji" value={customTitle} onChange={setCustomTitle} placeholder="np. Miejsce postojowe" />
                <div className="flex gap-2 pt-4">
                  <button onClick={() => setIsCreatingCustom(false)} className="flex-1 py-3 text-xs font-bold text-gray-500 bg-gray-100 dark:bg-slate-800 rounded-xl">Cofnij</button>
                  <button 
                    disabled={!customTitle.trim()}
                    onClick={() => addWidget('notes', customTitle)} 
                    className="flex-2 px-8 py-3 bg-blue-600 text-white text-xs font-black rounded-xl disabled:opacity-50"
                  >
                    DODAJ MODUŁ
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Dynamiczny Modal Edycji */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-800 my-8"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 ${WIDGET_LABELS[activeModal].color}`}>
                  {React.createElement(WIDGET_LABELS[activeModal].icon, { size: 24 })}
                </div>
                <h3 className="text-xl font-black dark:text-white">
                  {currentWidgets.find(w => w.type === activeModal)?.title || WIDGET_LABELS[activeModal].label}
                </h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
            </div>

            <div className="space-y-6">
              {activeModal === 'tenant' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-3">
                    <Info className="text-blue-500 shrink-0" size={18} />
                    <p className="text-[10px] text-blue-700 dark:text-blue-400 font-medium">Dane najemcy są zsynchronizowane z bazą kontaktów.</p>
                  </div>
                  <Input label="Imię i Nazwisko" value={tempContact.name} onChange={v => setTempContact({...tempContact, name: v})} placeholder="np. Jan Kowalski" />
                  <Input label="Telefon" value={tempContact.phone} onChange={v => setTempContact({...tempContact, phone: v})} placeholder="+48 000 000 000" icon={<Phone size={14}/>} />
                  <Input label="E-mail" value={tempContact.email} onChange={v => setTempContact({...tempContact, email: v})} placeholder="jan@przyklad.pl" icon={<Mail size={14}/>} />
                </div>
              )}

              {activeModal === 'lease' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Start Umowy" type="date" value={tempLease.lease_start || ''} onChange={v => setTempLease({...tempLease, lease_start: v})} />
                    <Input label="Koniec Umowy" type="date" value={tempLease.lease_end || ''} onChange={v => setTempLease({...tempLease, lease_end: v})} />
                  </div>
                  <Input label="Czynsz Miesięczny (PLN)" type="number" value={tempLease.rent_amount?.toString() || ''} onChange={v => setTempLease({...tempLease, rent_amount: parseFloat(v)})} icon={<Banknote size={14}/>} />
                </div>
              )}

              {activeModal === 'insurance' && (
                <div className="space-y-4">
                  <Input label="Ubezpieczyciel" value={tempLease.insurance_company || ''} onChange={v => setTempLease({...tempLease, insurance_company: v})} />
                  <Input label="Numer Polisy" value={tempLease.insurance_policy_number || ''} onChange={v => setTempLease({...tempLease, insurance_policy_number: v})} />
                  <Input label="Data Wygaśnięcia" type="date" value={tempLease.insurance_expiry || ''} onChange={v => setTempLease({...tempLease, insurance_expiry: v})} />
                </div>
              )}

              {activeModal === 'deposit' && (
                <div className="space-y-4">
                  <Input label="Kwota Kaucji (PLN)" type="number" value={tempLease.deposit_amount?.toString() || ''} onChange={v => setTempLease({...tempLease, deposit_amount: parseFloat(v)})} icon={<Banknote size={14}/>} />
                </div>
              )}

              {activeModal === 'notes' && (
                <div className="space-y-4">
                  <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Treść notatki</label>
                  <textarea 
                    value={tempLease.lease_notes || ''} 
                    onChange={e => setTempLease({...tempLease, lease_notes: e.target.value})} 
                    placeholder="Wpisz dowolne uwagi..."
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all font-bold text-sm min-h-[150px] resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-10">
              <button 
                onClick={() => removeWidget(activeModal)}
                className="flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                <Trash2 size={16} /> USUŃ SEKCJĘ
              </button>
              <div className="flex gap-3">
                <button onClick={() => setActiveModal(null)} className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700">Anuluj</button>
                <button 
                  onClick={handleSaveWidget}
                  className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
                >
                  <Check size={18} /> ZAPISZ
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Monit Kalendarza */}
      {showCalendarPrompt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl border-2 border-blue-500/20 text-center"
          >
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="text-blue-600" size={32} />
            </div>
            <h3 className="text-lg font-black dark:text-white mb-2">Utworzyć harmonogram?</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-8 leading-relaxed">
              Czy chcesz automatycznie dodać płatności czynszu do kalendarza na okres trwania najmu?
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleCreateCalendarEvents}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all"
              >
                TAK, GENERUJ PŁATNOŚCI
              </button>
              <button 
                onClick={() => setShowCalendarPrompt(false)}
                className="w-full py-3 text-sm font-bold text-gray-400 hover:text-gray-600"
              >
                Może później
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function WidgetCard({ widget, lease, contact, onEdit, onRemove }: { 
  widget: WidgetConfig; 
  lease: LeaseInfo | null; 
  contact?: any;
  onEdit: () => void; 
  onRemove: () => void;
}) {
  const config = WIDGET_LABELS[widget.type];
  const Icon = config.icon;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white dark:bg-slate-800/40 p-6 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/40 transition-all group relative"
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${config.color}`}>
          <Icon size={14} /> {widget.title}
        </h3>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="p-1.5 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-500 hover:text-blue-500 transition-colors"
          >
            <Edit2 size={14} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 bg-red-50 dark:bg-red-900/10 rounded-lg text-red-400 hover:text-red-600 transition-colors"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div onClick={onEdit} className="cursor-pointer">
        <WidgetContent widget={widget} lease={lease} contact={contact} />
      </div>
    </motion.div>
  );
}

function WidgetContent({ widget, lease, contact }: { widget: WidgetConfig; lease: LeaseInfo | null; contact: any }) {
  switch (widget.type) {
    case 'tenant':
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-slate-800 flex items-center justify-center text-blue-500 font-black text-xs border border-blue-100 dark:border-slate-700">
              {contact?.name?.[0] || lease?.tenant_name?.[0] || '?'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black dark:text-white truncate">{contact?.name || lease?.tenant_name || 'Brak danych'}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{contact?.role || 'Najemca'}</p>
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t border-gray-50 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-slate-300">
              <Phone size={12} className="text-green-500" /> {contact?.phone || lease?.tenant_contact || '—'}
            </div>
          </div>
        </div>
      );
    case 'lease':
      return (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Czynsz</p>
              <p className="text-xl font-black text-indigo-600 dark:text-indigo-400">{lease?.rent_amount || 0} <small className="text-[10px]">PLN</small></p>
            </div>
            <Banknote className="text-gray-200 dark:text-slate-800" size={32} />
          </div>
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50 dark:border-slate-800">
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase">Start</p>
              <p className="text-xs font-bold dark:text-white">{lease?.lease_start || '—'}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 font-bold uppercase">Koniec</p>
              <p className="text-xs font-bold dark:text-white">{lease?.lease_end || '—'}</p>
            </div>
          </div>
        </div>
      );
    case 'insurance':
      const diff = lease?.insurance_expiry ? (new Date(lease.insurance_expiry).getTime() - new Date().getTime()) / (1000 * 3600 * 24) : 100;
      const alert = diff >= 0 && diff <= 30;
      return (
        <div className="space-y-4">
          <p className="text-sm font-bold dark:text-white truncate">{lease?.insurance_company || 'Brak polisy'}</p>
          <div className={`mt-2 p-2 rounded-xl text-center border ${alert ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400'}`}>
            <p className="text-[9px] font-black uppercase">Wygasa: {lease?.insurance_expiry || '—'}</p>
          </div>
        </div>
      );
    case 'deposit':
      return (
        <div className="flex flex-col items-center justify-center py-2 text-center">
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{lease?.deposit_amount || 0} <small className="text-xs">PLN</small></p>
          <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Suma zabezpieczona</p>
        </div>
      );
    case 'notes':
      return (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 dark:text-slate-400 font-medium line-clamp-4 leading-relaxed">
            {lease?.lease_notes || 'Brak notatek...'}
          </p>
        </div>
      );
    default:
      return <div className="py-8 text-center text-xs text-gray-400 italic">Sekcja pusta</div>;
  }
}

function Input({ label, value, onChange, placeholder, type = 'text', icon }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  type?: string;
  icon?: any;
}) {
  return (
    <div>
      <label className="block text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{label}</label>
      <div className="relative group">
        {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">{icon}</div>}
        <input 
          type={type} 
          value={value} 
          onChange={e => onChange(e.target.value)} 
          placeholder={placeholder}
          className={`w-full ${icon ? 'pl-10' : 'px-4'} py-3.5 bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all font-bold text-sm`}
        />
      </div>
    </div>
  );
}
