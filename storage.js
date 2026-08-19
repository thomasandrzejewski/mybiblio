// storage.js - selects SupabaseAdapter if SUPABASE_URL/KEY are present, otherwise falls back to LocalStorageAdapter
// Exports a single named object `Storage` with async methods mirroring the adapters.

// Initialize adapter promise early
const adapterPromise = (async () => {
  try {
    if (window.SUPABASE_URL && window.SUPABASE_ANON_KEY) {
      const mod = await import('./storage-supabase.js');
      return mod.SupabaseAdapter;
    }
  } catch (err) {
    console.error('Failed to load Supabase adapter:', err);
  }
  // Fallback to local
  const local = await import('./storage-local.js');
  return local.LocalStorageAdapter;
})();

function proxyMethod(name) {
  return async function(...args) {
    const adapter = await adapterPromise;
    if (typeof adapter[name] !== 'function') throw new Error(`Adapter missing method ${name}`);
    return adapter[name](...args);
  };
}

export const Storage = {
  getShelves: proxyMethod('getShelves'),
  createShelf: proxyMethod('createShelf'),
  updateShelf: proxyMethod('updateShelf'),
  deleteShelf: proxyMethod('deleteShelf'),
  getBooks: proxyMethod('getBooks'),
  createBook: proxyMethod('createBook'),
  deleteBook: proxyMethod('deleteBook'),
  exportData: proxyMethod('exportData'),
  importData: proxyMethod('importData'),
  clear: proxyMethod('clear'),
  // auth helpers if provided by adapter
  signIn: proxyMethod('signIn'),
  signOut: proxyMethod('signOut'),
  onAuthChange: proxyMethod('onAuthChange')
};

// Expose Storage on a unique window name for easier debugging in the browser console
// We avoid using `window.Storage` because browsers already define a native Storage interface.
if (typeof window !== 'undefined') {
  try {
    window.MyBiblioStorage = Storage;
    // also expose an alternate name for compatibility/debugging
    window.__MYBIBLIO_STORAGE__ = Storage;
  } catch (e) {
    // ignore
  }
}
