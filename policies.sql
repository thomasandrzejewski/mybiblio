-- policies.sql
-- Example Row Level Security policies for a shared library with authenticated writes
-- Run these in Supabase SQL editor if you want:

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon) to read
CREATE POLICY public_books_select ON public.books FOR SELECT USING (true);
CREATE POLICY public_shelves_select ON public.shelves FOR SELECT USING (true);

-- Allow only authenticated users to INSERT/UPDATE/DELETE
CREATE POLICY auth_books_insert ON public.books FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY auth_books_update ON public.books FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY auth_books_delete ON public.books FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY auth_shelves_insert ON public.shelves FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY auth_shelves_update ON public.shelves FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY auth_shelves_delete ON public.shelves FOR DELETE USING (auth.role() = 'authenticated');

-- Note: these policies allow public reads but require authentication for writes.
