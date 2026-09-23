import { supabase, currentUser, signOut } from './supabase.js';
import { loadLibrary, createShelf, updateShelf, deleteShelf, resetLibrary } from './data.js';

const $ = (selector) => document.querySelector(selector);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[char]));
const list = $('#settings-shelves');
const message = $('#shelf-message');
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
  list.innerHTML = library.shelves.length
    ? library.shelves.map((shelf) => `
      <li class="settings-shelf-row" data-shelf-id="${shelf.id}">
        <span class="shelf-color" style="background:${escapeHtml(shelf.color || '#334155')}"></span>
        <form class="rename-shelf-form">
          <label class="sr-only" for="shelf-name-${shelf.id}">Nom de l’étagère</label>
          <input id="shelf-name-${shelf.id}" name="name" value="${escapeHtml(shelf.name)}" required maxlength="80">
          <button class="secondary-button" type="submit">Enregistrer</button>
        </form>
        <button class="text-button danger" type="button" data-delete-shelf>Supprimer</button>
      </li>`).join('')
    : '<li class="muted">Aucune étagère pour le moment.</li>';

  list.querySelectorAll('.rename-shelf-form').forEach((form) => form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const row = event.currentTarget.closest('[data-shelf-id]');
    const shelf = library.shelves.find((item) => String(item.id) === row.dataset.shelfId);
    const name = new FormData(event.currentTarget).get('name').trim();
    if (!shelf || !name) return;
    try {
      const updated = await updateShelf(supabase, shelf.id, name);
      shelf.name = updated.name;
      setMessage('Étagère renommée.');
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'Impossible de renommer cette étagère.', true);
    }
  }));

  list.querySelectorAll('[data-delete-shelf]').forEach((button) => button.addEventListener('click', async (event) => {
    const row = event.currentTarget.closest('[data-shelf-id]');
    const shelf = library.shelves.find((item) => String(item.id) === row.dataset.shelfId);
    if (!shelf || !confirm(`Supprimer l’étagère « ${shelf.name} » ?`)) return;
    try {
      await deleteShelf(supabase, shelf.id);
      library.shelves = library.shelves.filter((item) => item.id !== shelf.id);
      renderShelves();
      setMessage('Étagère supprimée.');
    } catch (error) {
      console.error(error);
      setMessage(error.message || 'Impossible de supprimer cette étagère.', true);
    }
  }));
}

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
    setMessage('Étagère ajoutée.');
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'Impossible de créer cette étagère.', true);
  }
});

$('#reset-library').addEventListener('click', async () => {
  if (!confirm('Supprimer tous les livres et toutes les étagères ?')) return;
  try {
    library = await resetLibrary(supabase);
    renderShelves();
    setMessage('Données réinitialisées.');
  } catch (error) {
    console.error(error);
    setMessage(error.message || 'Impossible de réinitialiser les données.', true);
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
