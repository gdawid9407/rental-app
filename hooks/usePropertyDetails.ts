import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LeaseInfo, MeterReading } from '../types/calendar';
import { useAuth } from '@/app/providers';

export interface PropertyContact {
  id: string;
  property_id: string;
  role: string | null;
  name: string;
  phone: string | null;
  email: string | null;
}

export function usePropertyDetails(propertyId: string) {
  const { user } = useAuth();
  const [lease, setLease] = useState<LeaseInfo | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [contacts, setContacts] = useState<PropertyContact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAllDetails = async () => {
    if (!user) return;
    setIsLoading(true);

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
    if (propertyId && user) fetchAllDetails();
  }, [propertyId, user]);

  const saveLease = async (payload: Partial<LeaseInfo>, contactPayload?: Partial<PropertyContact>) => {
    if (!user) return;

    let contactId = payload.tenant_contact_id;

    // 1. Obsługa synchronizacji kontaktu (Najemca)
    if (contactPayload && contactPayload.name) {
      if (contactId) {
        await supabase.from('property_contacts').update({
          name: contactPayload.name,
          phone: contactPayload.phone,
          email: contactPayload.email,
        }).eq('id', contactId);
      } else {
        const { data: newContact, error: cError } = await supabase.from('property_contacts').insert([{
          property_id: propertyId,
          user_id: user.id,
          name: contactPayload.name,
          phone: contactPayload.phone,
          email: contactPayload.email,
          role: `Główny Najemca`
        }]).select().single();
        
        if (cError) console.error("Błąd tworzenia kontaktu:", cError);
        if (newContact) contactId = newContact.id;
      }
    }

    // 2. Zapisywanie umowy
    const finalPayload = { ...payload, tenant_contact_id: contactId };

    if (lease?.id) {
      const { error } = await supabase.from('property_leases').update(finalPayload).eq('id', lease.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('property_leases').insert([{ ...finalPayload, property_id: propertyId, user_id: user.id }]);
      if (error) throw error;
    }
    await fetchAllDetails();
  };

  const addReading = async (payload: Omit<MeterReading, 'id' | 'property_id' | 'previous_value'>) => {
    if (!user) return;

    const { error } = await supabase.from('meter_readings').insert([{ ...payload, property_id: propertyId, user_id: user.id }]);
    if (error) throw error;
    await fetchAllDetails();
  };

  const addContact = async (payload: Omit<PropertyContact, 'id' | 'property_id'>) => {
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
