import { supabase, currentUser, signOut } from './supabase.js';
import { loadLibrary, createShelf, updateShelf, deleteShelf } from './data.js';

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
const list = $('#settings-shelves');
const message = $('#shelf-message');
const shelfSelect = $('#shelf-to-manage');
const editButton = $('#edit-shelf-button');
const deleteButton = $('#delete-shelf-button');
const renameForm = $('#rename-shelf-form');
const renameInput = $('#rename-shelf-name');
let library;

function setMessage(text, isError = false) {
  message.textContent = text;
  message.style.color = isError ? '#b42318' : '';
}

function renderNav() {
  document.querySelectorAll('[data-nav]').forEach((link) => link.classList.toggle('active', link.dataset.nav === 'settings'));
  const nav = document.querySelector('nav');
  if (!nav || nav.querySelector('[data-logout]')) return;
  const button = document.createElement('button');
  button.className = 'text-button';
  button.dataset.logout = '';
  button.textContent = 'Déconnexion';
  button.addEventListener('click', async () => {
    await signOut();
    window.location.replace('auth.html');
  });
  nav.append(button);
}

function renderShelves() {
  const selectedShelfId = shelfSelect.value;
  list.innerHTML = library.shelves.length
    ? library.shelves.map((shelf) => `
      <li class="settings-shelf-row">
        <span class="shelf-color" style="background:${escapeHtml(shelf.color || '#334155')}" aria-hidden="true"></span>
        <span class="shelf-name">${escapeHtml(shelf.name)}</span>
      </li>`).join('')
    : '<li class="muted">Aucune étagère pour le moment.</li>';

  shelfSelect.innerHTML = '<option value="">Choisir une étagère</option>' +
    library.shelves.map((shelf) => `<option value="${escapeHtml(shelf.id)}">${escapeHtml(shelf.name)}</option>`).join('');
  if (library.shelves.some((shelf) => String(shelf.id) === selectedShelfId)) {
    shelfSelect.value = selectedShelfId;
  }
  editButton.disabled = !shelfSelect.value;
  deleteButton.disabled = !shelfSelect.value;
}

function selectedShelf() {
  return library.shelves.find((shelf) => String(shelf.id) === shelfSelect.value);
}

renderNav;

$('#new-shelf-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const input = $('#new-shelf');
  const name = input.value.trim();
  if (!name) return;
  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const shelf = await createShelf(supabase, name, library.shelves, $('#shelf-color').value);
    library.shelves.push(shelf);
    input.value = '';
    renderShelves();
    shelfSelect.value = String(shelf.id);
    editButton.disabled = false;
    deleteButton.disabled = false;
    setMessage('Étagère ajoutée.');
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'Impossible de créer cette étagère.', true);
  } finally {
    submitButton.disabled = false;
  }
});

shelfSelect.addEventListener('change', () => {
  editButton.disabled = !shelfSelect.value;
  deleteButton.disabled = !shelfSelect.value;
  renameForm.hidden = true;
});

editButton.addEventListener('click', () => {
  const shelf = selectedShelf();
  if (!shelf) return;
  renameInput.value = shelf.name;
  renameForm.hidden = false;
  renameInput.focus();
  renameInput.select();
});

$('#cancel-rename-shelf').addEventListener('click', () => {
  renameForm.hidden = true;
});

renameForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const shelf = selectedShelf();
  const name = renameInput.value.trim();
  if (!shelf || !name) return;

  const submitButton = renameForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const updated = await updateShelf(supabase, shelf.id, name);
    shelf.name = updated.name;
    renderShelves();
    renameForm.hidden = true;
    setMessage('Étagère renommée.');
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'Impossible de renommer cette étagère.', true);
  } finally {
    submitButton.disabled = false;
  }
});

deleteButton.addEventListener('click', async () => {
  const shelf = selectedShelf();
  if (!shelf || !confirm(`Supprimer l’étagère « ${shelf.name} » ?`)) return;

  deleteButton.disabled = true;
  try {
    await deleteShelf(supabase, shelf.id);
    library.shelves = library.shelves.filter((item) => String(item.id) !== String(shelf.id));
    renameForm.hidden = true;
    renderShelves();
    setMessage('Étagère supprimée.');
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'Impossible de supprimer cette étagère.', true);
    deleteButton.disabled = !shelfSelect.value;
  }
});

try {
  const user = await currentUser();
  if (!user) throw new Error('not-authenticated');
  library = await loadLibrary(supabase, user);
  renderNav();
  renderShelves();
} catch (error) {
  console.error(error);
  window.location.replace('auth.html');
}
