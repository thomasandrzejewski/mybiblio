export const statusLabels = { reading: 'En cours', read: 'Lu', 'to-read': 'À lire' };

const shelfColors = [
  '#d97706', '#7c3aed', '#0f766e', '#2563eb', '#db2777',
  '#059669', '#dc2626', '#0891b2', '#9333ea', '#ca8a04'
];

let user;

function nextShelfColor(existingShelves = []) {
  const usedColors = new Set(existingShelves.map((shelf) => shelf.color?.toLowerCase()).filter(Boolean));
  return shelfColors.find((color) => !usedColors.has(color.toLowerCase())) ||
    `hsl(${(existingShelves.length * 137.508) % 360} 65% 45%)`;
}

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

export async function createShelf(supabase, name, existingShelves = []) {
  const { data, error } = await supabase.from('shelves').insert({
    user_id: user.id,
    name,
    color: nextShelfColor(existingShelves)
  }).select().single();
  if (error) throw error;
  return data;
}

export async function updateShelf(supabase, id, name) {
  const { data, error } = await supabase.from('shelves')
    .update({ name })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteShelf(supabase, id) {
  const { error } = await supabase.from('shelves').delete().eq('id', id).eq('user_id', user.id);
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
