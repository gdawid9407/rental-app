import React, { useState, useEffect } from 'react';
import { X, Receipt, FileText, Trash2, Repeat, AlertTriangle } from 'lucide-react';
import { EntryType, PaymentStatus, CalendarEvent, BILL_CATEGORIES, BillType } from '../types/calendar';
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
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedEvent: ModalEventState | null;
  onSave: (id: string | null, payload: any, recurringMonths?: number) => Promise<void>;
  onDelete: (id: string, mode: DeleteMode, extraData?: { recurringGroupId?: string | null, startDate?: string, baseTitle?: string, entryType?: EntryType }) => Promise<void>;
}

export function EventModal({ isOpen, onClose, selectedDate, selectedEvent, onSave, onDelete }: EventModalProps) {
  const [entryType, setEntryType] = useState<EntryType>('payment');
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<PaymentStatus>('do_zapłaty');
  const [billType, setBillType] = useState<BillType>('gaz');
  const [recurringMonths, setRecurringMonths] = useState<number>(0);
  
  const [isDeleting, setIsDeleting] = useState(false);

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
          setBillType(selectedEvent.billType || 'inny');
        }
        setRecurringMonths(0);
      } else {
        setTitle("");
        setAmount("");
        setEntryType('payment');
        setStatus('do_zapłaty');
        setBillType('gaz');
        setRecurringMonths(0);
      }
    }
  }, [isOpen, selectedEvent]);

  if (!isOpen) return null;

  const isCustomType = billType === 'inny';

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
      bill_type: entryType === 'payment' ? billType : null
    };

    await onSave(selectedEvent?.id || null, payload, recurringMonths);
    onClose();
  };

  const executeDelete = async (mode: DeleteMode) => {
    if (selectedEvent?.id) {
      await onDelete(selectedEvent.id, mode, {
        recurringGroupId: selectedEvent.recurringGroupId,
        startDate: selectedDate,
        baseTitle: selectedEvent.rawTitle || title, // używamy naturalnego title a nie formatowanego 
        entryType: entryType
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => {setEntryType('payment'); setIsDeleting(false);}}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${entryType === 'payment' && !isDeleting ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Receipt size={18} /> Rachunek
          </button>
          <button 
            onClick={() => {setEntryType('note'); setIsDeleting(false);}}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${entryType === 'note' && !isDeleting ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FileText size={18} /> Notatka
          </button>
        </div>

        {isDeleting ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="text-lg font-bold">Opcje usuwania</h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">Wybierz zakres usuwania dla wpisu "{selectedEvent?.rawTitle || title}":</p>
            
            <div className="space-y-2">
              <button onClick={() => executeDelete('single')} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-gray-200 text-sm font-medium">
                1. Usuń tylko ten jeden wpis
              </button>
              
              {selectedEvent?.recurringGroupId && (
                <button onClick={() => executeDelete('series')} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-gray-200 text-sm font-medium">
                  2. Usuń tę serię (ten wpis i przyszłe powiązane)
                </button>
              )}
              
              <button onClick={() => executeDelete('type')} className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors border border-gray-200 text-sm font-medium">
                3. Usuń wszystkie przyszłe zaplanowane z tej kategorii ("{selectedEvent?.rawTitle || title}")
              </button>

              <button onClick={() => executeDelete('all-planned')} className="w-full text-left px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors border border-red-200 text-sm font-bold mt-4">
                ⚠ Usuń WSZYSTKIE zaplanowane na przyszłość wpisy (Reset)
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{selectedEvent?.id ? 'Edytuj wpis' : 'Dodaj dla dnia'}: {selectedDate}</h3>
              {selectedEvent?.id && (
                <button onClick={() => setIsDeleting(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                  <Trash2 size={20} />
                </button>
              )}
            </div>

            {/* Nowy Box: Kategorie Rachunków */}
            {entryType === 'payment' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kategoria</label>
                <select 
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-900"
                  value={billType}
                  onChange={(e) => setBillType(e.target.value as BillType)}
                >
                  {BILL_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                {entryType === 'note' 
                  ? 'Nazwa notatki' 
                  : (isCustomType ? 'Nazwa rachunku' : 'Opis / Mieszkanie (opcjonalnie)')}
              </label>
              <input 
                className={`w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 ${isCustomType && entryType === 'payment' && !title ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                placeholder={entryType === 'note' ? 'Wpisz nazwę notatki...' : (isCustomType ? 'np. Inny wydatek' : 'np. Mieszkanie nr 4')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            {entryType === 'payment' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kwota</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kwota (zł)"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-gray-900"
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
              <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Repeat size={16} className="text-blue-600" /> Cykliczność
                  </span>
                  <select 
                    className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none"
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
                  <p className="text-xs text-gray-500 mt-2 ml-6">
                    Kolejne rachunki wygenerują się z pustą kwotą do oszacowania i statusem 'planowany'.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
          {isDeleting ? (
            <button onClick={() => setIsDeleting(false)} className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-xl bg-white hover:bg-gray-100">
              Wróć do edycji
            </button>
          ) : (
            <>
              <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-gray-600">Anuluj</button>
              <button onClick={handleSave} className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl shadow-lg hover:bg-blue-700">
                {selectedEvent?.id ? 'Zapisz zmiany' : 'Utwórz'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
