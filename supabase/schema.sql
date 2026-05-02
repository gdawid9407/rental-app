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

-- 5. Tabela umów (rozszerzona o modularność)
CREATE TABLE IF NOT EXISTS property_leases (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES auth.users(id) NOT NULL,
    tenant_contact_id uuid REFERENCES property_contacts(id) ON DELETE SET NULL,
    tenant_name text,
    tenant_contact text,
    lease_start date,
    lease_end date,
    rent_amount numeric DEFAULT 0,
    deposit_amount numeric,
    insurance_company text,
    insurance_policy_number text,
    insurance_expiry date,
    widgets_config jsonb DEFAULT '[{"id": "def-tenant", "type": "tenant", "title": "Najemca"}, {"id": "def-lease", "type": "lease", "title": "Umowa Najmu"}]'::jsonb
);

ALTER TABLE property_leases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "User can view their own leases" ON property_leases;
CREATE POLICY "User can view their own leases" ON property_leases FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User can insert their own leases" ON property_leases;
CREATE POLICY "User can insert their own leases" ON property_leases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "User can update their own leases" ON property_leases;
CREATE POLICY "User can update their own leases" ON property_leases FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "User can delete their own leases" ON property_leases;
CREATE POLICY "User can delete their own leases" ON property_leases FOR DELETE TO authenticated USING (auth.uid() = user_id);
