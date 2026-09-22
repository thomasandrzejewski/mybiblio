const initialShelves = [
  { id: 'classiques', name: 'Classiques', color: '#d97706' },
  { id: 'science-fiction', name: 'Science-fiction', color: '#7c3aed' },
  { id: 'romans', name: 'Romans', color: '#0f766e' }
];

const initialBooks = [
  { id: 'book-1', title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', status: 'read', shelfId: 'classiques' },
  { id: 'book-2', title: 'Dune', author: 'Frank Herbert', status: 'reading', shelfId: 'science-fiction' },
  { id: 'book-3', title: 'L’Étranger', author: 'Albert Camus', status: 'to-read', shelfId: 'classiques' },
  { id: 'book-4', title: 'La Horde du Contrevent', author: 'Alain Damasio', status: 'to-read', shelfId: 'romans' }
];

export const statusLabels = {
  reading: 'En cours',
  read: 'Lu',
  'to-read': 'À lire'
};

export function loadLibrary() {
  try {
    const saved = localStorage.getItem('mybiblio-library');
    if (saved) return JSON.parse(saved);
  } catch (error) {
    console.warn('Bibliothèque locale illisible, utilisation des données initiales.', error);
  }
  return { books: initialBooks, shelves: initialShelves };
}

export function saveLibrary(library) {
  localStorage.setItem('mybiblio-library', JSON.stringify(library));
}

export function resetLibrary() {
  const library = { books: initialBooks, shelves: initialShelves };
  saveLibrary(library);
  return library;
}
