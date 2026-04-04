export type EntryType = 'payment' | 'note';
export type PaymentStatus = 'nadchodzi' | 'do_zapłaty' | 'opłacone';

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
  };
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
