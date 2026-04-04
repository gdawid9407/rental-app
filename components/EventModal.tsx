import React, { useState, useEffect, useRef } from 'react';
import { X, Receipt, FileText, Trash2, Repeat, AlertTriangle, GripHorizontal } from 'lucide-react';
import Draggable from 'react-draggable';
import { EntryType, PaymentStatus, CalendarEvent, BILL_CATEGORIES, BillType, Property } from '../types/calendar';
import type { DeleteMode } from '../hooks/useCalendarEvents';

export interface ModalEventState {
  id?: string | null;
  title?: string; // Tytuł po sformatowaniu lub czysty
  rawTitle?: string; // Prawdziwy, nie tknięty string
  type?: EntryType;
  amount?: string;
  status?: PaymentStatus;
  isPlanned?: boolean;
  recurringGroupId?: string | null;
  billType?: BillType;
  propertyId?: string | null;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedEvent: ModalEventState | null;
  properties: Property[];
  onSave: (id: string | null, payload: any, recurringMonths?: number) => Promise<void>;
  onDelete: (id: string, mode: DeleteMode, extraData?: { startDate?: string, billType?: string }) => Promise<void>;
}

export function EventModal({ isOpen, onClose, selectedDate, selectedEvent, properties, onSave, onDelete }: EventModalProps) {
  const [entryType, setEntryType] = useState<EntryType>('payment');
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<PaymentStatus>('do_zapłaty');
  const [billType, setBillType] = useState<BillType>('gaz');
  const [propertyId, setPropertyId] = useState<string>('');
  const [recurringMonths, setRecurringMonths] = useState<number>(0);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const nodeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setIsDeleting(false);
      if (selectedEvent && selectedEvent.id) {
        // Jeśli edycja to mamy wyseparowany rawTitle 
        setTitle(selectedEvent.rawTitle || "");
        setEntryType(selectedEvent.type || 'payment');
        if (selectedEvent.type === 'payment') {
          setAmount(selectedEvent.amount?.toString() || "");
          setStatus(selectedEvent.status || 'do_zapłaty');
          setBillType(selectedEvent.billType || 'gaz');
        }
        setPropertyId(selectedEvent.propertyId || '');
        setRecurringMonths(0);
      } else {
        setTitle("");
        setAmount("");
        setEntryType('payment');
        setStatus('do_zapłaty');
        setBillType('gaz');
        setPropertyId('');
        setRecurringMonths(0);
      }
    }
  }, [isOpen, selectedEvent]);

  if (!isOpen) return null;

  const isCustomType = billType === 'inny';
  const categoryLabel = BILL_CATEGORIES.find(c => c.id === billType)?.label || 'Brak';

  const handleSave = async () => {
    if (entryType === 'payment') {
      if (isCustomType && !title.trim()) {
        alert("Proszę wpisać nazwę rachunku.");
        return;
      }
    } else {
      if (!title.trim()) {
        alert("Proszę wpisać nazwę notatki.");
        return;
      }
    }
    
    const finalAmount = amount ? parseFloat(amount) : null;
    
    // Ustalanie ostatecznego tytułu, by spełniał warunki:
    let finalTitle = title;
    if (entryType === 'payment' && !title.trim()) {
      const cat = BILL_CATEGORIES.find(c => c.id === billType);
      finalTitle = cat ? cat.label : 'Rachunek';
    }

    const payload = {
      title: finalTitle,
      start_date: selectedDate,
      entry_type: entryType,
      amount: finalAmount,
      status: status,
      is_planned: finalAmount === null ? true : false,
      bill_type: entryType === 'payment' ? billType : null,
      property_id: propertyId === '' ? null : propertyId
    };

    await onSave(selectedEvent?.id || null, payload, recurringMonths);
    onClose();
  };

  const executeDelete = async (mode: DeleteMode) => {
    if (selectedEvent?.id) {
      await onDelete(selectedEvent.id, mode, {
        startDate: selectedDate,
        billType: billType
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 overflow-hidden pointer-events-auto transition-colors duration-200">
      <Draggable nodeRef={nodeRef} handle=".drag-handle" bounds="parent">
        <div ref={nodeRef} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col max-h-[90vh] transition-colors duration-200 border dark:border-slate-800">
          
          {/* PASEK PRZESUWANIA (DRAG HANDLE) */}
          <div className="drag-handle cursor-move bg-gray-100 dark:bg-slate-800 flex items-center justify-center p-1.5 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors border-b border-gray-200 dark:border-slate-800 text-gray-400 dark:text-slate-500">
            <GripHorizontal size={20} />
          </div>

          <div className="flex border-b border-gray-100 dark:border-slate-800 shrink-0">
          <button 
            onClick={() => {setEntryType('payment'); setIsDeleting(false);}}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${entryType === 'payment' && !isDeleting ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-200'}`}
          >
            <Receipt size={18} /> Rachunek
          </button>
          <button 
            onClick={() => {setEntryType('note'); setIsDeleting(false);}}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${entryType === 'note' && !isDeleting ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-500' : 'text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-800 dark:hover:text-slate-200'}`}
          >
            <FileText size={18} /> Notatka
          </button>
        </div>

        {isDeleting ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Opcje usuwania</h3>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-4">Wybierz zakres usuwania dla wpisu "{selectedEvent?.rawTitle || title}":</p>
            
            <div className="space-y-6">
              {entryType === 'note' ? (
                <button onClick={() => executeDelete('single')} className="w-full text-center px-4 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-xl transition-colors border border-red-200 dark:border-red-500/30 text-sm font-bold mt-4">
                  🗑 Usuń Notatkę
                </button>
              ) : (
                <>
                  {/* POZIOM A: Pojedynczy */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider ml-1 mb-2">A. Bieżący</h4>
                    <button onClick={() => executeDelete('single')} className="w-full text-left px-4 py-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white rounded-xl transition-colors border border-gray-200 dark:border-slate-700 text-sm font-medium dark:text-slate-200">
                      Usuń ten wpis
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-normal mt-1">Usuwa tylko ten jeden rachunek z danego dnia.</p>
                    </button>
                  </div>
                  
                  {/* POZIOM B: Kategoria */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider ml-1 mb-2">B. Kategoria ({categoryLabel})</h4>
                    <div className="space-y-2">
                      <button onClick={() => executeDelete('category-future')} className="w-full text-left px-4 py-3 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50 dark:hover:bg-orange-900/40 hover:text-orange-700 dark:hover:text-orange-300 rounded-xl transition-colors border border-orange-100 dark:border-orange-900/50 text-sm font-medium dark:text-orange-400">
                        Anuluj przyszłe: {categoryLabel}
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-normal mt-1">Usuwa zaplanowane rachunki typu {categoryLabel}.</p>
                      </button>
                      <button onClick={() => executeDelete('category-past')} className="w-full text-left px-4 py-3 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50 dark:hover:bg-orange-900/40 hover:text-orange-700 dark:hover:text-orange-300 rounded-xl transition-colors border border-orange-100 dark:border-orange-900/50 text-sm font-medium dark:text-orange-400">
                        Usuń historię: {categoryLabel}
                        <p className="text-xs text-gray-500 dark:text-slate-400 font-normal mt-1">Usuwa stare rachunki typu {categoryLabel}.</p>
                      </button>
                    </div>
                  </div>

                  {/* POZIOM C: Globalny */}
                  <div className="bg-red-50 dark:bg-red-500/10 p-4 rounded-2xl border border-red-100 dark:border-red-500/20 mt-4">
                    <h4 className="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wider mb-2">C. Akcje Globalne</h4>
                    <div className="space-y-2">
                      <button onClick={() => executeDelete('global-future')} className="w-full text-left px-4 py-3 bg-white dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors border border-red-200 dark:border-red-900/50 text-sm font-bold shadow-sm">
                        Zresetuj wszystkie plany
                        <p className="text-xs text-red-400 dark:text-red-500 font-normal mt-1">Usuwa wszystkie zaplanowane płatności ze wszystkich kategorii.</p>
                      </button>
                      <button onClick={() => executeDelete('global-past')} className="w-full text-left px-4 py-3 bg-white dark:bg-slate-800 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors border border-red-200 dark:border-red-900/50 text-sm font-bold shadow-sm">
                        Archiwizuj / Usuń historię
                        <p className="text-xs text-red-400 dark:text-red-500 font-normal mt-1">Usuwa wszystkie stare rekordy z kalendarza ze wszystkich kategorii.</p>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedEvent?.id ? 'Edytuj wpis' : 'Dodaj dla dnia'}: {selectedDate}</h3>
              {selectedEvent?.id && (
                <button onClick={() => setIsDeleting(true)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors">
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            {/* Nowy Box: Kategorie Rachunków i Mieszkanie */}
            {entryType === 'payment' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Mieszkanie (opcjonalnie)</label>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-900 dark:text-slate-100 transition-colors cursor-pointer"
                    value={propertyId}
                    onChange={(e) => setPropertyId(e.target.value)}
                  >
                    <option value="">-- Brak / Ogólne --</option>
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Kategoria</label>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-900 dark:text-slate-100 transition-colors cursor-pointer"
                    value={billType}
                    onChange={(e) => setBillType(e.target.value as BillType)}
                  >
                    {BILL_CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">
                {entryType === 'note' 
                  ? 'Treść notatki' 
                  : (isCustomType ? 'Nazwa rachunku' : 'Dodatkowy Opis (opcjonalnie)')}
              </label>
              {entryType === 'note' ? (
                <textarea 
                  className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-y min-h-[120px] transition-colors text-gray-900 dark:text-white"
                  placeholder="Wpisz tutaj długą notatkę..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  rows={5}
                />
              ) : (
                <input 
                  className={`w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors text-gray-900 dark:text-white ${isCustomType && entryType === 'payment' && !title ? 'border-red-300 dark:border-red-500/50 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20' : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                  placeholder={isCustomType ? 'np. Inny wydatek' : 'np. za styczeń'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              )}
            </div>

            {entryType === 'payment' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Kwota</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-colors"
                    placeholder="Kwota (zł)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1">Status</label>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-900 dark:text-white transition-colors"
                    value={status}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as PaymentStatus)}
                  >
                    <option value="planowany">🟡 Planowany</option>
                    <option value="do_zapłaty">🔴 Do zapłaty</option>
                    <option value="opłacone">🟢 Opłacone</option>
                  </select>
                </div>
              </div>
            )}
            
            {!selectedEvent?.id && entryType === 'payment' && (
              <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-200 dark:border-slate-700 transition-colors">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
                    <Repeat size={16} className="text-blue-600 dark:text-blue-400" /> Cykliczność
                  </span>
                  <select 
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg text-sm text-gray-700 dark:text-slate-200 outline-none transition-colors"
                    value={recurringMonths}
                    onChange={(e) => setRecurringMonths(parseInt(e.target.value))}
                  >
                    <option value={0}>Brak (tylko raz)</option>
                    <option value={1}>Przez 1 miesiąc w przód</option>
                    <option value={3}>Przez 3 miesiące w przód</option>
                    <option value={6}>Przez 6 miesięcy w przód</option>
                    <option value={12}>Przez 12 miesięcy w przód</option>
                    <option value={24}>Przez 24 miesiące w przód</option>
                  </select>
                </label>
                {recurringMonths > 0 && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-2 ml-6">
                    Kolejne rachunki wygenerują się z pustą kwotą do oszacowania i statusem 'planowany'.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800 border-t dark:border-slate-700 flex gap-3 shrink-0 transition-colors duration-200">
          {isDeleting ? (
            <button onClick={() => setIsDeleting(false)} className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors">
              Wróć do edycji
            </button>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-xl transition-all shadow-sm border border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500">Anuluj</button>
              <button onClick={handleSave} className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-xl shadow-md hover:bg-blue-700 dark:hover:bg-blue-600 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                {selectedEvent?.id ? 'Zapisz zmiany' : 'Utwórz'}
              </button>
            </>
          )}
        </div>
      </div>
      </Draggable>
    </div>
  );
}
