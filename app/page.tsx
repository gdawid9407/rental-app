"use client";
import React, { useState, useEffect } from 'react'; // Dodaliśmy useEffect
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { X, Receipt, FileText, Repeat, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase'; // TO JEST KLUCZOWE POŁĄCZENIE

export default function RentalCalendar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [events, setEvents] = useState<any[]>([]);
  
  // Stan dla edytowanego elementu
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Pola formularza
  const [entryType, setEntryType] = useState<'payment' | 'note'>('payment');
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<'nadchodzi' | 'do_zapłaty' | 'opłacone'>('do_zapłaty');
  const [isRecurring, setIsRecurring] = useState(false);

  // KLIKNIĘCIE W PUSTY DZIEŃ (Dodawanie)
  const handleDateClick = (info: any) => {
    resetForm();
    setSelectedDate(info.dateStr);
    setIsModalOpen(true);
  };

  // KLIKNIĘCIE W ISTNIEJĄCY ELEMENT (Podgląd/Usuwanie)
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event;
    setSelectedEventId(event.id);
    setSelectedDate(event.startStr);
    setTitle(event.title.split(' - ')[0].replace('💰 ', '').replace('📝 ', ''));
    setEntryType(event.extendedProps.type);
    
    if (event.extendedProps.type === 'payment') {
      setAmount(event.extendedProps.amount);
      setStatus(event.extendedProps.status);
    }
    
    setIsModalOpen(true);
  };

  // ZAPISYWANIE
  const handleSave = () => {
    if (!title) return;

    const newEventData: any = {
      id: selectedEventId || Math.random().toString(), // Jeśli edytujemy, zostawiamy ten sam ID
      start: selectedDate,
      allDay: true,
    };

    if (entryType === 'payment') {
      const statusColors = {
        nadchodzi: { bg: '#fef3c7', text: '#92400e', border: '#f59e0b' },
        do_zapłaty: { bg: '#fee2e2', text: '#991b1b', border: '#ef4444' },
        opłacone: { bg: '#dcfce7', text: '#166534', border: '#22c55e' }
      };
      newEventData.title = `💰 ${title} - ${amount} zł`;
      newEventData.backgroundColor = statusColors[status].bg;
      newEventData.textColor = statusColors[status].text;
      newEventData.borderColor = statusColors[status].border;
      newEventData.extendedProps = { type: 'payment', status, amount };
    } else {
      newEventData.title = `📝 ${title}`;
      newEventData.backgroundColor = '#f3f4f6';
      newEventData.textColor = '#374151';
      newEventData.borderColor = '#d1d5db';
      newEventData.extendedProps = { type: 'note' };
    }

    if (selectedEventId) {
      // Edycja: podmieniamy element w tablicy
      setEvents(events.map(ev => ev.id === selectedEventId ? newEventData : ev));
    } else {
      // Nowy: dodajemy do tablicy
      setEvents([...events, newEventData]);
    }
    
    resetForm();
  };

  // USUWANIE
  const handleDelete = () => {
    if (selectedEventId) {
      setEvents(events.filter(ev => ev.id !== selectedEventId));
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setSelectedEventId(null);
    setIsModalOpen(false);
    setIsRecurring(false);
    setStatus('do_zapłaty');
  };

  return (
    <main className="min-h-screen bg-gray-50 md:p-12 text-gray-900">
      <div className="mx-auto max-w-6xl bg-white md:rounded-2xl md:shadow-2xl border border-gray-200 overflow-hidden relative">
        
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rental App</h1>
            <p className="text-sm text-gray-500">Zarządzanie finansami i notatkami</p>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
            initialView="dayGridMonth"
            locale="pl"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick} // Obsługa kliknięcia w wydarzenie
            height="auto"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'multiMonthYear,dayGridMonth,dayGridWeek'
            }}
          />
        </div>

        {isModalOpen && (
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
                  <h3 className="text-lg font-bold text-gray-900">{selectedEventId ? 'Edytuj wpis' : 'Dodaj dla dnia'}: {selectedDate}</h3>
                  {selectedEventId && (
                    <button 
                      onClick={handleDelete}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Usuń wpis"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Tytuł</label>
                  <input 
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Wpisz nazwę..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                {entryType === 'payment' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Kwota (zł)</label>
                      <input 
                        type="number"
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-gray-400 mb-1">Status</label>
                      <select 
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        value={status}
                        onChange={(e: any) => setStatus(e.target.value)}
                      >
                        <option value="nadchodzi">🟡 Nadchodzi</option>
                        <option value="do_zapłaty">🔴 Do zapłaty</option>
                        <option value="opłacone">🟢 Opłacone</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                <button onClick={resetForm} className="flex-1 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors">Anuluj</button>
                <button onClick={handleSave} className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-colors">
                  {selectedEventId ? 'Zapisz zmiany' : 'Dodaj'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}