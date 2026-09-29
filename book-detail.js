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
  $('#book-detail-section').style.display = 'block';
  $('#book-not-found').style.display = 'none';

  // Couverture
  const coverDiv = $('#book-detail-cover');
  if (book.cover_image_url) {
    coverDiv.innerHTML = `<img src="${escapeHtml(book.cover_image_url)}" alt="Couverture de ${escapeHtml(book.title)}" style="width: 100%; height: 100%; object-fit: cover;">`;
  } else {
    coverDiv.innerHTML = `<div style="width: 100%; height: 100%; background: ${escapeHtml(shelf?.color || '#334155')}; display: flex; align-items: center; justify-content: center; font-size: 3rem; font-weight: bold; color: white;">${escapeHtml(book.title.slice(0, 1).toUpperCase())}</div>`;
  }

  // Infos
  $('#book-detail-title').textContent = book.title;
  $('#book-detail-author').textContent = book.author || '(Auteur inconnu)';
  $('#book-detail-status').textContent = statusLabels[book.status] || book.status;
  $('#book-detail-shelf').textContent = getShelfName(book.shelf_id);

  // Gestionnaires d'événements
  $('#edit-book-btn').onclick = () => {
    window.location.href = `add.html?edit=${encodeURIComponent(book.id)}`;
  };

  $('#delete-book-btn').onclick = () => {
    showDeleteConfirmation(book);
  };
}

function showDeleteConfirmation(book) {
  $('#delete-confirmation-message').textContent = `Êtes-vous sûr de vouloir supprimer « ${escapeHtml(book.title)} » ?`;
  $('#delete-confirmation-modal').style.display = 'block';
  $('#modal-overlay').style.display = 'block';

  const handleConfirm = async () => {
    try {
      await deleteBook(supabase, book.id);
      // Redirection vers la page précédente ou la page d'accueil
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
    $('#delete-confirmation-modal').style.display = 'none';
    $('#modal-overlay').style.display = 'none';
    $('#confirm-delete-btn').removeEventListener('click', handleConfirm);
    $('#cancel-delete-btn').removeEventListener('click', handleCancel);
    $('#modal-overlay').removeEventListener('click', handleCancel);
  };

  $('#confirm-delete-btn').addEventListener('click', handleConfirm);
  $('#cancel-delete-btn').addEventListener('click', handleCancel);
  $('#modal-overlay').addEventListener('click', handleCancel);
}

async function init() {
  try {
    const user = await currentUser();
    if (!user) throw new Error('not-authenticated');
    
    library = await loadLibrary(supabase, user);
    renderNav();

    // Récupérer l'ID du livre depuis l'URL
    const params = new URLSearchParams(window.location.search);
    const bookId = params.get('book');

    if (!bookId) {
      $('#book-detail-section').style.display = 'none';
      $('#book-not-found').style.display = 'block';
      return;
    }

    const book = library.books.find((b) => String(b.id) === String(bookId));
    if (!book) {
      $('#book-detail-section').style.display = 'none';
      $('#book-not-found').style.display = 'block';
      return;
    }

    renderBookDetail(book);
  } catch (error) {
    console.error(error);
    window.location.replace('auth.html');
  }
}

init();
