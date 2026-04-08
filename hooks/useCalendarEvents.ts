import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { CalendarEvent, BILL_CATEGORIES, TimeSlot } from '../types/calendar';

/*
  INSTRUKCJE SQL DO URUCHOMIENIA W PANELU SUPABASE:
  
  -- 1. Dodanie kolumny user_id do tabeli calendar_entries:
  ALTER TABLE calendar_entries ADD COLUMN user_id uuid REFERENCES auth.users(id);

  -- 2. Włączenie Row Level Security (RLS) na tabeli:
  ALTER TABLE calendar_entries ENABLE ROW LEVEL SECURITY;

  -- 3. Stworzenie polityk dla użytkowników (tylko zalogowany użytkownik widzi i edytuje swoje dane):
  CREATE POLICY "User can insert their own entries" ON calendar_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "User can view their own entries" ON calendar_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "User can update their own entries" ON calendar_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "User can delete their own entries" ON calendar_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
*/

export type DeleteMode = 'single' | 'category-future' | 'category-past' | 'global-future' | 'global-past';

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = async () => {
    setIsLoading(true);
    
    // Pobranie aktualnie zalogowanego użytkownika
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setEvents([]);
      setIsLoading(false);
      return;
    }

    // Filtrujemy rekordy po user_id oraz pobieramy własne kategorie
    const [entriesRes, categoriesRes] = await Promise.all([
      supabase.from('calendar_entries').select('*, properties(name, color)').eq('user_id', user.id),
      supabase.from('custom_bill_categories').select('*').eq('user_id', user.id)
    ]);
    
    if (entriesRes.error) {
      console.error("Błąd pobierania:", entriesRes.error.message);
    } else if (entriesRes.data) {
      const customCats = categoriesRes.data || [];
      const allCats = [...BILL_CATEGORIES, ...customCats.map(c => ({ id: c.id, label: c.label, icon: c.icon }))];

      const mappedEvents = entriesRes.data.map((item: any) => {
        let displayTitle = item.title;
        const propertyName = item.properties?.name;

        if (item.entry_type === 'payment') {
          const cat = allCats.find(c => c.id === item.bill_type) || allCats.find(c => c.id === 'inny')!;
          const hasCustomTitle = item.title && item.title !== cat.label;
          
          // Ikona + Kategoria
          let baseText = propertyName 
            ? `${cat.icon} ${cat.label} (${propertyName})` 
            : `${cat.icon} ${cat.label}`;

          // Jeśli jest własny tytuł, dodajemy go (np. "za marzec")
          if (hasCustomTitle) {
            baseText += ` - ${item.title}`;
          }
          
          if (item.amount !== null) {
            baseText += ` - ${item.amount} zł`;
          } else if (!propertyName && (item.is_planned || item.amount === null)) {
            // "Do ustalenia" tylko jeśli nie ma ani kwoty, ani nieruchomości
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
          borderColor: item.properties?.color || (item.is_planned || item.amount === null ? '#9ca3af' : '#e5e7eb'),
          classNames: (item.is_planned || item.amount === null ? ['border-dashed', 'opacity-75', 'border-2'] : [])
            .concat(item.properties?.color ? ['has-property-color'] : []),
          extendedProps: { 
            type: item.entry_type, 
            status: item.status, 
            amount: item.amount,
            isPlanned: item.is_planned || false,
            recurringGroupId: item.recurring_group_id || null,
            billType: item.bill_type || 'inny',
            rawTitle: item.title,
            propertyId: item.property_id || null,
            timeSlot: item.time_slot as TimeSlot | null,
            propertyName: propertyName || null
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Musisz być zalogowany");

    const basePayload = { ...payload, user_id: user.id };
    let payloads = [basePayload];

    if (recurringMonths > 0 && basePayload.start_date) {
      const groupId = crypto.randomUUID();
      basePayload.recurring_group_id = groupId;
      
      const firstDate = new Date(basePayload.start_date);
      for (let i = 1; i <= recurringMonths; i++) {
        const nextDate = new Date(firstDate);
        nextDate.setMonth(nextDate.getMonth() + i);

        payloads.push({
          ...basePayload,
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
    extraData?: { startDate?: string, billType?: string }
  ) => {
    switch (mode) {
      case 'category-future':
        if (extraData?.billType && extraData?.startDate) {
          const { error } = await supabase
            .from('calendar_entries')
            .delete()
            .eq('bill_type', extraData.billType)
            .gte('start_date', extraData.startDate);
          if (error) throw new Error(error.message);
        }
        break;
      case 'category-past':
        if (extraData?.billType && extraData?.startDate) {
          const { error } = await supabase
            .from('calendar_entries')
            .delete()
            .eq('bill_type', extraData.billType)
            .lt('start_date', extraData.startDate);
          if (error) throw new Error(error.message);
        }
        break;
      case 'global-future':
        if (extraData?.startDate) {
          const { error } = await supabase
            .from('calendar_entries')
            .delete()
            .gte('start_date', extraData.startDate);
          if (error) throw new Error(error.message);
        }
        break;
      case 'global-past':
        if (extraData?.startDate) {
          const { error } = await supabase
            .from('calendar_entries')
            .delete()
            .lt('start_date', extraData.startDate);
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
