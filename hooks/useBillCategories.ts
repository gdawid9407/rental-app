import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { BILL_CATEGORIES } from '../types/calendar';

export interface CustomCategory {
  id: string;
  label: string;
  icon: string;
}

export function useBillCategories() {
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_bill_categories')
        .select('*')
        .order('label', { ascending: true });

      if (error) throw error;
      setCustomCategories(data || []);
    } catch (err) {
      console.error('Error fetching custom categories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async (label: string, icon: string = '📄') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('custom_bill_categories')
        .insert([{ label, icon, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchCategories();
      return data;
    } catch (err) {
      console.error('Error adding category:', err);
      return null;
    }
  };

  const allCategories = [
    ...BILL_CATEGORIES,
    ...customCategories.map(c => ({ id: c.id, label: c.label, icon: c.icon }))
  ];

  return { 
    allCategories, 
    customCategories, 
    isLoading, 
    addCategory, 
    refresh: fetchCategories 
  };
}
