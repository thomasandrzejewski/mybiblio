import { loadLibrary, saveLibrary, resetLibrary, statusLabels } from './data.js';

const page = document.body.dataset.page;
let library = loadLibrary();

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
const shelfName = (id) => library.shelves.find((shelf) => shelf.id === id)?.name || 'Sans étagère';

function persist() {
  saveLibrary(library);
}

function bookCard(book, options = {}) {
  const shelf = library.shelves.find((item) => item.id === book.shelfId);
  return `<article class="book-card">
    <div class="book-cover" style="--cover:${shelf?.color || '#334155'}">${escapeHtml(book.title.slice(0, 1).toUpperCase())}</div>
    <div class="book-info">
      <h3>${escapeHtml(book.title)}</h3>
      <p class="author">${escapeHtml(book.author || 'Auteur inconnu')}</p>
      <div class="book-meta"><span class="status status-${book.status}">${statusLabels[book.status]}</span><span>${escapeHtml(shelfName(book.shelfId))}</span></div>
      ${options.delete ? `<button class="text-button danger" data-delete-book="${book.id}">Supprimer</button>` : ''}
    </div>
  </article>`;
}

function renderNav() {
  document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('active', link.dataset.nav === page));
  const count = $('#book-count');
  if (count) count.textContent = `${library.books.length} livre${library.books.length > 1 ? 's' : ''}`;
}

function renderSearch() {
  const input = $('#search-input');
  const results = $('#search-results');
  const render = () => {
    const query = input.value.trim().toLowerCase();
    const books = library.books.filter((book) => !query || `${book.title} ${book.author} ${shelfName(book.shelfId)}`.toLowerCase().includes(query));
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
  $('#add-book-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = form.get('title').trim();
    if (!title) return;
    library.books.unshift({ id: `book-${Date.now()}`, title, author: form.get('author').trim(), status: form.get('status'), shelfId: form.get('shelf') });
    persist();
    event.currentTarget.reset();
    $('#form-message').textContent = 'Livre ajouté à votre bibliothèque.';
    $('#form-message').className = 'form-message success';
    renderNav();
  });
}

function renderShelves() {
  const shelfList = $('#shelf-list');
  const booksPanel = $('#shelf-books');
  const render = (shelfId = 'all') => {
    const books = shelfId === 'all' ? library.books : library.books.filter((book) => book.shelfId === shelfId);
    const title = shelfId === 'all' ? 'Tous les livres' : shelfName(shelfId);
    $('#shelf-title').textContent = title;
    $('#shelf-subtitle').textContent = `${books.length} livre${books.length > 1 ? 's' : ''}`;
    booksPanel.innerHTML = books.length ? books.map((book) => bookCard(book, { delete: true })).join('') : '<div class="empty-state"><strong>Cette étagère est vide</strong><p>Ajoutez un livre pour la remplir.</p></div>';
    shelfList.querySelectorAll('[data-shelf]').forEach((item) => item.classList.toggle('selected', item.dataset.shelf === shelfId));
  };
  shelfList.innerHTML = `<button class="shelf-item selected" data-shelf="all"><span>Toute la bibliothèque</span><b>${library.books.length}</b></button>` + library.shelves.map((shelf) => `<button class="shelf-item" data-shelf="${shelf.id}"><span><i style="background:${shelf.color}"></i>${escapeHtml(shelf.name)}</span><b>${library.books.filter((book) => book.shelfId === shelf.id).length}</b></button>`).join('');
  shelfList.addEventListener('click', (event) => { const item = event.target.closest('[data-shelf]'); if (item) render(item.dataset.shelf); });
  booksPanel.addEventListener('click', (event) => { const button = event.target.closest('[data-delete-book]'); if (!button || !confirm('Supprimer ce livre ?')) return; library.books = library.books.filter((book) => book.id !== button.dataset.deleteBook); persist(); renderNav(); render(); });
  render();
}

function renderSettings() {
  const list = $('#settings-shelves');
  const render = () => { list.innerHTML = library.shelves.map((shelf) => `<li><span><i style="background:${shelf.color}"></i>${escapeHtml(shelf.name)}</span><button class="text-button danger" data-delete-shelf="${shelf.id}">Supprimer</button></li>`).join(''); };
  $('#new-shelf-form').addEventListener('submit', (event) => { event.preventDefault(); const input = $('#new-shelf'); const name = input.value.trim(); if (!name || library.shelves.some((shelf) => shelf.name.toLowerCase() === name.toLowerCase())) return; library.shelves.push({ id: `shelf-${Date.now()}`, name, color: '#2563eb' }); input.value = ''; persist(); render(); });
  list.addEventListener('click', (event) => { const button = event.target.closest('[data-delete-shelf]'); if (!button || !confirm('Supprimer cette étagère ? Les livres seront conservés sans étagère.')) return; library.shelves = library.shelves.filter((shelf) => shelf.id !== button.dataset.deleteShelf); library.books = library.books.map((book) => book.shelfId === button.dataset.deleteShelf ? { ...book, shelfId: '' } : book); persist(); render(); });
  $('#reset-library').addEventListener('click', () => { if (confirm('Réinitialiser toute la bibliothèque avec les données de démonstration ?')) { library = resetLibrary(); render(); renderNav(); } });
  render();
}

renderNav();
if (page === 'search') renderSearch();
if (page === 'add') renderAdd();
if (page === 'shelves') renderShelves();
if (page === 'settings') renderSettings();
