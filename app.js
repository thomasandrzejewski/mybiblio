import { supabase, currentUser, signOut } from './supabase.js';
import { loadLibrary, createShelf, updateShelf, deleteShelf, createBook, updateBook, deleteBook, resetLibrary, uploadBookCover, removeBookCover, statusLabels } from './data.js';

const page = document.body.dataset.page;
const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
let library;
const shelfName = (id) => library?.shelves?.find((shelf) => shelf.id === id)?.name || 'Sans étagère';
const persistError = (error) => { console.error(error); alert(`Erreur de synchronisation : ${error.message}`); };

function bookCard(book) {
  const shelf = library.shelves.find((item) => item.id === book.shelf_id);
  const cover = book.cover_image_url
    ? `<img src="${escapeHtml(book.cover_image_url)}" alt="Couverture de ${escapeHtml(book.title)}" loading="lazy">`
    : escapeHtml(book.title.slice(0, 1).toUpperCase());

  return `
  <a href="book-detail.html?book=${escapeHtml(book.id)}" class="book-card-link">
    <article class="book-card" data-book-id="${escapeHtml(book.id)}">
      <div class="book-cover ${book.cover_image_url ? 'has-image' : ''}" style="--cover:${shelf?.color || '#334155'}">
        ${cover}
      </div>
      <div class="book-info">
        <h3>${escapeHtml(book.title)}</h3>
        <p class="muted">${escapeHtml(book.author || '')}</p>
        <div class="meta">
          <span class="status">${escapeHtml(statusLabels[book.status] || '')}</span>
          <small>${escapeHtml(shelf?.name || '')}</small>
        </div>
      </div>

      <div class="book-actions" aria-hidden="false">
        <button class="action-button edit" type="button" data-edit-book data-book-id="${escapeHtml(book.id)}" aria-label="Modifier ${escapeHtml(book.title)}" onclick="event.preventDefault(); event.stopPropagation();">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <title>Modifier</title>
            <path d="M3 21v-3.6L16.6 3.8a1 1 0 0 1 1.4 0l1.2 1.2a1 1 0 0 1 0 1.4L5.6 21H3z" fill="currentColor"/>
            <path d="M20.7 6.3l-1.2-1.2-2.1 2.1 1.2 1.2 2.1-2.1z" fill="currentColor"/>
          </svg>
        </button>

        <button class="action-button delete" type="button" data-delete-book data-book-id="${escapeHtml(book.id)}" aria-label="Supprimer ${escapeHtml(book.title)}" onclick="event.preventDefault(); event.stopPropagation();">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">
            <title>Supprimer</title>
            <path d="M6 6 L18 18 M6 18 L18 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </svg>
        </button>
      </div>
    </article>
  </a>`;
}

function renderNav() {
  document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('active', link.dataset.nav === page));
  const nav = document.querySelector('nav');
  if (nav && !nav.querySelector('[data-logout]')) {
    const button = document.createElement('button');
    button.className = 'text-button';
    button.dataset.logout = '';
    button.textContent = 'Déconnexion';
    button.addEventListener('click', async () => {
      await signOut(supabase);
      window.location.replace('auth.html');
    });
    nav.appendChild(button);
  }
}

function renderSearch() {
  const input = $('#search-input');
  const results = $('#search-results');
  if (!input || !results) return;
  const render = () => {
    const query = input.value.trim().toLowerCase();
    const books = library.books.filter((book) => !query || `${book.title} ${book.author || ''} ${shelfName(book.shelf_id)}`.toLowerCase().includes(query));
    results.innerHTML = books.map((book) => bookCard(book)).join('') || '<p class="muted">Aucun résultat.</p>';
    const count = document.getElementById('result-count');
    if (count) count.textContent = books.length ? `${books.length} livre(s)` : '';
  };
  input.addEventListener('input', render);
  render();
}

function fillShelves(select) {
  if (!select) return;
  select.innerHTML = '<option value="">Choisir une étagère</option>' + library.shelves.map((shelf) => `<option value="${shelf.id}">${escapeHtml(shelf.name)}</option>`).join('');
}

function renderAdd() {
  const form = $('#add-book-form');
  const titleInput = $('#book-title');
  const authorInput = $('#book-author');
  const statusInput = $('#book-status');
  const shelfInput = $('#book-shelf');
  const coverInput = $('#book-cover');
  const preview = $('#cover-preview');
  const pageTitle = $('#page-title');
  const pageSubtitle = $('#page-subtitle');
  const submitBtn = $('#form-submit-btn');
  const formMessage = $('#form-message');

  if (!form || !titleInput || !authorInput || !statusInput || !shelfInput || !coverInput || !preview || !pageTitle || !pageSubtitle || !submitBtn || !formMessage) {
    console.error('Éléments du formulaire d\'ajout absents.');
    return;
  }

  fillShelves(shelfInput);

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('edit');
  const editingBook = editId ? library.books.find((book) => String(book.id) === String(editId)) : null;

  if (editingBook) {
    pageTitle.textContent = 'Modifier le livre';
    pageSubtitle.textContent = 'Mettez à jour les informations de ce livre.';
    submitBtn.textContent = 'Enregistrer les modifications';

    titleInput.value = editingBook.title || '';
    authorInput.value = editingBook.author || '';
    statusInput.value = editingBook.status || 'to-read';
    shelfInput.value = editingBook.shelf_id || '';

    if (editingBook.cover_image_url) {
      preview.src = editingBook.cover_image_url;
      preview.hidden = false;
    }
  }

  coverInput.addEventListener('change', () => {
    const file = coverInput.files[0];
    if (!file) {
      preview.hidden = true;
      preview.removeAttribute('src');
      return;
    }
    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const title = formData.get('title')?.trim();
    if (!title) return;

    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;

    let uploaded;
    let finalCoverUrl = editingBook?.cover_image_url || null;

    try {
      if (coverInput.files[0]) {
        uploaded = await uploadBookCover(supabase, formData.get('cover'));
        finalCoverUrl = uploaded?.url || finalCoverUrl;
      }

      const payload = {
        title,
        author: (formData.get('author') || '').toString().trim(),
        status: formData.get('status'),
        shelf_id: formData.get('shelf') || null,
        cover_image_url: finalCoverUrl,
      };

      if (editingBook) {
        const updatedBook = await updateBook(supabase, editingBook.id, payload);
        const index = library.books.findIndex((book) => String(book.id) === String(editingBook.id));
        if (index !== -1) {
          library.books[index] = { ...library.books[index], ...updatedBook };
        }
        formMessage.textContent = 'Livre mis à jour.';
        setTimeout(() => {
          window.location.href = `book-detail.html?book=${encodeURIComponent(editingBook.id)}`;
        }, 500);
        return;
      }

      const book = await createBook(supabase, payload);
      library.books.unshift(book);
      form.reset();
      preview.hidden = true;
      preview.removeAttribute('src');
      fillShelves(shelfInput);
      formMessage.textContent = 'Livre ajouté à votre bibliothèque.';
    } catch (error) {
      if (uploaded?.path) await removeBookCover(supabase, uploaded.path);
      persistError(error);
    } finally {
      button.disabled = false;
    }
  });
}

function renderShelves() {
  const shelfList = $('#shelf-list');
  const booksPanel = $('#shelf-books');
  if (!shelfList || !booksPanel) return;

  const render = (shelfId = 'all') => {
    const books = shelfId === 'all' ? library.books : library.books.filter((book) => book.shelf_id === shelfId);
    $('#shelf-title').textContent = shelfId === 'all' ? 'Tous les livres' : (library.shelves.find((s) => String(s.id) === String(shelfId))?.name || 'Étagère');
    $('#shelf-subtitle').textContent = shelfId === 'all' ? '' : `${books.length} livre(s)`;
    booksPanel.innerHTML = books.map((book) => bookCard(book)).join('') || '<p class="muted">Aucun livre sur cette étagère.</p>';
  };

  shelfList.innerHTML =
    `<button class="shelf-item selected" data-shelf="all"><span>Toute la bibliothèque</span><b>${library.books.length}</b></button>` +
    library.shelves.map((shelf) => `<button class="shelf-item" data-shelf="${shelf.id}"><span>${escapeHtml(shelf.name)}</span><b>${library.books.filter((b) => b.shelf_id === shelf.id).length}</b></button>`).join('');

  shelfList.addEventListener('click', (event) => {
    const item = event.target.closest('[data-shelf]');
    if (item) render(item.dataset.shelf);
  });

  booksPanel.addEventListener('click', async (event) => {
    const editBtn = event.target.closest('[data-edit-book]');
    if (editBtn) {
      const bookId = editBtn.dataset.bookId;
      const book = library.books.find((b) => String(b.id) === String(bookId));
      if (!book) return;
      window.location.href = `add.html?edit=${encodeURIComponent(bookId)}`;
      return;
    }

    const deleteBtn = event.target.closest('[data-delete-book]');
    if (deleteBtn) {
      const bookId = deleteBtn.dataset.bookId;
      const book = library.books.find((b) => String(b.id) === String(bookId));
      if (!book) return;
      if (!confirm(`Supprimer le livre « ${book.title} » ?`)) return;
      try {
        await deleteBook(supabase, book.id);
        library.books = library.books.filter((b) => b.id !== book.id);
        renderShelves();
      } catch (error) {
        persistError(error);
      }
      return;
    }
  });

  render();
}

function renderSettings() {
  const list = $('#settings-shelves');
  if (!list) return;

  const render = () => {
    list.innerHTML = library.shelves.map((shelf) => `
      <li class="settings-shelf-row" data-shelf-id="${escapeHtml(shelf.id)}">
        <span class="shelf-color" style="background:${escapeHtml(shelf.color || '#334155')}"></span>
        <span class="shelf-name">${escapeHtml(shelf.name)}</span>
        <form class="rename-shelf-form" hidden>
          <label class="sr-only" for="shelf-name-${escapeHtml(shelf.id)}">Nom de l'étagère</label>
          <input id="shelf-name-${escapeHtml(shelf.id)}" name="name" value="${escapeHtml(shelf.name)}" required maxlength="80">
          <button class="secondary-button" type="submit">Enregistrer</button>
          <button class="text-button" type="button" data-cancel-rename>Annuler</button>
        </form>
        <span class="shelf-actions">
          <button class="text-button" type="button" data-edit-shelf aria-label="Modifier ${escapeHtml(shelf.name)}" title="Modifier">✎</button>
          <button class="text-button danger" type="button" data-delete-shelf data-shelf-id="${escapeHtml(shelf.id)}">Supprimer</button>
        </span>
      </li>
    `).join('');
  };

  $('#new-shelf-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = $('#new-shelf');
    const name = input.value.trim();
    if (!name) return;
    try {
      const shelf = await createShelf(supabase, name, library.shelves);
      library.shelves.push(shelf);
      input.value = '';
      renderShelves();
    } catch (error) {
      persistError(error);
    }
  });

  list.addEventListener('click', async (event) => {
    const button = event.target.closest('[data-delete-shelf]');
    if (!button || !confirm('Supprimer cette étagère ?')) return;
    try {
      await deleteShelf(supabase, button.dataset.shelfId);
      library.shelves = library.shelves.filter((s) => String(s.id) !== String(button.dataset.shelfId));
      renderShelves();
    } catch (error) {
      persistError(error);
    }
  });

  $('#reset-library').addEventListener('click', async () => {
    if (!confirm('Réinitialiser toute la bibliothèque ?')) return;
    try {
      library = await resetLibrary(supabase);
      render();
    } catch (error) {
      persistError(error);
    }
  });
}

try {
  const user = await currentUser();
  if (!user) throw new Error('not-authenticated');
  library = await loadLibrary(supabase, user);
  renderNav();
  if (page === 'search') renderSearch();
  if (page === 'add') renderAdd();
  if (page === 'shelves') renderShelves();
  if (page === 'settings') renderSettings();
} catch (error) {
  console.error(error);
  window.location.replace('auth.html');
}
