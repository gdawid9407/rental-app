"use client";
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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

  // Zmienne stanu autoryzacji
  const [user, setUser] = useState<any>(null);
  const [isCheckingUser, setIsCheckingUser] = useState(true);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Sprawdzanie sesji użytkownika
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setIsCheckingUser(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (isRegisterMode) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setAuthError(error.message);
      } else {
        setAuthSuccess("Sukces! Zarejestrowano pomyślnie. Zaloguj się.");
        setIsRegisterMode(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setAuthError("Błędny email lub hasło");
    }
  };

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

  if (isCheckingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 font-medium animate-pulse">Ładowanie...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8 pt-10 pb-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Rental App</h1>
            <p className="text-sm text-gray-500">
              {isRegisterMode 
                ? "Utwórz konto, aby rozpocząć zarządzanie swoimi danymi."
                : "Zaloguj się, aby uzyskać dostęp do swojego kalendarza i danych."}
            </p>
          </div>
          
          {authSuccess && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-6 text-center border border-green-200">
              {authSuccess}
            </div>
          )}

          {authError && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 text-center border border-red-100">
              {authError}
            </div>
          )}
          
          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Adres e-mail</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="jan@kowalski.pl"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hasło</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white rounded-xl px-4 py-3 mt-4 font-semibold hover:bg-blue-700 active:bg-blue-800 transition shadow-sm"
            >
              {isRegisterMode ? "Zarejestruj się" : "Zaloguj"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setAuthError('');
                setAuthSuccess('');
              }}
              className="text-sm text-blue-600 hover:text-blue-700 transition font-medium"
            >
              {isRegisterMode ? "Masz już konto? Zaloguj się" : "Nie masz konta? Zarejestruj się"}
            </button>
          </div>
        </div>
      </div>
    );
  }

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