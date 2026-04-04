import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarEvent, BILL_CATEGORIES } from '../types/calendar';

export type DeleteMode = 'single' | 'series' | 'type' | 'all-planned';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('calendar_entries').select('*');
    
    if (error) {
      console.error("Błąd pobierania:", error.message);
    } else if (data) {
      const mappedEvents = data.map(item => {
        let displayTitle = item.title;

        if (item.entry_type === 'payment') {
          const cat = BILL_CATEGORIES.find(c => c.id === item.bill_type) || BILL_CATEGORIES.find(c => c.id === 'inny')!;
          const hasCustomTitle = item.title && item.title !== cat.label;
          
          let baseText = hasCustomTitle ? `${cat.icon} ${cat.label} - ${item.title}` : `${cat.icon} ${cat.label}`;
          
          if (item.amount !== null) {
            baseText += ` - ${item.amount} zł`;
          } else if (item.is_planned || item.amount === null) {
            baseText += ` - Do ustalenia`;
          }
          displayTitle = baseText;
        } else {
          displayTitle = `📝 ${item.title}`;
        }

        return {
          id: item.id,
          title: displayTitle,
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
            recurringGroupId: item.recurring_group_id || null,
            billType: item.bill_type || 'inny',
            rawTitle: item.title // przechowujemy czysty tekst do edycji
          }
        };
      });
      setEvents(mappedEvents);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const addEvent = async (payload: any, recurringMonths: number = 0) => {
    let payloads = [payload];

    if (recurringMonths > 0 && payload.start_date) {
      const groupId = crypto.randomUUID();
      payload.recurring_group_id = groupId;
      
      const firstDate = new Date(payload.start_date);
      for (let i = 1; i <= recurringMonths; i++) {
        const nextDate = new Date(firstDate);
        nextDate.setMonth(nextDate.getMonth() + i);

        payloads.push({
          ...payload,
          amount: null,
          status: 'planowany',
          start_date: nextDate.toISOString().split('T')[0],
          is_planned: true
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

  const deleteEvent = async (
    id: string,
    mode: DeleteMode = 'single',
    extraData?: { recurringGroupId?: string | null, startDate?: string, baseTitle?: string, entryType?: string }
  ) => {
    switch (mode) {
      case 'series':
        if (extraData?.recurringGroupId && extraData?.startDate) {
          const { error } = await supabase
            .from('calendar_entries')
            .delete()
            .eq('recurring_group_id', extraData.recurringGroupId)
            .gte('start_date', extraData.startDate);
          if (error) throw new Error(error.message);
        }
        break;
      case 'type':
        if (extraData?.baseTitle && extraData?.startDate) {
          // Ponieważ zapisujemy do bazy jako title czysty tekst z modala, kasujemy dokładnie te o tej samej czystej nazwie!
          const { error } = await supabase
            .from('calendar_entries')
            .delete()
            .eq('is_planned', true)
            .eq('title', extraData.baseTitle)
            .gte('start_date', extraData.startDate);
          if (error) throw new Error(error.message);
        }
        break;
      case 'all-planned':
        if (extraData?.startDate) {
          const { error } = await supabase
            .from('calendar_entries')
            .delete()
            .eq('is_planned', true)
            .gte('start_date', extraData.startDate);
          if (error) throw new Error(error.message);
        }
        break;
      case 'single':
      default:
        const { error: err } = await supabase.from('calendar_entries').delete().eq('id', id);
        if (err) throw new Error(err.message);
        break;
    }
    
    await fetchEvents();
  };

  return { events, isLoading, fetchEvents, addEvent, updateEvent, deleteEvent };
}
