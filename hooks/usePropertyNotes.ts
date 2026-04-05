import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { PropertyNote, NoteCategory } from '../types/calendar';

export function usePropertyNotes(propertyId: string | null) {
  const [notes, setNotes] = useState<PropertyNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotes = useCallback(async () => {
    if (!propertyId) {
      setNotes([]);
      return;
    }
    
    setIsLoading(true);
    const { data, error } = await supabase
      .from('property_notes')
      .select('*')
      .eq('property_id', propertyId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching notes:", error.message);
    } else {
      setNotes(data as PropertyNote[]);
    }
    setIsLoading(false);
  }, [propertyId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const addNote = async (content: string, category: NoteCategory) => {
    if (!propertyId) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Musisz być zalogowany");

    const payload = {
      property_id: propertyId,
      user_id: user.id,
      content,
      category,
      is_pinned: false
    };

    const { data, error } = await supabase.from('property_notes').insert([payload]).select().single();
    if (error) throw new Error(error.message);
    
    await fetchNotes();
    return data as PropertyNote;
  };

  const deleteNote = async (id: string) => {
    const { error } = await supabase.from('property_notes').delete().eq('id', id);
    if (error) throw new Error(error.message);
    await fetchNotes();
  };

  const togglePin = async (id: string, isPinned: boolean) => {
    const { error } = await supabase
      .from('property_notes')
      .update({ is_pinned: !isPinned })
      .eq('id', id);
    if (error) throw new Error(error.message);
    await fetchNotes();
  };

  const deleteAllNotes = async () => {
    if (!propertyId) return;
    const { error } = await supabase.from('property_notes').delete().eq('property_id', propertyId);
    if (error) throw new Error(error.message);
    await fetchNotes();
  };

  return { notes, isLoading, fetchNotes, addNote, deleteNote, togglePin, deleteAllNotes };
}
