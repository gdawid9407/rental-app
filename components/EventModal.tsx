import React, { useState, useEffect } from 'react';
import { X, Receipt, FileText, Trash2 } from 'lucide-react';
import type { EntryType, PaymentStatus, CalendarEvent } from '../types/calendar';

// Propsy dla modala
export interface ModalEventState {
  id?: string | null;
  title?: string;
  type?: EntryType;
  amount?: string;
  status?: PaymentStatus;
  isRecurring?: boolean;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
  selectedEvent: ModalEventState | null;
  onSave: (id: string | null, payload: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function EventModal({ isOpen, onClose, selectedDate, selectedEvent, onSave, onDelete }: EventModalProps) {
  const [entryType, setEntryType] = useState<EntryType>('payment');
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<PaymentStatus>('do_zapłaty');
  const [isRecurring, setIsRecurring] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (selectedEvent && selectedEvent.id) {
        // Tryb edycji
        setTitle(selectedEvent.title?.split(' - ')[0].replace('💰 ', '').replace('📝 ', '') || "");
        setEntryType(selectedEvent.type || 'payment');
        if (selectedEvent.type === 'payment') {
          setAmount(selectedEvent.amount || "");
          setStatus(selectedEvent.status || 'do_zapłaty');
        }
        setIsRecurring(selectedEvent.isRecurring || false);
      } else {
        // Tryb tworzenia
        setTitle("");
        setAmount("");
        setEntryType('payment');
        setStatus('do_zapłaty');
        setIsRecurring(false);
      }
    }
  }, [isOpen, selectedEvent]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!title) return;
    
    const payload = {
      title: entryType === 'payment' ? `💰 ${title} - ${amount} zł` : `📝 ${title}`,
      start_date: selectedDate,
      entry_type: entryType,
      amount: amount ? parseFloat(amount) : null,
      status: status,
      is_recurring: isRecurring
    };

    await onSave(selectedEvent?.id || null, payload);
    onClose();
  };

  const handleDelete = async () => {
    if (selectedEvent?.id) {
      await onDelete(selectedEvent.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setEntryType('payment')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${entryType === 'payment' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <Receipt size={18} /> Rachunek
          </button>
          <button 
            onClick={() => setEntryType('note')}
            className={`flex-1 py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${entryType === 'note' ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:bg-gray-50'}`}
          >
            <FileText size={18} /> Notatka
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900">{selectedEvent?.id ? 'Edytuj wpis' : 'Dodaj dla dnia'}: {selectedDate}</h3>
            {selectedEvent?.id && (
              <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                <Trash2 size={20} />
              </button>
            )}
          </div>
          
          <input 
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Wpisz nazwę..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          {entryType === 'payment' && (
            <div className="grid grid-cols-2 gap-4">
              <input 
                type="number"
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                placeholder="Kwota (zł)"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <select 
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                value={status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as PaymentStatus)}
              >
                <option value="nadchodzi">🟡 Nadchodzi</option>
                <option value="do_zapłaty">🔴 Do zapłaty</option>
                <option value="opłacone">🟢 Opłacone</option>
              </select>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 text-sm font-medium text-gray-600">Anuluj</button>
          <button onClick={handleSave} className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl shadow-lg">
            {selectedEvent?.id ? 'Zapisz zmiany' : 'Dodaj'}
          </button>
        </div>
      </div>
    </div>
  );
}
