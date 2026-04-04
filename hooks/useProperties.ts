import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Property } from '../types/calendar';

/*
  INSTRUKCJE SQL DO URUCHOMIENIA W PANELU SUPABASE:
  
  -- 1. Utworzenie tabeli properties:
  CREATE TABLE properties (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL,
    color text DEFAULT '#3b82f6',
    user_id uuid REFERENCES auth.users(id) NOT NULL
  );

  -- 2. Włączenie Row Level Security (RLS) na tabeli properties:
  ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

  -- 3. Stworzenie polityk:
  CREATE POLICY "User can insert their own properties" ON properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "User can view their own properties" ON properties FOR SELECT TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "User can update their own properties" ON properties FOR UPDATE TO authenticated USING (auth.uid() = user_id);
  CREATE POLICY "User can delete their own properties" ON properties FOR DELETE TO authenticated USING (auth.uid() = user_id);

  -- 4. Upewnij się, że tabela calendar_entries ma kolumnę property_id
  ALTER TABLE calendar_entries ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE SET NULL;
*/

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProperties = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      setProperties([]);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (error) {
      console.error("Błąd pobierania nieruchomości:", error.message);
    } else if (data) {
      setProperties(data as Property[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const addProperty = async (payload: Partial<Property>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Musisz być zalogowany");

    const newPayload = { ...payload, user_id: user.id };
    const { error } = await supabase.from('properties').insert([newPayload]);
    if (error) throw new Error(error.message);
    await fetchProperties();
  };

  const updateProperty = async (id: string, payload: Partial<Property>) => {
    const { error } = await supabase.from('properties').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
    await fetchProperties();
  };

  const deleteProperty = async (id: string, keepEvents: boolean) => {
    if (!keepEvents) {
      // Usun wszystkie wydatki kalendarzowe zwiazane z tym mieszkaniem manualnie, zanim usuniemy dom
      const { error: eventsError } = await supabase
        .from('calendar_entries')
        .delete()
        .eq('property_id', id);
        
      if (eventsError) throw new Error(eventsError.message);
    }
    
    // Potem usuwamy nieruchomość (jeśli keepEvents=true, baza dzięki ON DELETE SET NULL po prostu ustawi property_id=null na tych wpisach).
    const { error } = await supabase.from('properties').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchProperties();
  };

  return { properties, isLoading, fetchProperties, addProperty, updateProperty, deleteProperty };
}
