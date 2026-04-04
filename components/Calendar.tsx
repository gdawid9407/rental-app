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

  return (
    <div className="p-4 md:p-8">
      {/* Bardziej funkcjonalna auto-adaptująca się Nawigacja */}
      <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm select-none">
        <button 
          onClick={handlePrev} 
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all font-medium text-sm w-44 justify-start"
        >
          <ChevronLeft size={18} />
          <span className="hidden sm:inline-block">{labels.prev}</span>
        </button>
        
        <div className="font-bold text-xl md:text-2xl text-gray-900 text-center flex-1">
          {centerText}
        </div>
        
        <button 
          onClick={handleNext} 
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl transition-all font-medium text-sm w-44 justify-end"
        >
          <span className="hidden sm:inline-block">{labels.next}</span>
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 overflow-hidden">
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
