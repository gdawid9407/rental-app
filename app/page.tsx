"use client";
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { X, Receipt, FileText, Repeat, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase'; // Import połączenia
import type { CalendarEvent, EntryType, PaymentStatus, DateClickInfo, EventClickInfo } from '../types/calendar';

export default function RentalCalendar() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Pola formularza
  const [entryType, setEntryType] = useState<EntryType>('payment');
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<PaymentStatus>('do_zapłaty');
  const [isRecurring, setIsRecurring] = useState(false);

  // 1. POBIERANIE DANYCH Z SUPABASE PRZY STARCIE
  const fetchEvents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('calendar_entries').select('*');
    
    if (error) {
      console.error("Błąd pobierania:", error.message);
    } else if (data) {
      const mappedEvents = data.map(item => ({
        id: item.id,
        title: item.title,
        start: item.start_date,
        allDay: true,
        backgroundColor: item.entry_type === 'payment' ? 
          (item.status === 'opłacone' ? '#dcfce7' : item.status === 'do_zapłaty' ? '#fee2e2' : '#fef3c7') : '#f3f4f6',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        extendedProps: { 
          type: item.entry_type, 
          status: item.status, 
          amount: item.amount 
        }
      }));
      setEvents(mappedEvents);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleDateClick = (info: DateClickInfo) => {
    resetForm();
    setSelectedDate(info.dateStr);
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickInfo) => {
    const event = clickInfo.event;
    setSelectedEventId(event.id);
    setSelectedDate(event.startStr);
    setTitle(event.title.split(' - ')[0].replace('💰 ', '').replace('📝 ', ''));
    setEntryType(event.extendedProps.type);
    
    if (event.extendedProps.type === 'payment') {
      setAmount(event.extendedProps.amount || "");
      setStatus(event.extendedProps.status || "do_zapłaty");
    }
    setIsModalOpen(true);
  };

  // 2. ZAPISYWANIE/EDYCJA W SUPABASE
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

    if (selectedEventId) {
      // Aktualizacja istniejącego wpisu
      const { error } = await supabase
        .from('calendar_entries')
        .update(payload)
        .eq('id', selectedEventId);
      if (error) alert("Błąd aktualizacji: " + error.message);
    } else {
      // Dodawanie nowego wpisu
      const { error } = await supabase
        .from('calendar_entries')
        .insert([payload]);
      if (error) alert("Błąd zapisu: " + error.message);
    }
    
    fetchEvents(); // Odśwież widok z bazy
    resetForm();
  };

  // 3. USUWANIE Z SUPABASE
  const handleDelete = async () => {
    if (selectedEventId) {
      const { error } = await supabase
        .from('calendar_entries')
        .delete()
        .eq('id', selectedEventId);
      
      if (error) {
        alert("Błąd usuwania: " + error.message);
      } else {
        fetchEvents();
        resetForm();
      }
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
            <p className="text-sm text-gray-500">
              {isLoading ? "Synchronizacja z bazą..." : "Zarządzanie finansami i notatkami"}
            </p>
          </div>
        </div>

        <div className="p-4 md:p-8">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
            initialView="dayGridMonth"
            locale="pl"
            events={events}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
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
                <button onClick={resetForm} className="flex-1 py-2 text-sm font-medium text-gray-600">Anuluj</button>
                <button onClick={handleSave} className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-xl shadow-lg">
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