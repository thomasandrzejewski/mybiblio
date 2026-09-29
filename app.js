import { supabase, currentUser, signOut } from './supabase.js';
import { loadLibrary, createShelf, updateShelf, deleteShelf, createBook, deleteBook, resetLibrary, uploadBookCover, removeBookCover, statusLabels } from './data.js';

const page = document.body.dataset.page;
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
let library;
const shelfName = (id) => library.shelves.find((shelf) => shelf.id === id)?.name || 'Sans étagère';
const persistError = (error) => { console.error(error); alert(`Erreur de synchronisation : ${error.message}`); };

function bookCard(book, options = {}) {
  const shelf = library.shelves.find((item) => item.id === book.shelf_id);
  const cover = book.cover_image_url
    ? `<img src="${escapeHtml(book.cover_image_url)}" alt="Couverture de ${escapeHtml(book.title)}" loading="lazy">`
    : escapeHtml(book.title.slice(0, 1).toUpperCase());
  return `<article class="book-card"><div class="book-cover ${book.cover_image_url ? 'has-image' : ''}" style="--cover:${shelf?.color || '#334155'}">${cover}</div><div class="book-info"><h3>${escapeHtml(book.title)}</h3><p class="muted">${escapeHtml(book.author || '')}</p><div class="meta"><span class="status">${escapeHtml(statusLabels[book.status] || '')}</span><small>${escapeHtml(shelf?.name || '')}</small></div></div></article>`;
}

function renderNav() {
  document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('active', link.dataset.nav === page));
  const nav = document.querySelector('nav');
  if (nav && !nav.querySelector('[data-logout]')) { const button = document.createElement('button'); button.className = 'text-button'; button.dataset.logout = ''; button.textContent = 'Déconnexion'; button.addEventListener('click', async () => { await signOut(supabase); window.location.replace('auth.html'); }); nav.appendChild(button); }
}

function renderSearch() {
  const input = $('#search-input'); const results = $('#search-results');
  const render = () => { const query = input.value.trim().toLowerCase(); const books = library.books.filter((book) => !query || `${book.title} ${book.author || ''} ${shelfName(book.shelf_id)}`.toLowerCase().includes(query)); results.innerHTML = books.map((book) => bookCard(book)).join('') || '<p class="muted">Aucun résultat.</p>'; document.getElementById('result-count').textContent = books.length ? `${books.length} livre(s)` : '' };
  input.addEventListener('input', render); render();
}

function fillShelves(select) { select.innerHTML = '<option value="">Choisir une étagère</option>' + library.shelves.map((shelf) => `<option value="${shelf.id}">${escapeHtml(shelf.name)}</option>`).join(''); }

function renderAdd() {
  fillShelves($('#book-shelf'));
  const coverInput = $('#book-cover'); const preview = $('#cover-preview');
  coverInput?.addEventListener('change', () => { const file = coverInput.files[0]; if (!file) { preview.hidden = true; preview.removeAttribute('src'); return; } preview.src = URL.createObjectURL(file); preview.hidden = false; });
  $('#add-book-form').addEventListener('submit', async (event) => {
    event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); const title = form.get('title').trim(); if (!title) return;
    const button = formElement.querySelector('button[type="submit"]'); button.disabled = true; let uploaded;
    try {
      uploaded = await uploadBookCover(supabase, form.get('cover'));
      const book = await createBook(supabase, { title, author: form.get('author').trim(), status: form.get('status'), shelf_id: form.get('shelf') || null, cover_image_url: uploaded?.url || null });
      library.books.unshift(book); formElement.reset(); preview.hidden = true; preview.removeAttribute('src'); fillShelves($('#book-shelf')); $('#form-message').textContent = 'Livre ajouté à votre bibliothèque.';
    } catch (error) { if (uploaded?.path) await removeBookCover(supabase, uploaded.path); persistError(error); } finally { button.disabled = false; }
  });
}

function renderShelves() {
  const shelfList = $('#shelf-list'); const booksPanel = $('#shelf-books');
  const render = (shelfId = 'all') => { const books = shelfId === 'all' ? library.books : library.books.filter((book) => book.shelf_id === shelfId); $('#shelf-title').textContent = shelfId === 'all' ? 'Tous les livres' : (library.shelves.find((s) => String(s.id) === String(shelfId))?.name || 'Étager'); $('#shelf-subtitle').textContent = shelfId === 'all' ? '' : `${books.length} livre(s)`; booksPanel.innerHTML = books.map((book) => bookCard(book)).join('') || '<p class="muted">Aucun livre sur cette étagère.</p>'; };
  shelfList.innerHTML = `<button class="shelf-item selected" data-shelf="all"><span>Toute la bibliothèque</span><b>${library.books.length}</b></button>` + library.shelves.map((shelf) => `<button class="shelf-item" data-shelf="${shelf.id}"><span>${escapeHtml(shelf.name)}</span><b>${library.books.filter((b) => b.shelf_id === shelf.id).length}</b></button>`).join('');
  shelfList.addEventListener('click', (event) => { const item = event.target.closest('[data-shelf]'); if (item) render(item.dataset.shelf); });
  booksPanel.addEventListener('click', async (event) => { const button = event.target.closest('[data-delete-book]'); if (!button || !confirm('Supprimer ce livre ?')) return; try { const book = library.books.find((b) => String(b.id) === String(button.dataset.bookId)); if (!book) return; await deleteBook(supabase, book.id); library.books = library.books.filter((b) => b.id !== book.id); render(); } catch (error) { persistError(error); } });
  render();
}

function renderSettings() {
  const list = $('#settings-shelves'); const render = () => { list.innerHTML = library.shelves.map((shelf) => `<li><span><i style="background:${shelf.color}"></i>${escapeHtml(shelf.name)}</span><b>${library.books.filter((b) => b.shelf_id === shelf.id).length}</b></li>`).join(''); };
  $('#new-shelf-form').addEventListener('submit', async (event) => { event.preventDefault(); const input = $('#new-shelf'); const name = input.value.trim(); if (!name) return; try { const shelf = await createShelf(supabase, name, library.shelves); library.shelves.push(shelf); input.value = ''; renderShelves(); } catch (error) { persistError(error); } });
  list.addEventListener('click', async (event) => { const button = event.target.closest('[data-delete-shelf]'); if (!button || !confirm('Supprimer cette étagère ?')) return; try { await deleteShelf(supabase, button.dataset.shelfId); library.shelves = library.shelves.filter((s) => String(s.id) !== String(button.dataset.shelfId)); renderShelves(); } catch (error) { persistError(error); } });
  $('#reset-library').addEventListener('click', async () => { if (!confirm('Réinitialiser toute la bibliothèque ?')) return; try { library = await resetLibrary(supabase); render(); } catch (error) { persistError(error); } });
}

try { const user = await currentUser(); if (!user) throw new Error('not-authenticated'); library = await loadLibrary(supabase, user); renderNav(); if (page === 'search') renderSearch(); if (page === 'add') renderAdd(); if (page === 'shelves') renderShelves(); if (page === 'settings') renderSettings(); } catch (error) { console.error(error); window.location.replace('auth.html'); }