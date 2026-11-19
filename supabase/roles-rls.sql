-- MyBiblio role and per-user access policies.
-- Review existing policies before applying: PostgreSQL combines permissive
-- policies with OR, so an older broad policy could still grant access.
-- Ensure every existing books/shelves row has the correct user_id first.
-- Standard users (missing app_metadata.role is treated as 'user') can only
-- read their own rows. Admins can read and write all rows.

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mybiblio_books_select_owner_or_admin" ON public.books;
CREATE POLICY "mybiblio_books_select_owner_or_admin"
  ON public.books FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (
      auth.uid() = user_id
      AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'user') = 'user'
    )
  );

DROP POLICY IF EXISTS "mybiblio_books_admin_insert" ON public.books;
CREATE POLICY "mybiblio_books_admin_insert"
  ON public.books FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "mybiblio_books_admin_update" ON public.books;
CREATE POLICY "mybiblio_books_admin_update"
  ON public.books FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "mybiblio_books_admin_delete" ON public.books;
CREATE POLICY "mybiblio_books_admin_delete"
  ON public.books FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "mybiblio_shelves_select_owner_or_admin" ON public.shelves;
CREATE POLICY "mybiblio_shelves_select_owner_or_admin"
  ON public.shelves FOR SELECT TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (
      auth.uid() = user_id
      AND COALESCE(auth.jwt() -> 'app_metadata' ->> 'role', 'user') = 'user'
    )
  );

DROP POLICY IF EXISTS "mybiblio_shelves_admin_insert" ON public.shelves;
CREATE POLICY "mybiblio_shelves_admin_insert"
  ON public.shelves FOR INSERT TO authenticated
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "mybiblio_shelves_admin_update" ON public.shelves;
CREATE POLICY "mybiblio_shelves_admin_update"
  ON public.shelves FOR UPDATE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

DROP POLICY IF EXISTS "mybiblio_shelves_admin_delete" ON public.shelves;
CREATE POLICY "mybiblio_shelves_admin_delete"
  ON public.shelves FOR DELETE TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- The À acheter page is still being built. Once its actual table and owner
-- column are confirmed, add equivalent SELECT-only owner/admin rules for users
-- and admin write rules for that table.
