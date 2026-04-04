"use client";
import React, { useState } from 'react';
import { useCalendarEvents, type DeleteMode } from '../hooks/useCalendarEvents';
import { Header } from '../components/Header';
import { Calendar } from '../components/Calendar';
import { EventModal, type ModalEventState } from '../components/EventModal';
import type { DateClickInfo, EventClickInfo } from '../types/calendar';export type ModuleType = 'calendar' | 'analyzer' | 'deals' | 'stats' | 'database';

export default function RentalCalendar() {
  const { events, isLoading, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  
  const [activeModule, setActiveModule] = useState<ModuleType>('calendar');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<ModalEventState | null>(null);

  const handleDateClick = (info: DateClickInfo) => {
    setSelectedEvent(null);
    setSelectedDate(info.dateStr);
    setIsModalOpen(true);
  };

  const handleEventClick = (clickInfo: EventClickInfo) => {
    const event = clickInfo.event;
    setSelectedDate(event.startStr);
    setSelectedEvent({
      id: event.id,
      title: event.title,
      type: event.extendedProps.type,
      amount: event.extendedProps.amount?.toString(),
      status: event.extendedProps.status,
      isPlanned: event.extendedProps.isPlanned,
      recurringGroupId: event.extendedProps.recurringGroupId,
      billType: event.extendedProps.billType,
      rawTitle: event.extendedProps.rawTitle,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (id: string | null, payload: any, recurringMonths?: number) => {
    try {
      if (id) {
        await updateEvent(id, payload);
      } else {
        await addEvent(payload, recurringMonths);
      }
    } catch (error: any) {
      alert("Błąd: " + error.message);
    }
  };

  const handleDelete = async (id: string, mode: DeleteMode, extraData?: any) => {
    try {
      await deleteEvent(id, mode, extraData);
    } catch (error: any) {
      alert("Błąd: " + error.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 md:p-12 text-gray-900">
      <div className="mx-auto max-w-6xl bg-white md:rounded-2xl md:shadow-2xl border border-gray-200 overflow-hidden relative">
        <Header isLoading={isLoading} />
        
        {/* Przełącznik modułów ze wsparciem responsywności scrollX dla wielu tagów */}
        <div className="px-8 pt-4 border-b border-gray-100 flex gap-6 bg-white overflow-x-auto whitespace-nowrap hide-scrollbar">
          <button 
            onClick={() => setActiveModule('calendar')}
            className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${activeModule === 'calendar' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Kalendarz
          </button>
          <button 
            onClick={() => setActiveModule('analyzer')}
            className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${activeModule === 'analyzer' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Analizator Inwestycyjny
          </button>
          <button 
            onClick={() => setActiveModule('deals')}
            className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${activeModule === 'deals' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Wyszukiwarka Okazji
          </button>
          <button 
            onClick={() => setActiveModule('stats')}
            className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${activeModule === 'stats' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Statystyki
          </button>
          <button 
            onClick={() => setActiveModule('database')}
            className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${activeModule === 'database' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Baza Danych
          </button>
        </div>

        {activeModule === 'calendar' ? (
          <>
            <Calendar 
              events={events} 
              onDateClick={handleDateClick} 
              onEventClick={handleEventClick} 
            />
            <EventModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              selectedDate={selectedDate}
              selectedEvent={selectedEvent}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          </>
        ) : activeModule === 'analyzer' ? (
          <div className="p-24 flex flex-col items-center justify-center text-gray-400">
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Analizator Inwestycyjny</h2>
            <p>Jesteś w nowym module. Funkcjonalność ta zostanie wdrożona w przyszłości.</p>
          </div>
        ) : activeModule === 'deals' ? (
          <div className="p-24 flex flex-col items-center justify-center text-gray-400 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Wyszukiwarka Okazji</h2>
            <p>Tutaj znajdzie się potężne narzędzie do prześwietlania rynku nieruchomości.</p>
          </div>
        ) : activeModule === 'stats' ? (
          <div className="p-24 flex flex-col items-center justify-center text-gray-400 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Statystyki Danych Mieszkań</h2>
            <p>Głębokie metryki finansowe i raporty z rentowności. W budowie.</p>
          </div>
        ) : activeModule === 'database' ? (
          <div className="p-24 flex flex-col items-center justify-center text-gray-400 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-gray-600 mb-2">Baza Danych</h2>
            <p>Centralna hurtownia informacji, archiwum i tabele zarządzania. W budowie.</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}