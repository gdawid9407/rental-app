export type EntryType = 'payment' | 'note';
export type PaymentStatus = 'planowany' | 'do_zapłaty' | 'opłacone';
export type TimeSlot = 'rano' | 'poludnie' | 'wieczor' | 'noc';

export const BILL_CATEGORIES = [
  { id: 'gaz', label: 'Gaz', icon: '🔥' },
  { id: 'prad', label: 'Prąd', icon: '⚡' },
  { id: 'woda', label: 'Woda', icon: '💧' },
  { id: 'czynsz', label: 'Czynsz', icon: '🏠' },
  { id: 'podatek', label: 'Podatek', icon: '⚖️' },
  { id: 'smieci', label: 'Śmieci', icon: '♻️' },
  { id: 'inny', label: 'Inny', icon: '➕' },
] as const;

export type BillType = typeof BILL_CATEGORIES[number]['id'];

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  allDay: boolean;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  classNames?: string[];
  extendedProps: {
    type: EntryType;
    status: PaymentStatus;
    amount: number | null;
    isPlanned: boolean;
    recurringGroupId: string | null;
    billType?: BillType;
    propertyId?: string | null;
    timeSlot?: TimeSlot | null;
    rawTitle?: string;
    propertyName?: string | null;
  };
}

export interface Property {
  id: string;
  name: string;
  color: string;
  user_id: string;
}

export interface DateClickInfo {
  dateStr: string;
  timeSlot?: TimeSlot | null;
}

export interface EventClickInfo {
  event: {
    id: string;
    startStr: string;
    title: string;
    extendedProps: Record<string, any>;
  };
}

export type NoteCategory = 'technical' | 'tenant' | 'general';

export interface PropertyNote {
  id: string;
  property_id: string;
  user_id: string;
  content: string;
  category: NoteCategory;
  is_pinned: boolean;
  created_at: string;
}

export const NOTE_CATEGORIES = [
  { id: 'technical', label: 'Techniczne', icon: '🔧' },
  { id: 'tenant',    label: 'Najemcy',     icon: '👥' },
  { id: 'general',   label: 'Ogólne',      icon: '📝' },
] as const;

export interface MeterReading {
  id: string;
  property_id: string;
  type: 'prad' | 'gaz' | 'woda' | 'cieplo';
  value: number;
  date: string;
  previous_value?: number;
}

export interface LeaseInfo {
  id: string;
  property_id: string;
  tenant_name: string | null;
  tenant_contact: string | null;
  lease_start: string | null;
  lease_end: string | null;
  insurance_expiry: string | null;
  insurance_company?: string | null;
  insurance_policy_number?: string | null;
  rent_amount: number;
}
