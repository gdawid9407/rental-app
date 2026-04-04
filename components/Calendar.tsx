import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import type { CalendarEvent, DateClickInfo, EventClickInfo } from '../types/calendar';

interface CalendarProps {
  events: CalendarEvent[];
  onDateClick: (info: DateClickInfo) => void;
  onEventClick: (info: EventClickInfo) => void;
}

export function Calendar({ events, onDateClick, onEventClick }: CalendarProps) {
  return (
    <div className="p-4 md:p-8">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin, multiMonthPlugin]}
        initialView="dayGridMonth"
        locale="pl"
        events={events}
        dateClick={onDateClick}
        eventClick={onEventClick}
        height="auto"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'multiMonthYear,dayGridMonth,dayGridWeek'
        }}
      />
    </div>
  );
}
