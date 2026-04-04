import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { CalendarEvent } from '../types/calendar';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('calendar_entries').select('*');
    
    if (error) {
      console.error("Błąd pobierania:", error.message);
    } else if (data) {
      const mappedEvents = data.map(item => ({
        id: item.id,
        title: item.title,
        start: item.start_date,
        allDay: true,
        backgroundColor: item.entry_type === 'payment' ? 
          (item.status === 'opłacone' ? '#dcfce7' : item.status === 'do_zapłaty' ? '#fee2e2' : '#fef3c7') : '#f3f4f6',
        textColor: '#1f2937',
        borderColor: '#e5e7eb',
        extendedProps: { 
          type: item.entry_type, 
          status: item.status, 
          amount: item.amount 
        }
      }));
      setEvents(mappedEvents);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (payload: any) => {
    const { error } = await supabase.from('calendar_entries').insert([payload]);
    if (error) throw new Error(error.message);
    await fetchEvents();
  };

  const updateEvent = async (id: string, payload: any) => {
    const { error } = await supabase.from('calendar_entries').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
    await fetchEvents();
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('calendar_entries').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchEvents();
  };

  return { events, isLoading, fetchEvents, addEvent, updateEvent, deleteEvent };
}
