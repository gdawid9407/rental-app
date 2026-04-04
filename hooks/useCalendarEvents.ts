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
        borderColor: item.is_planned || item.amount === null ? '#9ca3af' : '#e5e7eb',
        classNames: item.is_planned || item.amount === null ? ['border-dashed', 'border-2', 'opacity-75'] : [],
        extendedProps: { 
          type: item.entry_type, 
          status: item.status, 
          amount: item.amount,
          isPlanned: item.is_planned || false,
          recurringGroupId: item.recurring_group_id || null
        }
      }));
      setEvents(mappedEvents);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (payload: any, isRecurring?: boolean) => {
    let payloads = [payload];

    if (isRecurring && payload.start_date) {
      const groupId = crypto.randomUUID();
      payload.recurring_group_id = groupId;
      
      const firstDate = new Date(payload.start_date);
      for (let i = 1; i < 12; i++) {
        const nextDate = new Date(firstDate);
        nextDate.setMonth(nextDate.getMonth() + i);
        
        // Obliczamy nowy tytuł dla planowanych, jeśli brak konkretnej kwoty
        // jeśli oryginalny payload ma null amount, tytuł będzie w stylu "Kwota do ustalenia"
        payloads.push({
          ...payload,
          start_date: nextDate.toISOString().split('T')[0],
          is_planned: true // Przyszłe kopie oznaczamy domyślnie jako planowane
        });
      }
    }

    const { error } = await supabase.from('calendar_entries').insert(payloads);
    if (error) throw new Error(error.message);
    await fetchEvents();
  };

  const updateEvent = async (id: string, payload: any) => {
    const { error } = await supabase.from('calendar_entries').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
    await fetchEvents();
  };

  const deleteEvent = async (id: string, cascadeDeleteData?: { recurringGroupId: string, startDate: string }) => {
    if (cascadeDeleteData) {
      // Usunięcie bieżącego i wszystkich przyszłych w serii
      const { error } = await supabase
        .from('calendar_entries')
        .delete()
        .eq('recurring_group_id', cascadeDeleteData.recurringGroupId)
        .gte('start_date', cascadeDeleteData.startDate);
      if (error) throw new Error(error.message);
    } else {
      // Usunięcie tylko tego jednego
      const { error } = await supabase.from('calendar_entries').delete().eq('id', id);
      if (error) throw new Error(error.message);
    }
    await fetchEvents();
  };

  return { events, isLoading, fetchEvents, addEvent, updateEvent, deleteEvent };
}
