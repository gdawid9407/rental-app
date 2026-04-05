-- 1. Utworzenie tabeli property_notes
CREATE TABLE IF NOT EXISTS property_notes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  user_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'general' NOT NULL,
  is_pinned boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Włączenie RLS
ALTER TABLE property_notes ENABLE ROW LEVEL SECURITY;

-- 3. Stworzenie polityk RLS
DROP POLICY IF EXISTS "User can view their own property notes" ON property_notes;
DROP POLICY IF EXISTS "User can insert their own property notes" ON property_notes;
DROP POLICY IF EXISTS "User can update their own property notes" ON property_notes;
DROP POLICY IF EXISTS "User can delete their own property notes" ON property_notes;

CREATE POLICY "User can view their own property notes" ON property_notes
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "User can insert their own property notes" ON property_notes
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User can update their own property notes" ON property_notes
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "User can delete their own property notes" ON property_notes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
