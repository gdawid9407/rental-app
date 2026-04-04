import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import type { CalendarEvent, DateClickInfo, EventClickInfo } from '../types/calendar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeekView } from './WeekView';

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

  // Programowe przełączanie widoku
  const changeView = (view: string) => {
    calendarRef.current?.getApi().changeView(view);
  };

  const handleToday = () => {
    calendarRef.current?.getApi().today();
  };

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
  const centerText = viewTitle ? viewTitle.charAt(0).toUpperCase() + viewTitle.slice(1) : '';

  // Handler wychwytujący kliknięcie w tytuły miesięcy na widoku rocznym
  const handleDelegatedClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const titleElement = target.closest('.fc-multimonth-title');
    
    if (titleElement && viewType === 'multiMonthYear') {
      const monthContainer = titleElement.closest('.fc-multimonth-month');
      const dayCell = monthContainer?.querySelector('.fc-day[data-date]');
      const cellDate = dayCell?.getAttribute('data-date');
      
      if (cellDate && calendarRef.current) {
        calendarRef.current.getApi().changeView('dayGridMonth', cellDate);
      }
    }
  };

  const VIEW_OPTIONS = [
    { id: 'multiMonthYear', label: 'Rok' },
    { id: 'dayGridMonth', label: 'Miesiąc' },
    { id: 'dayGridWeek', label: 'Tydzień' },
  ];

  return (
    <div className="p-4 md:p-8">
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
        .fc .fc-day-today {
          background-color: #f0fdf4 !important;
        }
        .dark .fc .fc-day-today {
          background-color: #064e3b !important;
        }
        .fc .fc-day-today .fc-daygrid-day-number {
          color: #166534 !important;
          font-weight: 800 !important;
          background-color: #dcfce7 !important;
          border-radius: 9999px;
          min-width: 24px;
          text-align: center;
          margin: 4px;
        }
        .dark .fc .fc-day-today .fc-daygrid-day-number {
          color: #a7f3d0 !important;
          background-color: #065f46 !important;
        }
      `}</style>

      {/* Nawigacja + przełącznik widoku */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm select-none transition-colors duration-200">
        {/* Nawigacja Prev / Tytuł / Next */}
        <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
          <button 
            onClick={handlePrev} 
            className="flex items-center gap-1 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-blue-50 dark:hover:bg-slate-800 px-3 py-2 rounded-xl transition-all font-medium text-sm"
          >
            <ChevronLeft size={18} />
            <span className="hidden md:inline-block">{labels.prev}</span>
          </button>
          
          <div className="font-bold text-lg md:text-xl text-gray-900 dark:text-white text-center flex-1 truncate">
            {centerText}
          </div>
          
          <button 
            onClick={handleNext} 
            className="flex items-center gap-1 text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-amber-400 hover:bg-blue-50 dark:hover:bg-slate-800 px-3 py-2 rounded-xl transition-all font-medium text-sm"
          >
            <span className="hidden md:inline-block">{labels.next}</span>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Przełącznik widoku + Dziś */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Dziś
          </button>
          <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-0.5 border border-gray-200 dark:border-slate-700">
            {VIEW_OPTIONS.map(opt => (
              <button
                key={opt.id}
                onClick={() => changeView(opt.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                  viewType === opt.id
                    ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Widok Tygodniowy — niestandardowy */}
      {viewType === 'dayGridWeek' && (
        <WeekView
          weekStart={currentDate}
          events={events}
          onDateClick={onDateClick}
          onEventClick={onEventClick}
        />
      )}

      {/* FullCalendar — ukryty w trybie tygodniowym, zamontowany dla nawigacji */}
      <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm p-4 overflow-hidden transition-colors duration-200 ${viewType === 'dayGridWeek' ? 'hidden' : ''}`} onClick={handleDelegatedClick}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
          initialView="dayGridMonth"
          locale="pl"
          firstDay={1}
          events={events}
          dateClick={onDateClick}
          eventClick={onEventClick}
          height="auto"
          datesSet={(arg) => {
            setCurrentDate(arg.view.currentStart);
            setViewTitle(arg.view.title);
            setViewType(arg.view.type);
          }}
          headerToolbar={false}
        />
      </div>
    </div>
  );
}
