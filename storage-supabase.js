// storage-supabase.js - Supabase adapter for browser
// Requires window.SUPABASE_URL and window.SUPABASE_ANON_KEY to be set before importing this module.

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase config missing. Set window.SUPABASE_URL and window.SUPABASE_ANON_KEY before loading the script.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: { params: { eventsPerSecond: 10 } }
});

export const SupabaseAdapter = {
  // Shelves
  getShelves: async () => {
    const { data, error } = await supabase.from('shelves').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data;
  },
  createShelf: async (name) => {
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Nom requis');
    // try insert; unique constraint in DB should prevent duplicates
    const { data, error } = await supabase.from('shelves').insert({ name: trimmed }).select().single();
    if (error) throw error;
    return data;
  },
  updateShelf: async (id, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) throw new Error('Nom requis');
    const { data, error } = await supabase.from('shelves').update({ name: trimmed }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  deleteShelf: async (id) => {
    const { error } = await supabase.from('shelves').delete().eq('id', id);
    if (error) throw error;
    // books' shelf_id handling should be managed by DB foreign key (ON DELETE SET NULL)
  },
  // Books
  getBooks: async () => {
    const { data, error } = await supabase.from('books').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  createBook: async ({ title, author, shelfId = null, isbn = null }) => {
    if (!title || !title.trim()) throw new Error('Titre requis');
    const payload = { title: title.trim(), author: (author || '').trim(), shelf_id: shelfId || null, isbn: isbn || null };
    const { data, error } = await supabase.from('books').insert(payload).select().single();
    if (error) throw error;
    return data;
  },
  deleteBook: async (id) => {
    const { error } = await supabase.from('books').delete().eq('id', id);
    if (error) throw error;
  },
  // export/import/clear: for convenience we implement export/import using select/insert
  exportData: async () => {
    const shelvesResp = await supabase.from('shelves').select('*');
    if (shelvesResp.error) throw shelvesResp.error;
    const booksResp = await supabase.from('books').select('*');
    if (booksResp.error) throw booksResp.error;
    return { shelves: shelvesResp.data, books: booksResp.data };
  },
  importData: async (data) => {
    if (!data || (!Array.isArray(data.shelves) && !Array.isArray(data.books))) throw new Error('Données invalides');
    // naive import: upsert shelves (by name), then insert books mapping shelf names to ids
    const trx = []; // no transactions in supabase client in browser; do best effort
    // upsert shelves
    for (const s of data.shelves || []) {
      const name = (s.name || '').trim();
      if (!name) continue;
      await supabase.from('shelves').upsert({ id: s.id, name }).select();
    }
    // insert books
    for (const b of data.books || []) {
      const payload = { title: b.title || '', author: b.author || '', isbn: b.isbn || null, shelf_id: b.shelfId || null };
      await supabase.from('books').insert(payload);
    }
    return true;
  },
  clear: async () => {
    // delete books then shelves
    let resp = await supabase.from('books').delete().neq('id', '');
    if (resp.error) throw resp.error;
    resp = await supabase.from('shelves').delete().neq('id', '');
    if (resp.error) throw resp.error;
  },
  // auth helpers (pass-through)
  signIn: (opts) => supabase.auth.signIn(opts),
  signOut: () => supabase.auth.signOut(),
  onAuthChange: (cb) => supabase.auth.onAuthStateChange(cb)
};
