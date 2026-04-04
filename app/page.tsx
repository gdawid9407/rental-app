"use client";
import React, { useState } from 'react';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { Header } from '../components/Header';
import { Calendar } from '../components/Calendar';
import { EventModal, type ModalEventState } from '../components/EventModal';
import type { DateClickInfo, EventClickInfo } from '../types/calendar';

export default function RentalCalendar() {
  const { events, isLoading, addEvent, updateEvent, deleteEvent } = useCalendarEvents();
  
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
    });
    setIsModalOpen(true);
  };

  const handleSave = async (id: string | null, payload: any) => {
    try {
      if (id) {
        await updateEvent(id, payload);
      } else {
        await addEvent(payload);
      }
    } catch (error: any) {
      alert("Błąd: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
    } catch (error: any) {
      alert("Błąd: " + error.message);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 md:p-12 text-gray-900">
      <div className="mx-auto max-w-6xl bg-white md:rounded-2xl md:shadow-2xl border border-gray-200 overflow-hidden relative">
        <Header isLoading={isLoading} />
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
      </div>
    </main>
  );
}