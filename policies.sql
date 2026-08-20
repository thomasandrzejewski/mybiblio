-- policies.sql
-- Row Level Security policies for MyBiblio
-- Run these in Supabase SQL editor

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;

-- Allow anyone (anon or authenticated) to READ
CREATE POLICY public_books_select ON public.books FOR SELECT USING (true);
CREATE POLICY public_shelves_select ON public.shelves FOR SELECT USING (true);

-- Allow anyone (anon or authenticated) to INSERT
CREATE POLICY public_books_insert ON public.books FOR INSERT WITH CHECK (true);
CREATE POLICY public_shelves_insert ON public.shelves FOR INSERT WITH CHECK (true);

-- Allow anyone (anon or authenticated) to UPDATE
CREATE POLICY public_books_update ON public.books FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY public_shelves_update ON public.shelves FOR UPDATE USING (true) WITH CHECK (true);

-- Allow anyone (anon or authenticated) to DELETE
CREATE POLICY public_books_delete ON public.books FOR DELETE USING (true);
CREATE POLICY public_shelves_delete ON public.shelves FOR DELETE USING (true);

-- Note: These permissive policies allow public read/write. 
-- For production, you should implement proper authentication and restrict policies accordingly.
