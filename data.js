export const statusLabels = { reading: 'En cours', read: 'Lu', 'to-read': 'À lire' };
let user;

export async function loadLibrary(supabase, currentUser) {
  user = currentUser;
  const [{ data: shelves, error: shelvesError }, { data: books, error: booksError }] = await Promise.all([
    supabase.from('shelves').select('*').order('created_at'),
    supabase.from('books').select('*').order('created_at', { ascending: false })
  ]);
  if (shelvesError) throw shelvesError;
  if (booksError) throw booksError;
  return { shelves: shelves || [], books: books || [] };
}

export async function createShelf(supabase, name) {
  const { data, error } = await supabase.from('shelves').insert({ user_id: user.id, name, color: '#334155' }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteShelf(supabase, id) {
  const { error } = await supabase.from('shelves').delete().eq('id', id);
  if (error) throw error;
}

export async function createBook(supabase, book) {
  const { data, error } = await supabase.from('books').insert({ ...book, user_id: user.id }).select().single();
  if (error) throw error;
  return data;
}

export async function deleteBook(supabase, id) {
  const { error } = await supabase.from('books').delete().eq('id', id);
  if (error) throw error;
}

export async function resetLibrary(supabase) {
  const { error } = await supabase.from('books').delete().eq('user_id', user.id);
  if (error) throw error;
  const { error: shelfError } = await supabase.from('shelves').delete().eq('user_id', user.id);
  if (shelfError) throw shelfError;
  return loadLibrary(supabase, user);
}
