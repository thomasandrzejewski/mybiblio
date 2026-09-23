import { supabase, currentUser, signOut } from './supabase.js';
import { loadLibrary, createShelf, deleteShelf, createBook, deleteBook, resetLibrary, statusLabels } from './data.js';

const page = document.body.dataset.page;
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
let library;
const shelfName = (id) => library.shelves.find((shelf) => shelf.id === id)?.name || 'Sans étagère';
const persistError = (error) => { console.error(error); alert(`Erreur de synchronisation : ${error.message}`); };

function bookCard(book, options = {}) {
  const shelf = library.shelves.find((item) => item.id === book.shelf_id);
  return `<article class="book-card"><div class="book-cover" style="--cover:${shelf?.color || '#334155'}">${escapeHtml(book.title.slice(0, 1).toUpperCase())}</div><div class="book-info"><h3>${escapeHtml(book.title)}</h3><p class="author">${escapeHtml(book.author || 'Auteur inconnu')}</p><div class="book-meta"><span class="status status-${book.status}">${statusLabels[book.status]}</span><span>${escapeHtml(shelfName(book.shelf_id))}</span></div>${options.delete ? `<button class="text-button danger" data-delete-book="${book.id}">Supprimer</button>` : ''}</div></article>`;
}

function renderNav() {
  document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('active', link.dataset.nav === page));
  const nav = document.querySelector('nav');
  if (nav && !nav.querySelector('[data-logout]')) {
    const button = document.createElement('button');
    button.className = 'text-button';
    button.dataset.logout = '';
    button.textContent = 'Déconnexion';
    button.addEventListener('click', async () => { await signOut(); location.href = 'auth.html'; });
    nav.append(button);
  }
}

function renderSearch() {
  const input = $('#search-input');
  const results = $('#search-results');
  const render = () => {
    const query = input.value.trim().toLowerCase();
    const books = library.books.filter((book) => !query || `${book.title} ${book.author || ''} ${shelfName(book.shelf_id)}`.toLowerCase().includes(query));
    results.innerHTML = books.length ? books.map((book) => bookCard(book)).join('') : '<div class="empty-state"><strong>Aucun livre trouvé</strong><p>Essayez un autre titre ou auteur.</p></div>';
    $('#result-count').textContent = `${books.length} résultat${books.length > 1 ? 's' : ''}`;
  };
  input.addEventListener('input', render);
  render();
}

function fillShelves(select) {
  select.innerHTML = '<option value="">Choisir une étagère</option>' + library.shelves.map((shelf) => `<option value="${shelf.id}">${escapeHtml(shelf.name)}</option>`).join('');
}

function renderAdd() {
  fillShelves($('#book-shelf'));
  $('#add-book-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const title = form.get('title').trim();
    if (!title) return;
    try {
      const book = await createBook(supabase, { title, author: form.get('author').trim(), status: form.get('status'), shelf_id: form.get('shelf') || null });
      library.books.unshift(book);
      formElement.reset();
      fillShelves($('#book-shelf'));
      $('#form-message').textContent = 'Livre ajouté à votre bibliothèque.';
    } catch (error) {
      persistError(error);
    }
  });
}

function renderShelves() {
  const shelfList = $('#shelf-list');
  const booksPanel = $('#shelf-books');
  const render = (shelfId = 'all') => {
    const books = shelfId === 'all' ? library.books : library.books.filter((book) => book.shelf_id === shelfId);
    $('#shelf-title').textContent = shelfId === 'all' ? 'Tous les livres' : shelfName(shelfId);
    $('#shelf-subtitle').textContent = `${books.length} livre${books.length > 1 ? 's' : ''}`;
    booksPanel.innerHTML = books.length ? books.map((book) => bookCard(book, { delete: true })).join('') : '<div class="empty-state"><strong>Cette étagère est vide</strong></div>';
    shelfList.querySelectorAll('[data-shelf]').forEach((item) => item.classList.toggle('selected', item.dataset.shelf === shelfId));
  };
  shelfList.innerHTML = `<button class="shelf-item selected" data-shelf="all"><span>Toute la bibliothèque</span><b>${library.books.length}</b></button>` + library.shelves.map((shelf) => `<button class="shelf-item" data-shelf="${shelf.id}"><span>${escapeHtml(shelf.name)}</span><b>${library.books.filter((book) => book.shelf_id === shelf.id).length}</b></button>`).join('');
  shelfList.addEventListener('click', (event) => { const item = event.target.closest('[data-shelf]'); if (item) render(item.dataset.shelf); });
  booksPanel.addEventListener('click', async (event) => { const button = event.target.closest('[data-delete-book]'); if (!button || !confirm('Supprimer ce livre ?')) return; try { await deleteBook(supabase, button.dataset.deleteBook); library.books = library.books.filter((book) => book.id !== button.dataset.deleteBook); render(); } catch (error) { persistError(error); } });
  render();
}

function renderSettings() {
  const list = $('#settings-shelves');
  const render = () => { list.innerHTML = library.shelves.map((shelf) => `<li><span><i style="background:${shelf.color}"></i>${escapeHtml(shelf.name)}</span><button class="text-button danger" data-delete-shelf="${shelf.id}">Supprimer</button></li>`).join(''); };
  $('#new-shelf-form').addEventListener('submit', async (event) => { event.preventDefault(); const input = $('#new-shelf'); const name = input.value.trim(); if (!name) return; try { library.shelves.push(await createShelf(supabase, name, library.shelves)); input.value = ''; render(); } catch (error) { persistError(error); } });
  list.addEventListener('click', async (event) => { const button = event.target.closest('[data-delete-shelf]'); if (!button || !confirm('Supprimer cette étagère ?')) return; try { await deleteShelf(supabase, button.dataset.deleteShelf); library.shelves = library.shelves.filter((shelf) => shelf.id !== button.dataset.deleteShelf); render(); } catch (error) { persistError(error); } });
  $('#reset-library').addEventListener('click', async () => { if (!confirm('Réinitialiser toute la bibliothèque ?')) return; try { library = await resetLibrary(supabase); render(); } catch (error) { persistError(error); } });
  render();
}

try {
  const user = await currentUser();
  if (!user) throw new Error('not-authenticated');
  library = await loadLibrary(supabase, user);
  renderNav(user);
  if (page === 'search') renderSearch();
  if (page === 'add') renderAdd();
  if (page === 'shelves') renderShelves();
  if (page === 'settings') renderSettings();
} catch (error) {
  if (error.message === 'not-authenticated' || error.message?.includes('JWT')) location.href = `auth.html?redirect=${encodeURIComponent(location.pathname.split('/').pop())}`;
  else { console.error(error); alert(error.message); }
}
