"use client";
import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { X } from 'lucide-react'; // Ikona zamknięcia

export default function RentalCalendar() {
  // --- STAN APLIKACJI (Pamięć) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [notes, setNotes] = useState<any[]>([]); // Tu przechowujemy dodane notatki

  // Funkcja otwierająca okienko po kliknięciu w datę
  const handleDateClick = (info: any) => {
    setSelectedDate(info.dateStr);
    setIsModalOpen(true);
  };

  // Funkcja zapisująca notatkę
  const saveNote = () => {
    if (noteTitle.trim() === "") return;

    const newNote = {
      title: `📝 ${noteTitle}`,
      start: selectedDate,
      allDay: true,
      backgroundColor: '#f3f4f6',
      textColor: '#1f2937',
      borderColor: '#e5e7eb'
    };

    setNotes([...notes, newNote]); // Dodaj nową notatkę do listy
    setNoteTitle(""); // Wyczyść pole tekstowe
    setIsModalOpen(false); // Zamknij okienko
  };

  return (
    <main className="min-h-screen bg-gray-50 md:p-12">
      <div className="mx-auto max-w-6xl bg-white md:rounded-2xl md:shadow-2xl border-gray-200 overflow-hidden relative">
        
        {/* NAGŁÓWEK */}
        <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Rental App</h1>
            <p className="text-sm text-gray-500">Kliknij w dzień, aby dodać notatkę</p>
          </div>
        </div>

        {/* KALENDARZ */}
        <div className="p-4 md:p-8">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
            initialView="dayGridMonth"
            locale="pl"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'multiMonthYear,dayGridMonth,dayGridWeek'
            }}
            events={notes} // Wyświetlanie zapisanych notatek
            dateClick={handleDateClick}
            height="auto"
            selectable={true}
          />
        </div>

        {/* --- MODAL (OKIENKO) W STYLU macOS --- */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md m-4 rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-900">Nowa notatka: {selectedDate}</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Treść notatki</label>
                <input 
                  type="text" 
                  autoFocus
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  placeholder="Co chcesz zapisać?"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveNote()}
                />
              </div>

              <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Anuluj
                </button>
                <button 
                  onClick={saveNote}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors"
                >
                  Zapisz notatkę
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}