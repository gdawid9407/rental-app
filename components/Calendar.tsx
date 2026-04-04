import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import type { CalendarEvent, DateClickInfo, EventClickInfo } from '../types/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick: (info: DateClickInfo) => void;
  onEventClick: (info: EventClickInfo) => void;
}

export function Calendar({ events, onDateClick, onEventClick }: CalendarProps) {
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewTitle, setViewTitle] = useState('');
  const [viewType, setViewType] = useState('dayGridMonth');

  // Metody nawigacyjne kalendarza
  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleNext = () => calendarRef.current?.getApi().next();

  // Dynamiczne kalkulowanie nawigacji po bokach zależnie od widoku
  const getNavLabels = () => {
    switch (viewType) {
      case 'multiMonthYear': {
        const currentYear = currentDate.getFullYear();
        return { prev: `${currentYear - 1}`, next: `${currentYear + 1}` };
      }
      case 'dayGridWeek': {
        return { prev: "Poprzedni tydzień", next: "Następny tydzień" };
      }
      case 'dayGridMonth':
      default: {
        const prevMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);

        const formatMonth = (date: Date) => {
          const str = new Intl.DateTimeFormat('pl', { month: 'long' }).format(date);
          return str.charAt(0).toUpperCase() + str.slice(1);
        };
        return { prev: formatMonth(prevMonthDate), next: formatMonth(nextMonthDate) };
      }
    }
  };

  const labels = getNavLabels();
  // Naprawa polskiego defaulta - pierwsza litera duża
  const centerText = viewTitle ? viewTitle.charAt(0).toUpperCase() + viewTitle.slice(1) : '';

  // Handler wychwytujący kliknięcie w tytuły miesięcy na widoku rocznym i wymuszający render konkretnego miesiąca
  const handleDelegatedClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const titleElement = target.closest('.fc-multimonth-title');
    
    // Jeśli kliknęliśmy w tytuł i jesteśmy w widoku wielomiesięcznym
    if (titleElement && viewType === 'multiMonthYear') {
      const monthContainer = titleElement.closest('.fc-multimonth-month');
      // Próbujemy wyciągnąć pierwszą datę z któregoś z pustych, technicznych dni wygenerowanego miesiąca
      const dayCell = monthContainer?.querySelector('.fc-day[data-date]');
      const cellDate = dayCell?.getAttribute('data-date');
      
      if (cellDate && calendarRef.current) {
        calendarRef.current.getApi().changeView('dayGridMonth', cellDate);
      }
    }
  };

  return (
    <div className="p-4 md:p-8">
      {/* Dynamicznie wymuszamy kursor pointer dla tytułów miesięcy FullCalendara w widoku rocznym */}
      <style>{`
        .fc-multimonth-title {
          cursor: pointer !important;
          transition: color 0.15s ease-in-out;
        }
        .fc-multimonth-title:hover {
          color: #2563eb !important;
        }
        .dark .fc-multimonth-title:hover {
          color: #60a5fa !important;
        }
        
        /* Eleganckie podświetlenie bieżącego dnia */
        .fc .fc-day-today {
          background-color: #f0fdf4 !important; /* Delikatna, odświeżająca zieleń */
        }
        .dark .fc .fc-day-today {
          background-color: #064e3b !important; /* text-emerald-900 w dark mode */
        }

        .fc .fc-day-today .fc-daygrid-day-number {
          color: #166534 !important; /* text-green-800 */
          font-weight: 800 !important;
          background-color: #dcfce7 !important; /* bg-green-100 */
          border-radius: 9999px;
          min-width: 24px;
          text-align: center;
          margin: 4px;
        }
        .dark .fc .fc-day-today .fc-daygrid-day-number {
          color: #a7f3d0 !important; /* text-green-200 */
          background-color: #065f46 !important; /* bg-green-800 */
        }
      `}</style>

      {/* Bardziej funkcjonalna auto-adaptująca się Nawigacja */}
      <div className="flex justify-between items-center mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm select-none transition-colors duration-200">
        <button 
          onClick={handlePrev} 
          className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-blue-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl transition-all font-medium text-sm w-44 justify-start"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline-block">{labels.prev}</span>
        </button>
        
        <div className="font-bold text-xl md:text-2xl text-gray-900 dark:text-white text-center flex-1">
          {centerText}
        </div>
        
        <button 
          onClick={handleNext} 
          className="flex items-center gap-2 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-blue-50 dark:hover:bg-slate-800 px-4 py-2 rounded-xl transition-all font-medium text-sm w-44 justify-end"
        >
          <span className="hidden sm:inline-block">{labels.next}</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 overflow-hidden transition-colors duration-200" onClick={handleDelegatedClick}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
          initialView="dayGridMonth"
          locale="pl"
          firstDay={1} // Poczatek Tygodnia: Poniedziałek
          events={events}
          dateClick={onDateClick}
          eventClick={onEventClick}
          height="auto"
          datesSet={(arg) => {
            setCurrentDate(arg.view.currentStart);
            setViewTitle(arg.view.title);
            setViewType(arg.view.type);
          }}
          headerToolbar={{
            left: 'today',
            center: '',
            right: 'multiMonthYear,dayGridMonth,dayGridWeek'
          }}
        />
      </div>
    </div>
  );
}
