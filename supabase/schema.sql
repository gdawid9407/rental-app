-- 1. Upewnij się, że rozszerzenie UUID jest aktywne
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Aktualizacja tabeli (dodanie DEFAULT, jeśli go brakowało)
ALTER TABLE properties 
ALTER COLUMN id SET DEFAULT gen_random_uuid(),
ALTER COLUMN user_id SET DEFAULT auth.uid();

-- 3. Odświeżenie polityk RLS (usuwamy stare i dodajemy nowe, by mieć pewność)
DROP POLICY IF EXISTS "User can insert their own properties" ON properties;
DROP POLICY IF EXISTS "User can view their own properties" ON properties;
DROP POLICY IF EXISTS "User can update their own properties" ON properties;
DROP POLICY IF EXISTS "User can delete their own properties" ON properties;

CREATE POLICY "User can insert their own properties" ON properties FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "User can view their own properties" ON properties FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User can update their own properties" ON properties FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "User can delete their own properties" ON properties FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. Upewnienie się, że powiązanie w kalendarzu istnieje
ALTER TABLE calendar_entries 
ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id) ON DELETE SET NULL;

ALTER TABLE calendar_entries ADD COLUMN time_slot text DEFAULT 'rano';
