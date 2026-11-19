import { currentUser } from './supabase.js';

const page = document.body.dataset.page;
const isAdmin = (user) => user?.app_metadata?.role === 'admin';
const allowedUserPages = new Set(['search', 'shelves', 'buy', 'book-detail']);

function applyReadOnlyView() {
  document.querySelectorAll('[data-nav="add"], [data-nav="settings"]').forEach((link) => link.remove());

  // Book cards are rendered dynamically by app.js; remove their write controls
  // whenever a card is added or re-rendered.
  document.querySelectorAll('.book-actions').forEach((actions) => actions.remove());
  document.querySelectorAll('#edit-book-btn, #delete-book-btn').forEach((button) => button.remove());

  // The purchase page is still under construction. Keep only the list area for
  // standard users; there is no purchase-list data loader in the app yet.
  document.querySelector('#purchase-form')?.remove();
  document.querySelectorAll('.purchase-table tr').forEach((row) => row.lastElementChild?.remove());
}

try {
  const user = await currentUser();
  if (!user) {
    window.location.replace('auth.html');
  } else if (!isAdmin(user)) {
    if (!allowedUserPages.has(page)) {
      window.location.replace('index.html');
    } else {
      applyReadOnlyView();
      const observer = new MutationObserver(applyReadOnlyView);
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
} catch (error) {
  console.error('Impossible de vérifier les droits du compte :', error);
  window.location.replace('auth.html');
}
