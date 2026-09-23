export const statusLabels = { reading: 'En cours', read: 'Lu', 'to-read': 'À lire' };

const shelfColors = [
  '#d97706', '#7c3aed', '#0f766e', '#2563eb', '#db2777',
  '#059669', '#dc2626', '#0891b2', '#9333ea', '#ca8a04'
];

const COVER_BUCKET = 'book-covers';
const MAX_COVER_SIZE = 5 * 1024 * 1024;
const COVER_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
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
  const { data, error } = await supabase.from('shelves').insert({ user_id: user.id, name, color: nextShelfColor(existingShelves) }).select().single();
  if (error) throw error;
  return data;
}

export async function updateShelf(supabase, id, name) {
  const { data, error } = await supabase.from('shelves').update({ name }).eq('id', id).eq('user_id', user.id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteShelf(supabase, id) {
  const { error } = await supabase.from('shelves').delete().eq('id', id).eq('user_id', user.id);
  if (error) throw error;
}

export async function uploadBookCover(supabase, file) {
  if (!file) return null;
  if (!COVER_TYPES.has(file.type)) throw new Error('Format non autorisé. Utilisez une image JPEG, PNG ou WebP.');
  if (file.size > MAX_COVER_SIZE) throw new Error('Image trop volumineuse. La taille maximale est de 5 Mo.');

  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(COVER_BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
    upsert: false
  });
  if (error) throw error;

  const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeBookCover(supabase, path) {
  if (!path) return;
  const { error } = await supabase.storage.from(COVER_BUCKET).remove([path]);
  if (error) console.warn('Impossible de supprimer l’ancienne couverture', error);
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
