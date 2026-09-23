import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const supabase = createClient(
  'https://pkeefrirxdvtvqbmbdhf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrZWVmcmlyeGR2dHZxYm1iZGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAwODQ3MDYsImV4cCI6MjEwNTY2MDcwNn0.hiVLrehjAAHxYdCQVX4D4hPStiOnUOxFU-Ig2swrgX4'
);

export async function currentUser() {
  // getUser() throws AuthSessionMissingError when the visitor is not logged in.
  // Reading the local session lets the application handle that normal state and
  // redirect the visitor to the login page instead of displaying an error.
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.user ?? null;
}

export async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email, password) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
}
