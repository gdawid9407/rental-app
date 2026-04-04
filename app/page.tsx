"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { useCalendarEvents, type DeleteMode } from '../hooks/useCalendarEvents';
import { useProperties } from '../hooks/useProperties';
import { Header } from '../components/Header';
import { Calendar } from '../components/Calendar';
import { EventModal, type ModalEventState } from '../components/EventModal';
import { BILL_CATEGORIES, type BillType } from '../types/calendar';
import type { DateClickInfo, EventClickInfo } from '../types/calendar';export type ModuleType = 'calendar' | 'analyzer' | 'deals' | 'stats' | 'database';

export default function RentalCalendar() {
  const { events, isLoading, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  const { properties, isLoading: isPropertiesLoading } = useProperties();
  
  const [activeModule, setActiveModule] = useState<ModuleType>('calendar');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedBillType, setSelectedBillType] = useState<BillType | ''>('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
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
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-500 dark:text-slate-400 font-medium animate-pulse">Ładowanie...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 transition-colors duration-200">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-gray-200 dark:border-slate-800 p-8 pt-10 pb-10">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2">Rental App</h1>
            <p className="text-sm text-gray-500 dark:text-slate-400">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Adres e-mail</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                placeholder="jan@kowalski.pl"
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1.5">Hasło</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                className="w-full border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" 
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
    <main className="min-h-screen bg-gray-50 dark:bg-slate-950 md:p-12 text-gray-900 dark:text-slate-100 transition-colors duration-200">
      <div className="mx-auto max-w-6xl bg-white dark:bg-slate-900 md:rounded-2xl md:shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden relative transition-colors duration-200">
        <Header isLoading={isLoading} />
        
        {/* Przełącznik modułów ze wsparciem responsywności scrollX dla wielu tagów */}
        <div className="px-8 pt-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 overflow-x-auto whitespace-nowrap hide-scrollbar transition-colors duration-200">
          <div className="flex gap-6">
            <button 
              onClick={() => setActiveModule('calendar')}
              className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${activeModule === 'calendar' ? 'text-blue-600 dark:text-amber-400 border-b-2 border-blue-600 dark:border-amber-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              Kalendarz
            </button>
            <button 
              onClick={() => setActiveModule('analyzer')}
              className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${activeModule === 'analyzer' ? 'text-blue-600 dark:text-amber-400 border-b-2 border-blue-600 dark:border-amber-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              Analizator Inwestycyjny
            </button>
            <button 
              onClick={() => setActiveModule('deals')}
              className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${activeModule === 'deals' ? 'text-blue-600 dark:text-amber-400 border-b-2 border-blue-600 dark:border-amber-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              Wyszukiwarka Okazji
            </button>
            <button 
              onClick={() => setActiveModule('stats')}
              className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${activeModule === 'stats' ? 'text-blue-600 dark:text-amber-400 border-b-2 border-blue-600 dark:border-amber-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              Statystyki
            </button>
            <button 
              onClick={() => setActiveModule('database')}
              className={`pb-4 text-sm font-semibold transition-colors shrink-0 ${activeModule === 'database' ? 'text-blue-600 dark:text-amber-400 border-b-2 border-blue-600 dark:border-amber-400' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              Baza Danych
            </button>
          </div>
        </div>

        {activeModule === 'calendar' ? (
          <>
            {/* Pasek Filtrów – kompaktowy */}
            <div className="px-8 py-3 border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-3 transition-colors duration-200">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                  isFilterOpen
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/40 shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
                Filtry
                {(selectedPropertyId !== '' || selectedBillType !== '') && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                    {(selectedPropertyId !== '' ? 1 : 0) + (selectedBillType !== '' ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Aktywne filtry jako tagi (widoczne gdy panel zamknięty) */}
              {!isFilterOpen && (selectedPropertyId !== '' || selectedBillType !== '') && (
                <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap hide-scrollbar">
                  {selectedPropertyId !== '' && (() => {
                    const prop = properties.find(p => p.id === selectedPropertyId);
                    return prop ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: prop.color }}></span>
                        {prop.name}
                        <button onClick={(e) => { e.stopPropagation(); setSelectedPropertyId(''); }} className="ml-0.5 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </span>
                    ) : null;
                  })()}
                  {selectedBillType !== '' && (() => {
                    const cat = BILL_CATEGORIES.find(c => c.id === selectedBillType);
                    return cat ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                        {cat.icon} {cat.label}
                        <button onClick={(e) => { e.stopPropagation(); setSelectedBillType(''); }} className="ml-0.5 text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </span>
                    ) : null;
                  })()}
                  <button
                    onClick={() => { setSelectedPropertyId(''); setSelectedBillType(''); }}
                    className="text-xs text-gray-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium"
                  >
                    Wyczyść
                  </button>
                </div>
              )}
            </div>

            {/* Rozwijany Panel Filtrów */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isFilterOpen ? 'max-h-[300px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="bg-gray-50/80 dark:bg-slate-900/80 border-b border-gray-100 dark:border-slate-800 px-8 py-4 space-y-4">
                {/* Filtr Nieruchomości */}
                {properties.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">Mieszkanie</span>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setSelectedPropertyId('')}
                        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedPropertyId === '' ? 'bg-gray-800 dark:bg-blue-600/20 text-white dark:text-blue-400 shadow-sm border border-transparent dark:border-blue-500/40' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95'}`}
                      >
                        Wszystkie
                      </button>
                      {properties.map(prop => (
                        <button
                          key={prop.id}
                          onClick={() => setSelectedPropertyId(prop.id)}
                          className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${selectedPropertyId === prop.id ? 'bg-gray-800 dark:bg-blue-600/20 text-white dark:text-blue-400 shadow-sm border border-transparent dark:border-blue-500/40' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95'}`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: prop.color }}></span>
                          {prop.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtr Typu Rachunku */}
                <div>
                  <span className="text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 block">Typ rachunku</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedBillType('')}
                      className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${selectedBillType === '' ? 'bg-gray-800 dark:bg-blue-600/20 text-white dark:text-blue-400 shadow-sm border border-transparent dark:border-blue-500/40' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95'}`}
                    >
                      Wszystkie
                    </button>
                    {BILL_CATEGORIES.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedBillType(cat.id)}
                        className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${selectedBillType === cat.id ? 'bg-gray-800 dark:bg-blue-600/20 text-white dark:text-blue-400 shadow-sm border border-transparent dark:border-blue-500/40' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 active:scale-95'}`}
                      >
                        <span>{cat.icon}</span>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Calendar 
              events={events.filter(e => {
                const matchProperty = selectedPropertyId === '' || e.extendedProps.propertyId === selectedPropertyId;
                const matchBillType = selectedBillType === '' || e.extendedProps.billType === selectedBillType;
                return matchProperty && matchBillType;
              })} 
              onDateClick={handleDateClick} 
              onEventClick={handleEventClick} 
            />
            <EventModal 
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              selectedDate={selectedDate}
              selectedEvent={selectedEvent}
              properties={properties}
              onSave={handleSave}
              onDelete={handleDelete}
            />
          </>
        ) : activeModule === 'analyzer' ? (
          <div className="p-24 flex flex-col items-center justify-center text-gray-400 dark:text-slate-400">
            <h2 className="text-2xl font-bold text-gray-600 dark:text-slate-300 mb-2">Analizator Inwestycyjny</h2>
            <p>Jesteś w nowym module. Funkcjonalność ta zostanie wdrożona w przyszłości.</p>
          </div>
        ) : activeModule === 'deals' ? (
          <div className="p-24 flex flex-col items-center justify-center text-gray-400 dark:text-slate-400 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-gray-600 dark:text-slate-300 mb-2">Wyszukiwarka Okazji</h2>
            <p>Tutaj znajdzie się potężne narzędzie do prześwietlania rynku nieruchomości.</p>
          </div>
        ) : activeModule === 'stats' ? (
          <div className="p-24 flex flex-col items-center justify-center text-gray-400 dark:text-slate-400 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-gray-600 dark:text-slate-300 mb-2">Statystyki Danych Mieszkań</h2>
            <p>Głębokie metryki finansowe i raporty z rentowności. W budowie.</p>
          </div>
        ) : activeModule === 'database' ? (
          <div className="p-24 flex flex-col items-center justify-center text-gray-400 dark:text-slate-400 animate-in fade-in zoom-in duration-300">
            <h2 className="text-2xl font-bold text-gray-600 dark:text-slate-300 mb-2">Baza Danych</h2>
            <p>Centralna hurtownia informacji, archiwum i tabele zarządzania. W budowie.</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}