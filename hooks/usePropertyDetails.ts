import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LeaseInfo, MeterReading } from '../types/calendar';

export interface PropertyContact {
  id: string;
  property_id: string;
  role: string | null;
  name: string;
  phone: string | null;
  email: string | null;
}

export function usePropertyDetails(propertyId: string) {
  const [lease, setLease] = useState<LeaseInfo | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [contacts, setContacts] = useState<PropertyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllDetails = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [leaseRes, readingsRes, contactsRes] = await Promise.all([
      supabase.from('property_leases').select('*').eq('property_id', propertyId).maybeSingle(),
      supabase.from('meter_readings').select('*').eq('property_id', propertyId).order('date', { ascending: false }),
      supabase.from('property_contacts').select('*').eq('property_id', propertyId).order('created_at', { ascending: true })
    ]);

    if (leaseRes.data) setLease(leaseRes.data as LeaseInfo);
    if (readingsRes.data) {
      // Add previous_value logic
      const sorted = (readingsRes.data as MeterReading[]);
      const withPrev = sorted.map((r, i) => {
        const nextOfSameType = sorted.slice(i + 1).find(prev => prev.type === r.type);
        return { ...r, previous_value: nextOfSameType?.value };
      });
      setReadings(withPrev);
    }
    if (contactsRes.data) setContacts(contactsRes.data as PropertyContact[]);
    
    setIsLoading(false);
  };

  useEffect(() => {
    if (propertyId) fetchAllDetails();
  }, [propertyId]);

  const saveLease = async (payload: Partial<LeaseInfo>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    if (lease?.id) {
      const { error } = await supabase.from('property_leases').update(payload).eq('id', lease.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('property_leases').insert([{ ...payload, property_id: propertyId, user_id: user.id }]);
      if (error) throw error;
    }
    await fetchAllDetails();
  };

  const addReading = async (payload: Omit<MeterReading, 'id' | 'property_id' | 'previous_value'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('meter_readings').insert([{ ...payload, property_id: propertyId, user_id: user.id }]);
    if (error) throw error;
    await fetchAllDetails();
  };

  const addContact = async (payload: Omit<PropertyContact, 'id' | 'property_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('property_contacts').insert([{ ...payload, property_id: propertyId, user_id: user.id }]);
    if (error) throw error;
    await fetchAllDetails();
  };

  const deleteContact = async (contactId: string) => {
    const { error } = await supabase.from('property_contacts').delete().eq('id', contactId);
    if (error) throw error;
    await fetchAllDetails();
  };

  return {
    lease,
    readings,
    contacts,
    isLoading,
    saveLease,
    addReading,
    addContact,
    deleteContact,
    refresh: fetchAllDetails
  };
}
