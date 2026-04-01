import { createClient } from '@supabase/supabase-js';

// Te linie pobierają dane z Twojego pliku .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Tworzymy i eksportujemy klienta
export const supabase = createClient(supabaseUrl, supabaseAnonKey);