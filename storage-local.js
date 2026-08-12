// storage-local.js — adapter that uses localStorage (extended)
const STORAGE_KEY = 'mybiblio:v1';

function readState(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"shelves":[],"books":[]}');
  }catch(e){
    return {shelves:[],books:[]};
  }
}
function writeState(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export const LocalStorageAdapter = {
  getShelves: async () => {
    return readState().shelves;
  },
  createShelf: async (name) => {
    const state = readState();
    const trimmed = (name||'').trim();
    if(!trimmed) throw new Error('Nom requis');
    const existing = state.shelves.find(s => s.name.toLowerCase() === trimmed.toLowerCase());
    if(existing) return existing;
    const newShelf = { id: Date.now().toString(), name: trimmed, createdAt: new Date().toISOString() };
    state.shelves.push(newShelf);
    writeState(state);
    return newShelf;
  },
  updateShelf: async (id, newName) => {
    const state = readState();
    const shelf = state.shelves.find(s => s.id === id);
    if(!shelf) throw new Error('Étagère introuvable');
    const trimmed = (newName||'').trim();
    if(!trimmed) throw new Error('Nom requis');
    // check uniqueness
    const exists = state.shelves.find(s => s.id !== id && s.name.toLowerCase() === trimmed.toLowerCase());
    if(exists) throw new Error('Une autre étagère porte déjà ce nom');
    shelf.name = trimmed;
    writeState(state);
    return shelf;
  },
  deleteShelf: async (id) => {
    const state = readState();
    state.shelves = state.shelves.filter(s => s.id !== id);
    // set books' shelfId to null
    state.books = state.books.map(b => ({...b, shelfId: b.shelfId === id ? null : b.shelfId}));
    writeState(state);
  },
  getBooks: async () => {
    return readState().books;
  },
  createBook: async ({title,author,shelfId=null}) => {
    const state = readState();
    const newBook = {
      id: Date.now().toString(),
      title: (title||'').trim(),
      author: (author||'').trim(),
      shelfId: shelfId || null,
      createdAt: new Date().toISOString()
    };
    state.books.push(newBook);
    writeState(state);
    return newBook;
  },
  deleteBook: async (id) => {
    const state = readState();
    state.books = state.books.filter(b => b.id !== id);
    writeState(state);
  },
  exportData: async () => {
    return readState();
  },
  importData: async (data) => {
    const state = {
      shelves: Array.isArray(data.shelves) ? data.shelves : [],
      books: Array.isArray(data.books) ? data.books : []
    };
    writeState(state);
    return state;
  },
  clear: async () => {
    localStorage.removeItem(STORAGE_KEY);
  }
};
