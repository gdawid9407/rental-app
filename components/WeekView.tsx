import React from 'react';
import type { CalendarEvent, DateClickInfo, EventClickInfo } from '../types/calendar';

const TIME_SLOTS = [
  { id: 'rano', label: 'Rano', icon: '🌅', hours: '6:00–12:00' },
  { id: 'poludnie', label: 'Południe', icon: '☀️', hours: '12:00–18:00' },
  { id: 'wieczor', label: 'Wieczór', icon: '🌆', hours: '18:00–00:00' },
  { id: 'noc', label: 'Noc', icon: '🌙', hours: '0:00–6:00' },
] as const;

interface WeekViewProps {
  weekStart: Date;
  events: CalendarEvent[];
  onDateClick: (info: DateClickInfo) => void;
  onEventClick: (info: EventClickInfo) => void;
}

function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  return days;
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function isToday(date: Date): boolean {
  const now = new Date();
  return date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
}

const DAY_NAMES_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'];

export function WeekView({ weekStart, events, onDateClick, onEventClick }: WeekViewProps) {
  const days = getWeekDays(weekStart);

  // Grupuj eventy po dacie
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  for (const ev of events) {
    const dateKey = ev.start;
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = [];
    eventsByDate[dateKey].push(ev);
  }

  const handleCellClick = (dateStr: string, timeSlot: string) => {
    onDateClick({ dateStr, timeSlot: timeSlot as any });
  };

  const handleEventClick = (ev: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventClick({
      event: {
        id: ev.id,
        startStr: ev.start,
        title: ev.title,
        extendedProps: ev.extendedProps,
      }
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
      {/* Siatka: kolumna etykiet + 7 kolumn dni */}
      <div className="grid grid-cols-[60px_repeat(7,1fr)] md:grid-cols-[80px_repeat(7,1fr)]">
        
        {/* === NAGŁÓWEK === */}
        <div className="bg-gray-50 dark:bg-slate-800/50 border-b border-r border-gray-100 dark:border-slate-700/50 p-2" />
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className={`border-b border-r last:border-r-0 border-gray-100 dark:border-slate-700/50 p-2 md:p-3 text-center transition-colors
                ${today ? 'bg-green-50 dark:bg-emerald-950/40' : 'bg-gray-50 dark:bg-slate-800/50'}`}
            >
              <div className={`text-xs font-bold uppercase tracking-wider ${today ? 'text-green-700 dark:text-green-400' : 'text-gray-400 dark:text-slate-500'}`}>
                {DAY_NAMES_SHORT[i]}
              </div>
              <div className={`text-lg md:text-xl font-bold mt-0.5 ${today ? 'text-green-800 dark:text-green-300' : 'text-gray-800 dark:text-slate-200'}`}>
                {day.getDate()}
              </div>
            </div>
          );
        })}

        {/* === WIERSZE SLOTÓW === */}
        {TIME_SLOTS.map((slot) => (
          <React.Fragment key={slot.id}>
            {/* Etykieta slotu */}
            <div className="border-b border-r border-gray-100 dark:border-slate-700/50 bg-gray-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center p-1 md:p-2 select-none">
              <span className="text-base md:text-lg">{slot.icon}</span>
              <span className="text-[10px] md:text-xs font-semibold text-gray-500 dark:text-slate-400 mt-0.5 leading-tight text-center">{slot.label}</span>
            </div>

            {/* Komórki dni */}
            {days.map((day, dayIndex) => {
              const dateStr = formatDateStr(day);
              const today = isToday(day);
              // Eventy wyłapujemy korzystając z rozszerzonej własności (albo wpadają do "rano" jako default z FullCalendar)
              const timeSlotEvents = (eventsByDate[dateStr] || []).filter(
                ev => (ev.extendedProps.timeSlot || 'rano') === slot.id
              );

              return (
                <div
                  key={`${slot.id}-${dayIndex}`}
                  onClick={() => handleCellClick(dateStr, slot.id)}
                  className={`border-b border-r last:border-r-0 border-gray-100 dark:border-slate-700/50 min-h-[70px] md:min-h-[80px] p-1 md:p-1.5 cursor-pointer transition-colors duration-150
                    ${today
                      ? 'bg-green-50/30 dark:bg-emerald-950/20 hover:bg-green-100/50 dark:hover:bg-emerald-900/30'
                      : 'hover:bg-blue-50/50 dark:hover:bg-slate-800/60'
                    }`}
                >
                  {timeSlotEvents.map(ev => (
                    <div
                      key={ev.id}
                      onClick={(e) => handleEventClick(ev, e)}
                      className="mb-1 px-1.5 py-1 rounded-md text-[10px] md:text-xs font-medium truncate cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm active:scale-95"
                      style={{
                        backgroundColor: ev.backgroundColor,
                        color: ev.textColor,
                        borderLeft: `3px solid ${ev.borderColor}`,
                      }}
                      title={ev.title}
                    >
                      {ev.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
