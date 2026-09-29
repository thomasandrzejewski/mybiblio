import { supabase, currentUser, signOut } from './supabase.js';
import { loadLibrary, deleteBook, statusLabels } from './data.js';

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));

let library;
let currentBook;

function renderNav() {
  $$('[data-nav]').forEach((link) => link.classList.toggle('active', link.dataset.nav === 'book-detail'));
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

function getShelfName(shelfId) {
  return library.shelves.find((shelf) => shelf.id === shelfId)?.name || 'Sans étagère';
}

function getShelfColor(shelfId) {
  return library.shelves.find((shelf) => shelf.id === shelfId)?.color || '#334155';
}

function renderBookDetail(book) {
  currentBook = book;
  const shelf = library.shelves.find((s) => s.id === book.shelf_id);
  
  // Afficher les éléments
  const detailSection = $('#book-detail-section');
  const notFoundSection = $('#book-not-found');
  if (detailSection) detailSection.style.display = 'block';
  if (notFoundSection) notFoundSection.style.display = 'none';

  // Couverture
  const coverDiv = $('#book-detail-cover');
  if (coverDiv) {
    if (book.cover_image_url) {
      coverDiv.innerHTML = `<img src="${escapeHtml(book.cover_image_url)}" alt="Couverture de ${escapeHtml(book.title)}" style="width: 100%; height: 100%; object-fit: cover;">`;
    } else {
      coverDiv.innerHTML = `<div style="width: 100%; height: 100%; background: ${escapeHtml(shelf?.color || '#334155')}; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: bold; color: white;">${escapeHtml(book.title.slice(0, 1).toUpperCase())}</div>`;
    }
  }

  // Infos
  const titleEl = $('#book-detail-title');
  const authorEl = $('#book-detail-author');
  const statusEl = $('#book-detail-status');
  const shelfEl = $('#book-detail-shelf');

  if (titleEl) titleEl.textContent = book.title;
  if (authorEl) authorEl.textContent = book.author || '(Auteur inconnu)';
  if (statusEl) statusEl.textContent = statusLabels[book.status] || book.status;
  if (shelfEl) shelfEl.textContent = getShelfName(book.shelf_id);

  // Gestionnaires d'événements
  const editBtn = $('#edit-book-btn');
  const deleteBtn = $('#delete-book-btn');

  if (editBtn) {
    editBtn.onclick = () => {
      window.location.href = `add.html?edit=${encodeURIComponent(book.id)}`;
    };
  }

  if (deleteBtn) {
    deleteBtn.onclick = () => {
      showDeleteConfirmation(book);
    };
  }
}

function showDeleteConfirmation(book) {
  const messageEl = $('#delete-confirmation-message');
  const modal = $('#delete-confirmation-modal');
  const overlay = $('#modal-overlay');
  const confirmBtn = $('#confirm-delete-btn');
  const cancelBtn = $('#cancel-delete-btn');

  if (!messageEl || !modal || !overlay || !confirmBtn || !cancelBtn) {
    console.error('Éléments de confirmation de suppression absents.');
    return;
  }

  messageEl.textContent = `Êtes-vous sûr de vouloir supprimer « ${escapeHtml(book.title)} » ?`;
  modal.style.display = 'block';
  overlay.style.display = 'block';

  const handleConfirm = async () => {
    try {
      await deleteBook(supabase, book.id);
      window.location.href = 'index.html';
    } catch (error) {
      console.error(error);
      alert(`Erreur lors de la suppression : ${error.message}`);
      closeDeleteConfirmation();
    }
  };

  const handleCancel = () => {
    closeDeleteConfirmation();
  };

  const closeDeleteConfirmation = () => {
    modal.style.display = 'none';
    overlay.style.display = 'none';
    confirmBtn.removeEventListener('click', handleConfirm);
    cancelBtn.removeEventListener('click', handleCancel);
    overlay.removeEventListener('click', handleCancel);
  };

  confirmBtn.addEventListener('click', handleConfirm);
  cancelBtn.addEventListener('click', handleCancel);
  overlay.addEventListener('click', handleCancel);
}

async function init() {
  try {
    const user = await currentUser();
    if (!user) throw new Error('not-authenticated');

    library = await loadLibrary(supabase, user);

    if (!library || !Array.isArray(library.books)) {
      throw new Error('library not loaded');
    }

    renderNav();

    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('book');

    const detailSection = $('#book-detail-section');
    const notFoundSection = $('#book-not-found');

    if (!bookId) {
      if (detailSection) detailSection.style.display = 'none';
      if (notFoundSection) notFoundSection.style.display = 'block';
      return;
    }

    const book = library.books.find((b) => String(b.id) === String(bookId));
    if (!book) {
      if (detailSection) detailSection.style.display = 'none';
      if (notFoundSection) notFoundSection.style.display = 'block';
      return;
    }

    renderBookDetail(book);
  } catch (error) {
    console.error('Erreur init book-detail :', error);
    // ne pas rediriger immédiatement si c'est juste un bug local
    // on peut afficher un message au lieu de se déconnecter
    const detailSection = $('#book-detail-section');
    const notFoundSection = $('#book-not-found');
    if (detailSection) detailSection.style.display = 'none';
    if (notFoundSection) notFoundSection.style.display = 'block';
    return;
  }
}

init();
