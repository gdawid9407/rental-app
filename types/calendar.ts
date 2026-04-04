export type EntryType = 'payment' | 'note';
export type PaymentStatus = 'planowany' | 'do_zapłaty' | 'opłacone';

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
}

export interface EventClickInfo {
  event: {
    id: string;
    startStr: string;
    title: string;
    extendedProps: Record<string, any>;
  };
}
